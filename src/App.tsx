import { useEffect, useMemo, useRef, useState } from "react";
import { divIcon, type LatLngExpression } from "leaflet";
import { MapPin } from "lucide-react";
import QRCode from "qrcode";
import { renderToStaticMarkup } from "react-dom/server";
import { CampusMapView } from "./components/CampusMapView";
import welcomeRouteImage from "./assets/welcome-route.svg";
import { DestinationListModal } from "./components/DestinationListModal";
import { DestinationPreviewCard } from "./components/DestinationPreviewCard";
import { FloatingActionButtons } from "./components/FloatingActionButtons";
import { NextStopPrompt } from "./components/NextStopPrompt";
import { QrPreviewModal } from "./components/QrPreviewModal";
import { RouteAssistantPanel } from "./components/RouteAssistantPanel";
import { StatusToast } from "./components/StatusToast";
import { TopDirectionBanner } from "./components/TopDirectionBanner";
import { WelcomeModal } from "./components/WelcomeModal";
import { GUARD_HOUSE, PRESET_DESTINATIONS } from "./data/presetDestinations";
import { planBestRoutes } from "./services/routePlanner";
import {
  resolvePresetFromDestination,
  resolvePresetFromPrompt,
} from "./utils/destinationMatcher";
import {
  formatDistance,
  formatDuration,
  compactLabel,
} from "./utils/formatters";
import { calculateBearing } from "./utils/geo";
import {
  buildRoutePacket,
  decodePacket,
  encodePacket,
} from "./utils/routePacket";
import {
  getVoiceRecognitionConstructor,
  type VoiceRecognitionInstance,
} from "./utils/voiceRecognition";
import type {
  Destination,
  EntryMode,
  FocusRequest,
  Point,
  PresetDestination,
  RouteInfo,
} from "./types/navigation";

const MAP_CENTER: LatLngExpression = [GUARD_HOUSE.lat, GUARD_HOUSE.lon];

const PUBLIC_BASE_URL = (import.meta.env.VITE_PUBLIC_BASE_URL ?? "").trim();

