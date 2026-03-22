import type { EntryMode, Point } from "../types/navigation";

type FloatingActionButtonsProps = {
  activeEntryMode: EntryMode;
  isVoiceListening: boolean;
  voiceRecognitionSupported: boolean;
  startPoint: Point;
  onOpenDestinationListModal: () => void;
  onToggleVoiceCommand: () => void;
  onChangeMode: () => void;
  onRecenter: (point: Point) => void;
  onClearRoute: () => void;
};

export function FloatingActionButtons({
  activeEntryMode,
  isVoiceListening,
  voiceRecognitionSupported,
  startPoint,
  onOpenDestinationListModal,
  onToggleVoiceCommand,
  onChangeMode,
  onRecenter,
  onClearRoute,
}: FloatingActionButtonsProps) {
  return (
    <aside className="pointer-events-none absolute right-4 bottom-6 z-900 flex flex-col gap-3 md:right-101">
      {activeEntryMode === "quick" ? (
        <button
          type="button"
          onClick={onOpenDestinationListModal}
          className="pointer-events-auto h-12 rounded-full border border-blue-300 bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500"
        >
          Destination list
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggleVoiceCommand}
          disabled={!voiceRecognitionSupported}
          className="pointer-events-auto h-12 rounded-full border border-cyan-300 bg-cyan-600 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isVoiceListening ? "Stop voice" : "Start voice"}
        </button>
      )}
      <button
        type="button"
        onClick={onChangeMode}
        className="pointer-events-auto h-12 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-lg transition hover:bg-slate-100"
      >
        Change mode
      </button>
      <button
        type="button"
        onClick={() => onRecenter(startPoint)}
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
  );
}
