type QrPreviewModalProps = {
  show: boolean;
  qrCodeDataUrl: string | null;
  onClose: () => void;
  onCopyShareLink: () => void;
};

export function QrPreviewModal({
  show,
  qrCodeDataUrl,
  onClose,
  onCopyShareLink,
}: QrPreviewModalProps) {
  if (!show || !qrCodeDataUrl) {
    return null;
  }

  return (
    <section className="pointer-events-none absolute inset-0 z-990 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-cyan-300/40 bg-slate-900/95 p-5 text-slate-50 shadow-2xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-[Sora] text-lg font-semibold">Scan Route QR</p>
            <p className="mt-1 text-xs text-slate-300">
              Use another device to open this exact route packet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
  );
}