function App() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [simulationIndex, setSimulationIndex] = useState<number | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1.25);
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [showNextStopPrompt, setShowNextStopPrompt] = useState(false);
  const [hasArrivedAtDestination, setHasArrivedAtDestination] = useState(false);
  const [currentStartPoint, setCurrentStartPoint] =
    useState<Point>(GUARD_HOUSE);
  const [startLabel, setStartLabel] = useState("Guard House");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [entryMode, setEntryMode] = useState<EntryMode | null>(null);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showDestinationDetails, setShowDestinationDetails] = useState(false);
  const [showDestinationListModal, setShowDestinationListModal] =
    useState(false);
  const voiceRecognitionRef = useRef<VoiceRecognitionInstance | null>(null);

  const isShareLinkPublic = useMemo(() => {
    if (PUBLIC_BASE_URL) {
      return true;
    }

    const host = window.location.hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1";
  }, []);

  const startPoint = currentStartPoint;
  const activeEntryMode = entryMode ?? "quick";
  const voiceRecognitionSupported = useMemo(
    () => getVoiceRecognitionConstructor() !== null,
    [],
  );
  const selectedPresetDestination = useMemo(
    () => resolvePresetFromDestination(destination, PRESET_DESTINATIONS),
    [destination],
  );

  const simulationPoint = useMemo<Point | null>(() => {
    if (!route || simulationIndex === null) {
      return null;
    }

    const maxIndex = route.points.length - 1;
    const boundedIndex = Math.max(0, Math.min(simulationIndex, maxIndex));
    const baseIndex = Math.floor(boundedIndex);
    const nextIndex = Math.min(baseIndex + 1, maxIndex);
    const blend = boundedIndex - baseIndex;
    const from = route.points[baseIndex];
    const to = route.points[nextIndex];

    if (!from || !to) {
      return null;
    }

    return {
      lat: from[0] + (to[0] - from[0]) * blend,
      lon: from[1] + (to[1] - from[1]) * blend,
    };
  }, [route, simulationIndex]);

  const isSimulationRunning = simulationIndex !== null && !isSimulationPaused;
  const canSimulate = Boolean(route && route.points.length > 1);
  const simulationProgress =
    route && simulationIndex !== null && route.points.length > 1
      ? Math.round(
          (Math.max(0, Math.min(simulationIndex, route.points.length - 1)) /
            (route.points.length - 1)) *
            100,
        )
      : 0;

  const headingDegrees = useMemo(() => {
    if (!route || simulationIndex === null) {
      return 0;
    }

    const maxIndex = route.points.length - 1;
    const baseIndex = Math.floor(
      Math.max(0, Math.min(simulationIndex, maxIndex)),
    );
    const current = route.points[baseIndex];
    const next = route.points[Math.min(baseIndex + 1, maxIndex)];
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

  const buildingPinIcon = useMemo(
    () =>
      divIcon({
        html: renderToStaticMarkup(
          <span className="building-pin-inner" aria-hidden="true">
            <MapPin size={16} strokeWidth={2.6} />
          </span>,
        ),
        className: "building-pin-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 20],
        tooltipAnchor: [0, -16],
      }),
    [],
  );

  const applyDestination = (nextDestination: Destination) => {
    setDestination(nextDestination);
    setShowDestinationDetails(true);
    setLocationError(null);
    setFocusRequest({ point: nextDestination, zoom: 17 });
    setSimulationIndex(null);
    setIsSimulationPaused(false);
    setShowNextStopPrompt(false);
    setHasArrivedAtDestination(false);
  };

  const stopVoiceRecognition = () => {
    if (voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stop();
      voiceRecognitionRef.current = null;
    }
    setIsVoiceListening(false);
  };

  const runAiVoiceCommand = (rawCommand: string) => {
    const command = rawCommand.trim();
    if (!command) {
      setLocationError("Voice command did not capture a destination.");
      return;
    }

    const matchedPreset = resolvePresetFromPrompt(command, PRESET_DESTINATIONS);
    if (matchedPreset) {
      applyDestination(matchedPreset);
      setLocationError(null);
      return;
    }

    setLocationError(
      "Voice command recognized, but no preset destination was matched.",
    );
  };

  const onChooseEntryMode = (mode: EntryMode) => {
    setEntryMode(mode);
    setShowWelcomeModal(false);
    setLocationError(null);
    setShowDestinationListModal(mode === "quick");

    if (mode !== "ai") {
      stopVoiceRecognition();
    }

    if (mode === "quick") {
      setShowDestinationDetails(false);
    }
  };

  const onToggleVoiceCommand = () => {
    if (isVoiceListening) {
      stopVoiceRecognition();
      return;
    }

    const RecognitionConstructor = getVoiceRecognitionConstructor();
    if (!RecognitionConstructor) {
      setLocationError(
        "Voice command is not supported in this browser. Use quick destination mode.",
      );
      return;
    }

    const recognition = new RecognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const primaryAlternative = result?.[0];
        if (!primaryAlternative?.transcript) {
          continue;
        }

        if (result.isFinal) {
          finalTranscript += `${primaryAlternative.transcript} `;
        } else {
          interimTranscript += `${primaryAlternative.transcript} `;
        }
      }

      const polishedInterim = interimTranscript.trim();
      void polishedInterim;

      const polishedFinal = finalTranscript.trim();
      if (polishedFinal) {
        runAiVoiceCommand(polishedFinal);
        stopVoiceRecognition();
      }
    };

    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed"
          ? "Microphone permission denied for voice command."
          : event.error === "no-speech"
            ? "No speech detected. Try speaking clearly."
            : "Voice command failed. Please try again.";

      setLocationError(message);
      stopVoiceRecognition();
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
      voiceRecognitionRef.current = null;
    };

    setLocationError(null);
    setIsVoiceListening(true);
    voiceRecognitionRef.current = recognition;
    recognition.start();
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
      setRoute(null);
      setFocusRequest({ point: startFromPacket, zoom: 19 });
      setRouteError(null);
      setEntryMode("quick");
      setShowWelcomeModal(false);
    } catch {
      setRouteError("Shared route packet is invalid or unsupported.");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stop();
        voiceRecognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!destination) {
      setRoute(null);
      setRouteError(null);
      setRouteLoading(false);
      setQrCodeDataUrl(null);
      setShareLink(null);
      setShowQrModal(false);
      setShowDestinationDetails(false);
      setSimulationIndex(null);
      setIsSimulationPaused(false);
      setShowNextStopPrompt(false);
      setHasArrivedAtDestination(false);
      return;
    }

    const controller = new AbortController();
    setRouteLoading(true);
    setRouteError(null);

    const fetchRoute = async () => {
      try {
        const bestRoute = await planBestRoutes(
          startPoint,
          destination,
          controller.signal,
        );

        setRoute(bestRoute);

        setSimulationIndex(null);
        setIsSimulationPaused(false);
        setShowNextStopPrompt(false);
        setHasArrivedAtDestination(false);
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
    if (simulationIndex >= lastIndex - 0.0001) {
      setIsSimulationPaused(true);
      setHasArrivedAtDestination(true);
      setShowNextStopPrompt(true);
      return;
    }

    const tickMs = 40;
    const pointsPerSecond = 2.1 * simulationSpeed;
    const step = (pointsPerSecond * tickMs) / 1000;

    const timer = window.setTimeout(() => {
      setSimulationIndex((prev) => {
        if (prev === null) {
          return null;
        }
        return Math.min(prev + step, lastIndex);
      });
    }, tickMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [route, simulationIndex, isSimulationPaused, simulationSpeed]);

  const visibleStatus = useMemo(() => {
    if (locationError) {
      return locationError;
    }
    if (routeError) {
      return routeError;
    }
    return null;
  }, [locationError, routeError]);

  const onSelectPresetDestination = (place: PresetDestination) => {
    applyDestination(place);
    setShowDestinationListModal(false);
  };

  const onToggleDestinationDetails = () => {
    setShowDestinationDetails((previous) => !previous);
  };

  const onOpenDestinationListModal = () => {
    setShowDestinationListModal(true);
  };

  const onCloseDestinationListModal = () => {
    setShowDestinationListModal(false);
  };

  const onClearRoute = () => {
    setDestination(null);
    setRoute(null);
    setRouteError(null);
    setShowDestinationListModal(false);
    setShowDestinationDetails(false);
    setSimulationIndex(null);
    setIsSimulationPaused(false);
    setShowNextStopPrompt(false);
    setHasArrivedAtDestination(false);
  };

  const onStartSimulation = () => {
    if (!route || route.points.length < 2) {
      return;
    }

    setSimulationIndex(0);
    setIsSimulationPaused(false);
    setShowNextStopPrompt(false);
    setHasArrivedAtDestination(false);
    setGyroEnabled(false);
    setDeviceHeading(null);
    setFocusRequest({
      point: {
        lat: route.points[0][0],
        lon: route.points[0][1],
      },
      zoom: 19,
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
    setHasArrivedAtDestination(false);
    setGyroEnabled(false);
    setDeviceHeading(null);
    setFocusRequest({ point: startPoint, zoom: 18 });
  };

  const onChooseNextDestination = () => {
    if (destination) {
      setCurrentStartPoint({ lat: destination.lat, lon: destination.lon });
      setStartLabel(compactLabel(destination.label));
    }

    setShowNextStopPrompt(false);
    onClearRoute();

    if (activeEntryMode === "quick") {
      setShowDestinationListModal(true);
    }
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

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-100 font-[Manrope] text-slate-900">
      <CampusMapView
        mapCenter={MAP_CENTER}
        focusRequest={focusRequest}
        route={route}
        simulationPoint={simulationPoint}
        isSimulationRunning={isSimulationRunning}
        effectiveHeading={effectiveHeading}
        gyroEnabled={gyroEnabled}
        startPoint={startPoint}
        startLabel={startLabel}
        activeEntryMode={activeEntryMode}
        destinations={PRESET_DESTINATIONS}
        destination={destination}
        buildingPinIcon={buildingPinIcon}
        onSelectPresetDestination={onSelectPresetDestination}
        compactLabel={compactLabel}
      />

      <WelcomeModal
        show={showWelcomeModal}
        onChooseEntryMode={onChooseEntryMode}
        welcomeImage={welcomeRouteImage}
      />

      <TopDirectionBanner
        show={showTopDirectionBanner && Boolean(currentStep)}
        instruction={currentStep?.instruction ?? ""}
        distanceText={currentStep ? formatDistance(currentStep.distance) : ""}
        heading={effectiveHeading}
      />

      <DestinationListModal
        show={showDestinationListModal}
        destination={destination}
        destinations={PRESET_DESTINATIONS}
        onSelectDestination={onSelectPresetDestination}
        onClose={onCloseDestinationListModal}
      />

      <DestinationPreviewCard
        destination={destination}
        selectedPresetDestination={selectedPresetDestination}
        showTopDirectionBanner={showTopDirectionBanner}
        hasArrivedAtDestination={hasArrivedAtDestination}
        showDestinationDetails={showDestinationDetails}
        onToggleDestinationDetails={onToggleDestinationDetails}
        compactLabel={compactLabel}
        fallbackImage={welcomeRouteImage}
      />

      <FloatingActionButtons
        activeEntryMode={activeEntryMode}
        isVoiceListening={isVoiceListening}
        voiceRecognitionSupported={voiceRecognitionSupported}
        startPoint={startPoint}
        onOpenDestinationListModal={onOpenDestinationListModal}
        onToggleVoiceCommand={onToggleVoiceCommand}
        onChangeMode={() => {
          stopVoiceRecognition();
          setShowDestinationListModal(false);
          setShowWelcomeModal(true);
        }}
        onRecenter={(point) => setFocusRequest({ point, zoom: 18 })}
        onClearRoute={onClearRoute}
      />

      <StatusToast message={visibleStatus} />

      <RouteAssistantPanel
        destination={destination}
        startLabel={startLabel}
        routeLoading={routeLoading}
        route={route}
        routeError={routeError}
        formatDistance={formatDistance}
        formatDuration={formatDuration}
        compactLabel={compactLabel}
        simulationSpeed={simulationSpeed}
        onSimulationSpeedChange={setSimulationSpeed}
        simulationProgress={simulationProgress}
        currentStep={currentStep}
        effectiveHeading={effectiveHeading}
        onStartSimulation={onStartSimulation}
        canSimulate={canSimulate}
        onToggleSimulationPause={onToggleSimulationPause}
        simulationIndex={simulationIndex}
        isSimulationPaused={isSimulationPaused}
        onResetSimulation={onResetSimulation}
        onToggleGyroMode={onToggleGyroMode}
        isSimulationRunning={isSimulationRunning}
        gyroEnabled={gyroEnabled}
        qrCodeDataUrl={qrCodeDataUrl}
        shareLink={shareLink}
        isShareLinkPublic={isShareLinkPublic}
        onOpenQrModal={onOpenQrModal}
        onCopyShareLink={onCopyShareLink}
      />

      <NextStopPrompt
        show={showNextStopPrompt}
        destinationLabel={
          destination ? compactLabel(destination.label) : "your destination"
        }
        onStay={() => setShowNextStopPrompt(false)}
        onPickAnother={onChooseNextDestination}
      />

      <QrPreviewModal
        show={showQrModal}
        qrCodeDataUrl={qrCodeDataUrl}
        onClose={onCloseQrModal}
        onCopyShareLink={onCopyShareLink}
      />
    </main>
  );
}

export default App;
