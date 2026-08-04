const AppLoading = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={compact ? "flex min-h-[45vh] items-center justify-center" : "fixed inset-0 z-[100] flex items-center justify-center bg-background"}
    role="status"
    aria-live="polite"
    aria-label="Loading CivilOS AI"
  >
    <div className="flex flex-col items-center gap-4 px-6 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card">
        <span className="font-heading text-xl font-bold">C</span>
        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-md bg-accent ring-2 ring-background" />
      </div>
      <div>
        <p className="font-heading text-lg font-bold">CivilOS AI</p>
        <p className="mt-1 text-xs text-muted-foreground">Loading workspace…</p>
      </div>
      <span className="h-1 w-28 overflow-hidden rounded-full bg-muted">
        <span className="block h-full w-1/2 rounded-full bg-accent motion-safe:animate-[loading-slide_900ms_ease-in-out_infinite]" />
      </span>
    </div>
  </div>
);

export default AppLoading;