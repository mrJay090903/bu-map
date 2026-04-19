import { QrCode, Navigation, MapPin, X } from "lucide-react";
import type { Destination, PresetDestination } from "../types/navigation";

type ScannedRouteWelcomeProps = {
  show: boolean;
  startLabel: string;
  destinationLabel: string;
  destination: Destination | null;
  selectedPresetDestination: PresetDestination | null;
  fallbackImage: string;
  onStart: () => void;
  onCancel: () => void;
};

export function ScannedRouteWelcome({
  show,
  startLabel,
  destinationLabel,
  destination,
  selectedPresetDestination,
  fallbackImage,
  onStart,
  onCancel,
}: ScannedRouteWelcomeProps) {
  if (!show) {
    return null;
  }

  const previewImage =
    selectedPresetDestination?.thumbnail ??
    selectedPresetDestination?.image ??
    fallbackImage;
  const previewDescription =
    selectedPresetDestination?.summary ??
    "This shared route includes a destination preview so you can confirm your stop before starting navigation.";

  return (
    <section className="pointer-events-none fixed inset-0 z-[1300] flex items-center justify-center bg-gradient-to-br from-blue-900/90 via-indigo-900/90 to-purple-900/90 backdrop-blur-md px-4 py-6 overflow-y-auto">
      <div className="pointer-events-auto relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-sm max-h-[calc(100vh-3rem)]">
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute -top-12 right-0 text-white/80 hover:text-white transition"
          aria-label="Close"
        >
          <X size={32} />
        </button>

        {/* Main card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_70%)]" />
            
            {/* Animated QR icon */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute w-20 h-20 bg-white/20 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
                <QrCode size={40} className="text-blue-600" />
              </div>
            </div>
            
            <h1 className="relative text-3xl font-bold text-white mb-2">
              QR Route Scanned!
            </h1>
            <p className="relative text-blue-100 text-sm">
              Someone shared this navigation route with you
            </p>
          </div>

          {/* Route details */}
          <div className="px-8 py-8 space-y-6 overflow-y-auto max-h-[calc(100vh-14rem)] sm:px-10 sm:py-10">
            <div className="space-y-4">
              {/* From location */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Starting Point
                  </p>
                  <p className="text-lg font-semibold text-slate-900 truncate">
                    {startLabel}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              <div className="ml-5 border-l-2 border-dashed border-slate-300 h-8" />

              {/* To location */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <MapPin size={20} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Destination
                  </p>
                  <p className="text-lg font-semibold text-slate-900 truncate">
                    {destinationLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900 leading-relaxed">
                <span className="font-semibold">Ready to navigate?</span> This route will guide you from{" "}
                <span className="font-semibold">{startLabel}</span> to{" "}
                <span className="font-semibold">{destinationLabel}</span> using the campus map.
              </p>
            </div>

            {destination ? (
              <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
                <div className="h-36 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  <img
                    src={previewImage}
                    alt={`${destination.label} preview`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Destination preview
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 truncate">
                      {destination.label}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {previewDescription}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onStart}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg transition hover:from-blue-500 hover:to-indigo-500 flex items-center justify-center gap-2"
              >
                <Navigation size={20} />
                Start Navigation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
