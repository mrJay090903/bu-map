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
    <section className="pointer-events-auto absolute right-0 top-0 bottom-0 z-[1200] w-full max-w-md flex flex-col overflow-hidden border-l border-blue-200/30 bg-white/95 shadow-[0_38px_120px_-45px_rgba(15,23,42,0.95)] backdrop-blur-md">
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-blue-200 bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="font-[Sora] text-lg font-semibold text-white">Scan Route QR</p>
              <p className="mt-1 text-xs text-blue-50">
                Use another device to open this exact route
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>

        {/* QR Code Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <img
            src={qrCodeDataUrl}
            alt="Large QR code to follow this route"
            className="h-auto w-full max-w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          />
          
          <button
            type="button"
            onClick={onCopyShareLink}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-md"
          >
            Copy share link
          </button>
        </div>
      </div>
    </section>
  );
}
