import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { LatLngExpression } from "leaflet";
import QRCode from "qrcode";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

type Point = {
  lat: number;
  lon: number;
};

type Destination = Point & {
  label: string;
};

type Suggestion = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type RouteStep = {
  instruction: string;
  distance: number;
};

type RouteInfo = {
  distance: number;
  duration: number;
  profile: "foot" | "driving";
  points: [number, number][];
  steps: RouteStep[];
};

type RoutePacket = {
  v: 1;
  s: [number, number];
  d: [number, number];
  sl: string;
  dl: string;
  p: "foot" | "driving";
};

type PresetDestination = Destination;

type FocusRequest = {
  point: Point;
  zoom: number;
};

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

const GUARD_HOUSE: Point = { lat: 13.29540325, lon: 123.486557525 };
const MAP_CENTER: LatLngExpression = [GUARD_HOUSE.lat, GUARD_HOUSE.lon];

const PRESET_DESTINATIONS: PresetDestination[] = [
  {
    label: "BUPC Fountain",
    lat: 13.2961752,
    lon: 123.4847694,
  },
  {
    label: "BUP GYM",
    lat: 13.2959792,
    lon: 123.4844938,
  },
  {
    label: "Computer Studies Department",
    lat: 13.2958673,
    lon: 123.4848151,
  },
  {
    label: "Administrative Building",
    lat: 13.2957586,
    lon: 123.4851484,
  },
  {
    label: "Photocopy shop",
    lat: 13.2962074,
    lon: 123.4859508,
  },
];

const PUBLIC_BASE_URL = (import.meta.env.VITE_PUBLIC_BASE_URL ?? "").trim();

function formatDistance(meters: number) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

function compactLabel(label: string) {
  const [first, second] = label.split(",");
  return second ? `${first.trim()}, ${second.trim()}` : first.trim();
}

function buildInstruction(step: OsrmStep) {
  const maneuverType = step.maneuver?.type ?? "continue";
  const modifier = step.maneuver?.modifier;
  const road = step.name ? ` on ${step.name}` : "";
  const distanceText =
    step.distance > 5 ? ` for ${formatDistance(step.distance)}` : "";

  if (maneuverType === "arrive") {
    return "Arrive at destination";
  }

  if (maneuverType === "depart") {
    return `Head ${modifier ?? "forward"}${road}${distanceText}`;
  }

  if (maneuverType === "turn") {
    return `Turn ${modifier ?? "ahead"}${road}${distanceText}`;
  }

  if (maneuverType === "new name") {
    return `Continue${road}${distanceText}`;
  }

  if (maneuverType === "roundabout") {
    return `Enter the roundabout${distanceText}`;
  }

  return `Continue ${modifier ?? "ahead"}${road}${distanceText}`;
}

function clampPrecision(value: number) {
  return Number(value.toFixed(6));
}

function buildRoutePacket({
  start,
  startLabel,
  destination,
}: {
  start: Point;
  startLabel: string;
  destination: Destination;
}): RoutePacket {
  return {
    v: 1,
    s: [clampPrecision(start.lat), clampPrecision(start.lon)],
    d: [clampPrecision(destination.lat), clampPrecision(destination.lon)],
    sl: startLabel,
    dl: compactLabel(destination.label),
    p: "foot",
  };
}

function encodePacket(packet: RoutePacket) {
  const json = JSON.stringify(packet);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodePacket(value: string): RoutePacket {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(paddingLength);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);

  return JSON.parse(json) as RoutePacket;
}

function calculateBearing(from: Point, to: Point) {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLon = ((to.lon - from.lon) * Math.PI) / 180;
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  const theta = Math.atan2(y, x);
  return (theta * 180) / Math.PI >= 0
    ? (theta * 180) / Math.PI
    : (theta * 180) / Math.PI + 360;
}

function MapFocusController({ request }: { request: FocusRequest | null }) {
  const map = useMap();

  useEffect(() => {
    if (!request) {
      return;
    }
    map.flyTo([request.point.lat, request.point.lon], request.zoom, {
      duration: 0.8,
    });
  }, [map, request]);

  return null;
}

function RouteBoundsController({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) {
      return;
    }
    map.fitBounds(points, { padding: [48, 48] });
  }, [map, points]);

  return null;
}

