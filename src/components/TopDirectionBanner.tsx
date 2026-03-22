type TopDirectionBannerProps = {
  show: boolean;
  instruction: string;
  distanceText: string;
  heading: number;
};

export function TopDirectionBanner({
  show,
  instruction,
  distanceText,
  heading,
}: TopDirectionBannerProps) {
  if (!show) {
    return null;
  }

  return (
    <section className="pointer-events-none absolute inset-x-0 top-3 z-[920] mx-auto w-[min(94vw,760px)] overlay-enter">
      <div className="pointer-events-auto rounded-2xl bg-[#1a73e8] px-4 py-3 text-white shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">
          Next Turn
        </p>
        <p className="text-sm font-semibold leading-relaxed">{instruction}</p>
        <p className="mt-1 text-xs text-blue-100">
          {distanceText} • Heading {Math.round(heading)}°
        </p>
      </div>
    </section>
  );
}
