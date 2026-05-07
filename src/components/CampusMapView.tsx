import type { DivIcon, LatLngExpression } from "leaflet";
import type { Polyline as LeafletPolyline } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useEffect, useRef } from "react";
import type {
  Destination,
  EntryMode,
  FocusRequest,
  Point,
  PresetDestination,
  RouteInfo,
} from "../types/navigation";

type CampusMapViewProps = {
  mapCenter: LatLngExpression;
  focusRequest: FocusRequest | null;
  route: RouteInfo | null;
  simulationPoint: Point | null;
  isSimulationRunning: boolean;
  effectiveHeading: number;
  gyroEnabled: boolean;
  startPoint: Point;
  startLabel: string;
  activeEntryMode: EntryMode;
  destinations: PresetDestination[];
  destination: Destination | null;
  buildingPinIcon: DivIcon;
  routeBoundsMode?: "always" | "once" | "off";
  routeBoundsResetKey?: string;
  onSelectPresetDestination: (place: PresetDestination) => void;
  compactLabel: (label: string) => string;
};

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

function RouteBoundsController({
  points,
  mode,
  resetKey,
}: {
  points: [number, number][];
  mode: "always" | "once" | "off";
  resetKey: string;
}) {
  const map = useMap();
  const fittedRef = useRef(false);
  const lastResetKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (resetKey !== lastResetKeyRef.current) {
      fittedRef.current = false;
      lastResetKeyRef.current = resetKey;
    }
  }, [resetKey]);

  useEffect(() => {
    if (mode === "off") {
      return;
    }
    if (points.length < 2) {
      return;
    }

    if (mode === "once" && fittedRef.current) {
      return;
    }

    map.fitBounds(points, { padding: [48, 48] });
    fittedRef.current = true;
  }, [map, mode, points]);

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

function RouteAnimationController({
  animatedPolylineRef,
  points,
}: {
  animatedPolylineRef: React.RefObject<LeafletPolyline | null>;
  points: [number, number][] | null;
}) {
  const frameRef = useRef<number | null>(null);
  const retryRef = useRef<number | null>(null);

  useEffect(() => {
    const polyline = animatedPolylineRef.current;
    if (!polyline || !points || points.length === 0) {
      return;
    }

    let pathElement: SVGPathElement | undefined;
    let startTime = 0;

    const cleanPathStyles = () => {
      if (pathElement) {
        pathElement.style.removeProperty("stroke-dashoffset");
        pathElement.style.removeProperty("stroke-opacity");
      }
    };

    const animate = (timestamp: number) => {
      if (!pathElement) {
        return;
      }

      const elapsed = timestamp - startTime;
      const dashOffset = -((elapsed / 22) % 64);
      const breathe = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed / 350));

      pathElement.style.strokeDashoffset = dashOffset.toFixed(2);
      pathElement.style.strokeOpacity = breathe.toFixed(3);

      frameRef.current = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      const polylinePath = (polyline as any)._path as SVGPathElement | undefined;
      if (!polylinePath) {
        retryRef.current = window.setTimeout(startAnimation, 50);
        return;
      }

      pathElement = polylinePath;
      startTime = performance.now();
      frameRef.current = window.requestAnimationFrame(animate);
    };

    startAnimation();

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (retryRef.current !== null) {
        window.clearTimeout(retryRef.current);
        retryRef.current = null;
      }
      cleanPathStyles();
    };
  }, [animatedPolylineRef, points]);

  return null;
}

export function CampusMapView({
  mapCenter,
  focusRequest,
  route,
  simulationPoint,
  isSimulationRunning,
  effectiveHeading,
  gyroEnabled,
  startPoint,
  // startLabel, // unused
  activeEntryMode,
  destinations,
  destination,
  buildingPinIcon,
  routeBoundsMode = "always",
  routeBoundsResetKey = "",
  onSelectPresetDestination,
  compactLabel,
}: CampusMapViewProps) {
  const animatedPolylineRef = useRef<LeafletPolyline | null>(null);

  return (
    <MapContainer
      className="h-full w-full"
      center={mapCenter}
      zoom={19}
      scrollWheelZoom
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFocusController request={focusRequest} />
      {route?.points ? (
        <RouteBoundsController
          points={route.points}
          mode={routeBoundsMode}
          resetKey={routeBoundsResetKey}
        />
      ) : null}
      <SimulationFollowController
        point={simulationPoint}
        enabled={isSimulationRunning}
        heading={effectiveHeading}
        rotateWithHeading={gyroEnabled}
      />
      <RouteAnimationController
        animatedPolylineRef={animatedPolylineRef}
        points={route?.points ?? null}
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
        <Tooltip direction="top" offset={[0, -12]} permanent>
          📍 You are here
        </Tooltip>
      </CircleMarker>

      {activeEntryMode === "quick"
        ? destinations.map((place) => (
            <CircleMarker
              key={`hit-${place.label}`}
              center={[place.lat, place.lon]}
              radius={15}
              pathOptions={{
                color: "transparent",
                fillColor: "transparent",
                fillOpacity: 0,
              }}
              eventHandlers={{
                click: () => {
                  onSelectPresetDestination(place);
                },
              }}
            />
          ))
        : null}

      {activeEntryMode === "quick"
        ? destinations.map((place) => (
            <Marker
              key={`pin-${place.label}`}
              position={[place.lat, place.lon]}
              icon={buildingPinIcon}
              eventHandlers={{
                click: () => {
                  onSelectPresetDestination(place);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                {compactLabel(place.label)}
              </Tooltip>
            </Marker>
          ))
        : null}

      {destination ? (
        <CircleMarker
          center={[destination.lat, destination.lon]}
          radius={route ? 12 : 8}
          pathOptions={{
            color: route ? "#dc2626" : "#0f172a",
            fillColor: route ? "#fca5a5" : "#f8fafc",
            fillOpacity: 1,
            weight: route ? 3 : 2,
          }}
          className={route ? "destination-highlight" : ""}
        >
          <Tooltip direction="top" offset={[0, -12]} permanent={!!route}>
            {route ? `🎯 ${compactLabel(destination.label)}` : "Destination"}
          </Tooltip>
        </CircleMarker>
      ) : null}

      {route ? (
        <>
          <Polyline
            positions={route.points}
            pathOptions={{
              color: "#0284c7",
              weight: 7,
              opacity: 0.9,
              className: "route-line-base",
            }}
          />
          <Polyline
            ref={animatedPolylineRef}
            positions={route.points}
            pathOptions={{
              color: "#67e8f9",
              weight: 4,
              opacity: 0.95,
              dashArray: "18 14",
              className: "route-line-animated",
            }}
          />
        </>
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
          <Tooltip direction="top" offset={[0, -12]}>
            Debug Walker
          </Tooltip>
        </CircleMarker>
      ) : null}
    </MapContainer>
  );
}