function SimulationFollowController({
  point,
  enabled,
  heading,
  rotateWithHeading,
}: {
  point: Point | null;
  enabled: boolean;
  heading: number;
  rotateWithHeading: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!point || !enabled) {
      return;
    }

    // Centered follow camera, similar to navigation mode.
    map.setView([point.lat, point.lon], Math.max(map.getZoom(), 20), {
      animate: true,
      duration: 0.35,
    });

    const container = map.getContainer();
    if (rotateWithHeading) {
      container.classList.add("sim-nav-mode");
      container.style.setProperty(
        "--map-rotation",
        `${(-heading).toFixed(2)}deg`,
      );
    } else {
      container.classList.remove("sim-nav-mode");
      container.style.removeProperty("--map-rotation");
    }

    return () => {
      if (!rotateWithHeading) {
        container.classList.remove("sim-nav-mode");
        container.style.removeProperty("--map-rotation");
      }
    };
  }, [map, point, enabled, heading, rotateWithHeading]);

  return null;
}

function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [destination, setDestination] = useState<Destination | null>(null);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [simulationIndex, setSimulationIndex] = useState<number | null>(null);
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [showNextStopPrompt, setShowNextStopPrompt] = useState(false);
  const [currentStartPoint, setCurrentStartPoint] =
    useState<Point>(GUARD_HOUSE);
  const [startLabel, setStartLabel] = useState("Guard House");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  const isShareLinkPublic = useMemo(() => {
    if (PUBLIC_BASE_URL) {
      return true;
    }

    const host = window.location.hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1";
  }, []);

  const startPoint = currentStartPoint;

  const simulationPoint = useMemo<Point | null>(() => {
    if (!route || simulationIndex === null) {
      return null;
    }

    const boundedIndex = Math.min(simulationIndex, route.points.length - 1);
    const point = route.points[boundedIndex];
    if (!point) {
      return null;
    }

    return {
      lat: point[0],
      lon: point[1],
    };
  }, [route, simulationIndex]);

  const isSimulationRunning = simulationIndex !== null && !isSimulationPaused;
  const canSimulate = Boolean(route && route.points.length > 1);
  const simulationProgress =
    route && simulationIndex !== null && route.points.length > 1
      ? Math.round((simulationIndex / (route.points.length - 1)) * 100)
      : 0;

  const headingDegrees = useMemo(() => {
    if (!route || simulationIndex === null) {
      return 0;
    }

    const current = route.points[simulationIndex];
    const next =
      route.points[Math.min(simulationIndex + 1, route.points.length - 1)];
    if (!current || !next) {
      return 0;
    }

    return calculateBearing(
      { lat: current[0], lon: current[1] },
      { lat: next[0], lon: next[1] },
    );
  }, [route, simulationIndex]);

  const effectiveHeading =
    gyroEnabled && deviceHeading !== null ? deviceHeading : headingDegrees;

  const currentStepIndex =
    route && simulationIndex !== null && route.steps.length > 0
      ? Math.min(
          Math.floor(
            (simulationIndex / Math.max(route.points.length - 1, 1)) *
              route.steps.length,
          ),
          route.steps.length - 1,
        )
      : -1;

  const currentStep =
    currentStepIndex >= 0 && route ? route.steps[currentStepIndex] : null;

  const showTopDirectionBanner = isSimulationRunning && currentStep !== null;

  const applyDestination = (nextDestination: Destination) => {
    setDestination(nextDestination);
    setQuery(compactLabel(nextDestination.label));
    setSuggestions([]);
    setSelectedIndex(-1);
    setFocusRequest({ point: nextDestination, zoom: 16 });
    setSimulationIndex(null);
    setIsSimulationPaused(false);
    setShowNextStopPrompt(false);
  };

  useEffect(() => {
    if (!gyroEnabled) {
      setDeviceHeading(null);
      return;
    }

    const onOrientation = (event: DeviceOrientationEvent) => {
      const webkitHeading = (
        event as DeviceOrientationEvent & { webkitCompassHeading?: number }
      ).webkitCompassHeading;

      if (typeof webkitHeading === "number") {
        setDeviceHeading(webkitHeading);
        return;
      }

      if (typeof event.alpha === "number") {
        setDeviceHeading((360 - event.alpha + 360) % 360);
      }
    };

    window.addEventListener("deviceorientation", onOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation, true);
    };
  }, [gyroEnabled]);

  useEffect(() => {
    const packetValue = new URLSearchParams(window.location.search).get(
      "packet",
    );
    if (!packetValue) {
      return;
    }

    try {
      const packet = decodePacket(packetValue);
      if (packet.v !== 1) {
        throw new Error("Invalid packet content");
      }

      const startFromPacket = { lat: packet.s[0], lon: packet.s[1] };
      const destinationFromPacket: Destination = {
        lat: packet.d[0],
        lon: packet.d[1],
        label: packet.dl,
      };

      setCurrentStartPoint(startFromPacket);
      setStartLabel(packet.sl || "Shared Start");
      setDestination(destinationFromPacket);
      setQuery(packet.dl);
      setRoute(null);
      setFocusRequest({ point: startFromPacket, zoom: 18 });
      setRouteError(null);
    } catch {
      setRouteError("Shared route packet is invalid or unsupported.");
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    setSearchLoading(true);
    setSearchError(null);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(trimmed)}`,
          {
            signal: controller.signal,
            headers: {
              "Accept-Language": "en",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load destination suggestions.");
        }

        const result = (await response.json()) as Suggestion[];
        setSuggestions(result);
        setSelectedIndex(result.length > 0 ? 0 : -1);
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setSearchError("Could not search places right now.");
        setSuggestions([]);
        setSelectedIndex(-1);
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 420);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!destination) {
      setRoute(null);
      setRouteError(null);
      setRouteLoading(false);
      setQrCodeDataUrl(null);
      setShareLink(null);
      setShowQrModal(false);
      setSimulationIndex(null);
      setIsSimulationPaused(false);
      setShowNextStopPrompt(false);
      return;
    }

    const controller = new AbortController();
    setRouteLoading(true);
    setRouteError(null);

    const fetchRoute = async () => {
      try {
        let firstRoute: OsrmRoute | undefined;
        let selectedProfile: "foot" | "driving" = "driving";

        for (const profile of ["foot", "driving"] as const) {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/${profile}/${startPoint.lon},${startPoint.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&steps=true`,
            { signal: controller.signal },
          );

          if (!response.ok) {
            continue;
          }

          const data = (await response.json()) as { routes?: OsrmRoute[] };
          if (data.routes?.[0]) {
            firstRoute = data.routes[0];
            selectedProfile = profile;
            break;
          }
        }

        if (!firstRoute) {
          throw new Error("No route found for this destination.");
        }

        const points: [number, number][] = firstRoute.geometry.coordinates.map(
          ([lon, lat]) => [lat, lon],
        );
        const steps = firstRoute.legs.flatMap((leg) =>
          leg.steps.map((step) => ({
            instruction: buildInstruction(step),
            distance: step.distance,
          })),
        );

        setRoute({
          distance: firstRoute.distance,
          duration: firstRoute.duration,
          profile: selectedProfile,
          points,
          steps,
        });

        setSimulationIndex(null);
        setIsSimulationPaused(false);
        setShowNextStopPrompt(false);
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setRoute(null);
        setRouteError("Could not build a route. Try a different destination.");
      } finally {
        if (!controller.signal.aborted) {
          setRouteLoading(false);
        }
      }
    };

    void fetchRoute();

    return () => {
      controller.abort();
    };
  }, [destination, startPoint.lat, startPoint.lon]);

  useEffect(() => {
    if (!route || !destination) {
      setQrCodeDataUrl(null);
      setShareLink(null);
      setShowQrModal(false);
      return;
    }

    let isActive = true;

    const buildQr = async () => {
      const packet = buildRoutePacket({
        start: startPoint,
        startLabel,
        destination,
      });
      const encoded = encodePacket(packet);
      const shareUrl = PUBLIC_BASE_URL
        ? new URL(PUBLIC_BASE_URL)
        : new URL(window.location.href);
      shareUrl.pathname = window.location.pathname;
      shareUrl.search = "";
      shareUrl.searchParams.set("packet", encoded);

      try {
        const dataUrl = await QRCode.toDataURL(shareUrl.toString(), {
          width: 640,
          margin: 1,
          errorCorrectionLevel: "M",
        });

        if (!isActive) {
          return;
        }

        setQrCodeDataUrl(dataUrl);
        setShareLink(shareUrl.toString());
      } catch {
        if (!isActive) {
          return;
        }

        setQrCodeDataUrl(null);
        setShareLink(null);
      }
    };

    void buildQr();

    return () => {
      isActive = false;
    };
  }, [route, destination, startPoint, startLabel]);

  useEffect(() => {
    if (!route || simulationIndex === null || isSimulationPaused) {
      return;
    }

    const lastIndex = route.points.length - 1;
    if (simulationIndex >= lastIndex) {
      setIsSimulationPaused(true);
      if (destination) {
        setCurrentStartPoint({ lat: destination.lat, lon: destination.lon });
        setStartLabel(compactLabel(destination.label));
      }
      setShowNextStopPrompt(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setSimulationIndex((prev) => {
        if (prev === null) {
          return null;
        }
        return Math.min(prev + 1, lastIndex);
      });
    }, 260);

    return () => {
      window.clearTimeout(timer);
    };
  }, [route, simulationIndex, isSimulationPaused, destination]);

  const visibleStatus = useMemo(() => {
    if (locationError) {
      return locationError;
    }
    if (searchError) {
      return searchError;
    }
    if (routeError) {
      return routeError;
    }
    return null;
  }, [locationError, searchError, routeError]);

  const onSelectSuggestion = (item: Suggestion) => {
    const nextDestination: Destination = {
      lat: Number(item.lat),
      lon: Number(item.lon),
      label: item.display_name,
    };
    applyDestination(nextDestination);
  };

  const onSelectPresetDestination = (place: PresetDestination) => {
    applyDestination(place);
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === "Enter" && selectedIndex >= 0) {
      event.preventDefault();
      onSelectSuggestion(suggestions[selectedIndex]);
    }
  };

  const onClearRoute = () => {
    setDestination(null);
    setRoute(null);
    setRouteError(null);
    setSuggestions([]);
    setSelectedIndex(-1);
    setQuery("");
    setSimulationIndex(null);
    setIsSimulationPaused(false);
    setShowNextStopPrompt(false);
  };

  const onStartSimulation = () => {
    if (!route || route.points.length < 2) {
      return;
    }

    setSimulationIndex(0);
    setIsSimulationPaused(false);
    setShowNextStopPrompt(false);
    setGyroEnabled(false);
    setDeviceHeading(null);
    setFocusRequest({
      point: {
        lat: route.points[0][0],
        lon: route.points[0][1],
      },
      zoom: 18,
    });
  };

  const onToggleSimulationPause = () => {
    if (simulationIndex === null) {
      return;
    }
    setIsSimulationPaused((prev) => !prev);
  };

  const onResetSimulation = () => {
    setSimulationIndex(null);
    setIsSimulationPaused(false);
    setShowNextStopPrompt(false);
    setGyroEnabled(false);
    setDeviceHeading(null);
    setFocusRequest({ point: startPoint, zoom: 17 });
  };

  const onChooseNextDestination = () => {
    setShowNextStopPrompt(false);
    onClearRoute();
  };

  const onCopyShareLink = async () => {
    if (!shareLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setLocationError(
        "Share link copied. Open it on another device to follow this route.",
      );
    } catch {
      setLocationError("Could not copy share link on this browser.");
    }
  };

  const onOpenQrModal = () => {
    if (!qrCodeDataUrl) {
      return;
    }
    setShowQrModal(true);
  };

  const onCloseQrModal = () => {
    setShowQrModal(false);
  };

  const onToggleGyroMode = async () => {
    if (gyroEnabled) {
      setGyroEnabled(false);
      setDeviceHeading(null);
      return;
    }

    if (
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    ) {
      setLocationError("Gyroscope is not supported on this device/browser.");
      return;
    }

    const permissionRequester = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };

    if (typeof permissionRequester.requestPermission === "function") {
      try {
        const permission = await permissionRequester.requestPermission();
        if (permission !== "granted") {
          setLocationError("Gyroscope permission was denied.");
          return;
        }
      } catch {
        setLocationError("Could not request gyroscope permission.");
        return;
      }
    }

    setGyroEnabled(true);
    setLocationError(null);
  };

  const onLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not available in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPoint = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setFocusRequest({ point: nextPoint, zoom: 17 });
        setLocationError(null);
        setLocating(false);
      },
      () => {
        setLocationError("Could not refresh your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-100 font-[Manrope] text-slate-900">
      <MapContainer
        className="h-full w-full"
        center={MAP_CENTER}
        zoom={18}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFocusController request={focusRequest} />
        {route?.points ? <RouteBoundsController points={route.points} /> : null}
        <SimulationFollowController
          point={simulationPoint}
          enabled={isSimulationRunning}
          heading={effectiveHeading}
          rotateWithHeading={gyroEnabled}
        />

        <CircleMarker
          center={[startPoint.lat, startPoint.lon]}
          radius={8}
          pathOptions={{
            color: "#0ea5e9",
            fillColor: "#22d3ee",
            fillOpacity: 0.9,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -12]}>
            {startLabel}
          </Tooltip>
        </CircleMarker>

        {destination ? (
          <CircleMarker
            center={[destination.lat, destination.lon]}
            radius={8}
            pathOptions={{
              color: "#0f172a",
              fillColor: "#f8fafc",
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]}>
              Destination
            </Tooltip>
          </CircleMarker>
        ) : null}

        {route ? (
          <Polyline
            positions={route.points}
            pathOptions={{ color: "#0284c7", weight: 7, opacity: 0.9 }}
          />
        ) : null}

        {simulationPoint ? (
          <CircleMarker
            center={[simulationPoint.lat, simulationPoint.lon]}
            radius={7}
            pathOptions={{
              color: "#b45309",
              fillColor: "#facc15",
              fillOpacity: 0.95,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]}>
              Debug Walker
            </Tooltip>
          </CircleMarker>
        ) : null}
      </MapContainer>

      {showTopDirectionBanner && currentStep ? (
        <section className="pointer-events-none absolute inset-x-0 top-3 z-[920] mx-auto w-[min(94vw,760px)] overlay-enter">
          <div className="pointer-events-auto rounded-2xl bg-[#1a73e8] px-4 py-3 text-white shadow-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">
              Next Turn
            </p>
            <p className="text-sm font-semibold leading-relaxed">
              {currentStep.instruction}
            </p>
            <p className="mt-1 text-xs text-blue-100">
              {formatDistance(currentStep.distance)} • Heading{" "}
              {Math.round(effectiveHeading)}°
            </p>
          </div>
        </section>
      ) : null}

      <section
        className={`pointer-events-none absolute inset-x-0 z-[900] mx-auto w-[min(92vw,720px)] overlay-enter ${showTopDirectionBanner ? "top-24" : "top-4"}`}
      >
        <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Where do you want to go?"
              aria-label="Search destination"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={onLocateMe}
              aria-label="Locate me"
              className="h-12 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
              disabled={locating}
            >
              {locating ? "Locating" : "Locate"}
            </button>
          </div>

          <div className="mt-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Quick destinations
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PRESET_DESTINATIONS.map((place) => {
                const active =
                  destination &&
                  Math.abs(destination.lat - place.lat) < 0.000001 &&
                  Math.abs(destination.lon - place.lon) < 0.000001;

                return (
                  <button
                    key={place.label}
                    type="button"
                    onClick={() => onSelectPresetDestination(place)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {place.label}
                  </button>
                );
              })}
            </div>
          </div>

          {searchLoading ? (
            <p className="mt-2 text-xs text-slate-600">Searching places...</p>
          ) : null}

          {suggestions.length > 0 ? (
            <ul className="mt-3 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white">
              {suggestions.map((item, index) => (
                <li key={item.place_id}>
                  <button
                    type="button"
                    onClick={() => onSelectSuggestion(item)}
                    className={`w-full border-b border-slate-200 px-4 py-3 text-left text-sm text-slate-800 transition last:border-b-0 ${selectedIndex === index ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    {compactLabel(item.display_name)}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <aside className="pointer-events-none absolute right-4 bottom-6 z-[900] flex flex-col gap-3 md:right-[404px]">
        <button
          type="button"
          onClick={() => setFocusRequest({ point: startPoint, zoom: 17 })}
          className="pointer-events-auto h-12 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-lg transition hover:bg-slate-100"
        >
          Recenter
        </button>
        <button
          type="button"
          onClick={onClearRoute}
          className="pointer-events-auto h-12 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-lg transition hover:bg-slate-100"
        >
          Clear route
        </button>
      </aside>

      {visibleStatus ? (
        <div className="pointer-events-none absolute left-4 bottom-[44vh] z-[900] rounded-lg border border-amber-300/40 bg-amber-100/90 px-3 py-2 text-xs font-semibold text-amber-900 shadow-lg md:bottom-4 md:left-4 md:max-w-xs">
          {visibleStatus}
        </div>
      ) : null}

      <section className="pointer-events-auto absolute right-0 bottom-0 z-[900] flex max-h-[44vh] w-full flex-col rounded-t-3xl border border-slate-300/30 bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur-md overlay-enter md:top-4 md:right-4 md:bottom-4 md:max-h-none md:w-[380px] md:rounded-2xl">
        <header className="mb-3 border-b border-slate-200 pb-3">
          <p className="font-[Sora] text-lg font-semibold">
            BU Route Assistant
          </p>
          <p className="mt-1 text-xs text-slate-600">From: {startLabel}</p>
          {destination ? (
            <p className="mt-1 text-xs text-slate-600">
              To: {compactLabel(destination.label)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              Set your destination to get started.
            </p>
          )}
        </header>

        {routeLoading ? (
          <div className="space-y-2">
            <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {!routeLoading && route ? (
          <>
            <div className="mb-3 flex gap-2">
              <div className="rounded-lg bg-cyan-100 px-3 py-2 text-sm font-semibold text-cyan-900">
                {formatDistance(route.distance)}
              </div>
              <div className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-900">
                {formatDuration(route.duration)}
              </div>
              <div className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-900">
                {route.profile === "foot" ? "Walking" : "Driving fallback"}
              </div>
            </div>

            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Debug Tools
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Simulate walking from start to destination.
              </p>
              <p className="mt-1 text-xs font-medium text-amber-800">
                Progress: {simulationProgress}%
              </p>
              {currentStep ? (
                <p className="mt-1 rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
                  Nav cam {Math.round(effectiveHeading)}° ·{" "}
                  {currentStep.instruction}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onStartSimulation}
                  disabled={!canSimulate}
                  className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-amber-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Start walk sim
                </button>
                <button
                  type="button"
                  onClick={onToggleSimulationPause}
                  disabled={simulationIndex === null}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSimulationPaused ? "Resume" : "Pause"}
                </button>
                <button
                  type="button"
                  onClick={onResetSimulation}
                  disabled={simulationIndex === null}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onToggleGyroMode}
                  disabled={!isSimulationRunning}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {gyroEnabled ? "Disable Gyro" : "Enable Gyro"}
                </button>
              </div>
            </div>

            {qrCodeDataUrl && shareLink ? (
              <div className="mb-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                  Share Route QR
                </p>
                <p className="mt-1 text-xs text-cyan-800">
                  Optimized packet includes only start and destination data. The
                  app recomputes directions after opening for reliable scan
                  links.
                </p>
                {!isShareLinkPublic ? (
                  <p className="mt-1 text-xs font-semibold text-amber-700">
                    This link is localhost-only. Set VITE_PUBLIC_BASE_URL to
                    your LAN/public URL (for example: http://192.168.1.2:5177)
                    before generating QR for other devices.
                  </p>
                ) : null}
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR code to follow this route"
                    className="h-24 w-24 rounded-md border border-cyan-200 bg-white p-1"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={onOpenQrModal}
                      className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-cyan-950 transition hover:bg-cyan-400"
                    >
                      Open large QR
                    </button>
                    <button
                      type="button"
                      onClick={onCopyShareLink}
                      className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-cyan-800 ring-1 ring-cyan-300 transition hover:bg-cyan-100"
                    >
                      Copy share link
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <ol className="route-panel-scroll space-y-2 overflow-y-auto pr-1">
              {route.steps.map((step, index) => (
                <li
                  key={`${step.instruction}-${index}`}
                  className="step-reveal rounded-lg border border-slate-200 bg-slate-50 p-3"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <p className="text-sm font-medium leading-relaxed text-slate-800">
                    {index + 1}. {step.instruction}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDistance(step.distance)}
                  </p>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        {!routeLoading && !route && !routeError ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100 p-4 text-sm text-slate-600">
            Route details will appear here after selecting a destination.
          </div>
        ) : null}

        {!routeLoading && routeError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {routeError}
          </div>
        ) : null}
      </section>

      {showNextStopPrompt ? (
        <section className="pointer-events-none absolute inset-0 z-[980] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/30 bg-slate-900/90 p-5 text-slate-50 shadow-2xl backdrop-blur-md">
            <p className="font-[Sora] text-lg font-semibold">You arrived!</p>
            <p className="mt-2 text-sm text-slate-200">
              Where do you want to go next?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onChooseNextDestination}
                className="flex-1 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Choose next destination
              </button>
              <button
                type="button"
                onClick={() => setShowNextStopPrompt(false)}
                className="rounded-xl border border-slate-500 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
              >
                Stay here
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {showQrModal && qrCodeDataUrl ? (
        <section className="pointer-events-none absolute inset-0 z-[990] flex items-center justify-center bg-slate-950/75 p-4">
          <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-cyan-300/40 bg-slate-900/95 p-5 text-slate-50 shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-[Sora] text-lg font-semibold">
                  Scan Route QR
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Use another device to open this exact route packet.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseQrModal}
                className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex justify-center">
              <img
                src={qrCodeDataUrl}
                alt="Large QR code to follow this route"
                className="h-[min(72vw,420px)] w-[min(72vw,420px)] rounded-xl border border-cyan-200 bg-white p-2"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCopyShareLink}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Copy share link
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default App;
