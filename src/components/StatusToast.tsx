type StatusToastProps = {
  message: string | null;
};

export function StatusToast({ message }: StatusToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-4 bottom-[44vh] z-[900] rounded-lg border border-amber-300/40 bg-amber-100/90 px-3 py-2 text-xs font-semibold text-amber-900 shadow-lg md:bottom-4 md:left-4 md:max-w-xs">
      {message}
    </div>
  );
}
