import type { Destination, Point, RouteInfo, RouteStep } from "../types/navigation";

type Profile = "foot" | "driving";

type OsrmStep = {
  distance: number;
  name: string;
  maneuver?: {
    type?: string;
    modifier?: string;
  };
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
  legs: Array<{
    steps: OsrmStep[];
  }>;
};

type RouteCandidate = {
  profile: Profile;
  route: OsrmRoute;
};

type CacheRecord = {
  updatedAt: number;
  value: RouteInfo;
};

const ROUTE_CACHE = new Map<string, CacheRecord>();
const ROUTE_INFLIGHT = new Map<string, Promise<RouteInfo>>();
const ROUTE_CACHE_TTL_MS = 90_000;
const REQUEST_TIMEOUT_MS = 7_500;

function buildInstruction(step: OsrmStep): string {
  const maneuverType = step.maneuver?.type ?? "continue";
  const modifier = step.maneuver?.modifier;
  const road = step.name ? ` on ${step.name}` : "";

  if (maneuverType === "arrive") {
    return "Arrive at destination";
  }

  if (maneuverType === "depart") {
    return `Head ${modifier ?? "forward"}${road}`;
  }

  if (maneuverType === "turn") {
    return `Turn ${modifier ?? "ahead"}${road}`;
  }

  if (maneuverType === "new name") {
    return `Continue${road}`;
  }

  if (maneuverType === "roundabout") {
    return "Enter the roundabout";
  }

  return `Continue ${modifier ?? "ahead"}${road}`;
}

function toRouteInfo(route: OsrmRoute, profile: Profile): RouteInfo {
  const points: [number, number][] = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
  const steps: RouteStep[] = route.legs.flatMap((leg) =>
    leg.steps.map((step) => ({
      instruction: buildInstruction(step),
      distance: step.distance,
    })),
  );

  return {
    distance: route.distance,
    duration: route.duration,
    profile,
    points,
    steps,
  };
}

function withTimeout(signal: AbortSignal | undefined): AbortSignal {
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    timeoutController.abort();
  }, REQUEST_TIMEOUT_MS);

  if (!signal) {
    timeoutController.signal.addEventListener("abort", () => {
      window.clearTimeout(timeoutId);
    });
    return timeoutController.signal;
  }

  if (signal.aborted) {
    timeoutController.abort();
    window.clearTimeout(timeoutId);
    return timeoutController.signal;
  }

  const combined = new AbortController();

  const abortAll = () => {
    if (!combined.signal.aborted) {
      combined.abort();
    }
    if (!timeoutController.signal.aborted) {
      timeoutController.abort();
    }
    window.clearTimeout(timeoutId);
  };

  signal.addEventListener("abort", abortAll, { once: true });
  timeoutController.signal.addEventListener("abort", abortAll, { once: true });

  combined.signal.addEventListener(
    "abort",
    () => {
      signal.removeEventListener("abort", abortAll);
      timeoutController.signal.removeEventListener("abort", abortAll);
      window.clearTimeout(timeoutId);
    },
    { once: true },
  );

  return combined.signal;
}

async function requestRouteCandidates(
  profile: Profile,
  start: Point,
  destination: Destination,
  signal?: AbortSignal,
  maxAttempts = 2,
): Promise<RouteCandidate[]> {
  const waypoints = `${start.lon},${start.lat};${destination.lon},${destination.lat}`;
  const requestSignal = withTimeout(signal);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${profile}/${waypoints}?overview=full&geometries=geojson&steps=true&alternatives=false`,
        { signal: requestSignal },
      );

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as { routes?: OsrmRoute[] };
      return (data.routes ?? []).map((route) => ({ profile, route }));
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        break;
      }
      if (attempt === maxAttempts - 1) {
        return [];
      }
    }
  }

  return [];
}

function createCacheKey(start: Point, destination: Destination): string {
  return [
    start.lat.toFixed(5),
    start.lon.toFixed(5),
    destination.lat.toFixed(5),
    destination.lon.toFixed(5),
  ].join("|");
}

function getCachedRoute(start: Point, destination: Destination): RouteInfo | null {
  const key = createCacheKey(start, destination);
  const entry = ROUTE_CACHE.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.updatedAt > ROUTE_CACHE_TTL_MS) {
    ROUTE_CACHE.delete(key);
    return null;
  }

  return entry.value;
}

function setCachedRoute(start: Point, destination: Destination, route: RouteInfo): void {
  const key = createCacheKey(start, destination);
  ROUTE_CACHE.set(key, {
    updatedAt: Date.now(),
    value: route,
  });
}

export async function planBestRoutes(
  start: Point,
  destination: Destination,
  signal?: AbortSignal,
): Promise<RouteInfo> {
  const key = createCacheKey(start, destination);

  const cached = getCachedRoute(start, destination);
  if (cached) {
    return cached;
  }

  const inflight = ROUTE_INFLIGHT.get(key);
  if (inflight) {
    return inflight;
  }

  const planPromise = (async () => {
    const [footResult, drivingResult] = await Promise.allSettled([
      requestRouteCandidates("foot", start, destination, signal),
      requestRouteCandidates("driving", start, destination, signal),
    ]);

    const candidates = [
      ...(footResult.status === "fulfilled" ? footResult.value : []),
      ...(drivingResult.status === "fulfilled" ? drivingResult.value : []),
    ].sort((a, b) => a.route.duration - b.route.duration);

    const bestCandidate = candidates[0];
    if (!bestCandidate) {
      throw new Error("No route found for this destination.");
    }

    const bestRoute = toRouteInfo(bestCandidate.route, bestCandidate.profile);
    setCachedRoute(start, destination, bestRoute);
    return bestRoute;
  })();

  ROUTE_INFLIGHT.set(key, planPromise);

  try {
    return await planPromise;
  } finally {
    ROUTE_INFLIGHT.delete(key);
  }
}
