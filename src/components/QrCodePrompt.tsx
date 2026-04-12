import { QrCode, X } from "lucide-react";

type QrCodePromptProps = {
  show: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export function QrCodePrompt({
  show,
  onAccept,
  onDecline,
}: QrCodePromptProps) {
  if (!show) {
    return null;
  }

  return (
    <section className="pointer-events-none absolute inset-0 z-[1200] flex items-center justify-center bg-slate-900/35 p-3 md:p-4">
      <div className="pointer-events-auto flex w-full max-w-sm flex-col rounded-2xl border border-slate-300/40 bg-white/95 p-6 text-slate-900 shadow-[0_38px_120px_-45px_rgba(15,23,42,0.95)] backdrop-blur-md overlay-enter">
        <div className="flex items-center justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-sky-100">
            <QrCode className="h-8 w-8 text-cyan-600" />
          </div>
        </div>
        <p className="font-[Sora] text-xl font-semibold text-center">
          Get QR Code?
        </p>
        <p className="mt-2 text-sm text-slate-600 text-center">
          Would you like to get a QR code for this route to share or use on another device?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
          >
            <X className="inline h-4 w-4 mr-1" />
            No Thanks
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-500 hover:to-sky-500 active:from-cyan-700 active:to-sky-700"
          >
            <QrCode className="inline h-4 w-4 mr-1" />
            Yes, Show QR
          </button>
        </div>
      </div>
    </section>
  );
}
