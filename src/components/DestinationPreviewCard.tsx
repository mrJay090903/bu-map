import type { Destination, PresetDestination } from "../types/navigation";

type DestinationPreviewCardProps = {
  destination: Destination | null;
  selectedPresetDestination: PresetDestination | null;
  showTopDirectionBanner: boolean;
  hasArrivedAtDestination: boolean;
  showDestinationDetails: boolean;
  onToggleDestinationDetails: () => void;
  compactLabel: (label: string) => string;
  fallbackImage: string;
};

export function DestinationPreviewCard({
  destination,
  selectedPresetDestination,
  showTopDirectionBanner,
  hasArrivedAtDestination,
  showDestinationDetails,
  onToggleDestinationDetails,
  compactLabel,
  fallbackImage,
}: DestinationPreviewCardProps) {
  if (!destination) {
    return null;
  }

  return (
    <section
      className={`pointer-events-none absolute left-3 right-3 z-[900] w-auto md:left-4 md:right-auto md:w-[340px] ${showTopDirectionBanner ? "top-24" : "top-3 md:top-4"} ${hasArrivedAtDestination ? "overlay-enter block" : "hidden md:block"}`}
    >
      <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-xl backdrop-blur-sm md:p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Destination preview
        </p>
        <img
          src={selectedPresetDestination?.image ?? fallbackImage}
          alt={`${compactLabel(destination.label)} preview`}
          className="mt-2 hidden h-36 w-full rounded-lg border border-slate-200 object-cover md:block"
        />
        <p className="mt-1.5 text-sm font-semibold text-slate-900 md:mt-2">
          {compactLabel(destination.label)}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 md:line-clamp-none">
          {selectedPresetDestination?.summary ??
            "Destination loaded from a shared route. Choose a quick destination to view local details."}
        </p>

        <button
          type="button"
          onClick={onToggleDestinationDetails}
          className="mt-2 hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 md:inline-block"
        >
          {showDestinationDetails ? "Hide details" : "View details"}
        </button>

        {showDestinationDetails ? (
          <ul className="mt-2 hidden space-y-1.5 rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 md:block">
            {(
              selectedPresetDestination?.details ?? [
                "Detailed profile is currently unavailable for this shared destination.",
                "Select a quick destination from the list to load full local details.",
              ]
            ).map((detail) => (
              <li key={detail} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
