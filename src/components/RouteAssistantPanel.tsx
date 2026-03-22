import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Destination, RouteInfo, RouteStep } from "../types/navigation";

type RouteAssistantPanelProps = {
  destination: Destination | null;
  startLabel: string;
  routeLoading: boolean;
  route: RouteInfo | null;
  routeError: string | null;
  formatDistance: (meters: number) => string;
  formatDuration: (seconds: number) => string;
  compactLabel: (label: string) => string;
  simulationSpeed: number;
  onSimulationSpeedChange: (value: number) => void;
  simulationProgress: number;
  currentStep: RouteStep | null;
  effectiveHeading: number;
  onStartSimulation: () => void;
  canSimulate: boolean;
  onToggleSimulationPause: () => void;
  simulationIndex: number | null;
  isSimulationPaused: boolean;
  onResetSimulation: () => void;
  onToggleGyroMode: () => void;
  isSimulationRunning: boolean;
  gyroEnabled: boolean;
  qrCodeDataUrl: string | null;
  shareLink: string | null;
  isShareLinkPublic: boolean;
  onOpenQrModal: () => void;
  onCopyShareLink: () => void;
};

export function RouteAssistantPanel({
  destination,
  startLabel,
  routeLoading,
  route,
  routeError,
  formatDistance,
  formatDuration,
  compactLabel,
  simulationSpeed,
  onSimulationSpeedChange,
  simulationProgress,
  currentStep,
  effectiveHeading,
  onStartSimulation,
  canSimulate,
  onToggleSimulationPause,
  simulationIndex,
  isSimulationPaused,
  onResetSimulation,
  onToggleGyroMode,
  isSimulationRunning,
  gyroEnabled,
  qrCodeDataUrl,
  shareLink,
  isShareLinkPublic,
  onOpenQrModal,
  onCopyShareLink,
}: RouteAssistantPanelProps) {
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true);

  return (
    <section
      className={`pointer-events-auto absolute right-0 bottom-0 z-900 flex w-full flex-col overflow-hidden rounded-t-3xl border border-slate-300/30 bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur-md overlay-enter transition-[max-height] duration-200 md:top-4 md:right-4 md:bottom-4 md:max-h-[calc(100vh-2rem)] md:w-95 md:rounded-2xl ${
        isMobileCollapsed ? "max-h-[18vh]" : "max-h-[68vh]"
      }`}
    >
      <header className="mb-3 border-b border-slate-200 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-[Sora] text-lg font-semibold">
              BU Route Assistant
            </p>
            <p className="mt-1 text-xs text-slate-600">From: {startLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileCollapsed((previous) => !previous)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 md:hidden"
            aria-expanded={!isMobileCollapsed}
            aria-label={
              isMobileCollapsed ? "Expand route panel" : "Collapse route panel"
            }
          >
            <span className="inline-flex items-center gap-1">
              {isMobileCollapsed ? "Open" : "Hide"}
              {isMobileCollapsed ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </span>
          </button>
        </div>
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

      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 ${
          isMobileCollapsed ? "hidden md:block" : "block"
        }`}
      >
        {routeLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 rounded-xl border border-blue-200 bg-blue-50 py-8 px-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-center">
              <p className="text-sm font-semibold text-blue-900">
                Calculating the fastest route...
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Finding the best path to your destination
              </p>
            </div>
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
              <div className="mt-2 rounded-lg border border-amber-200 bg-white p-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  Walk speed: {simulationSpeed.toFixed(2)}x
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.25}
                  value={simulationSpeed}
                  onChange={(event) =>
                    onSimulationSpeedChange(Number(event.target.value))
                  }
                  className="mt-1 w-full accent-amber-500"
                />
              </div>
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

            <ol className="route-panel-scroll space-y-2">
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
      </div>
    </section>
  );
}
