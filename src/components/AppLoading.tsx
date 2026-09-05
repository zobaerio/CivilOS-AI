import CivilOSLogo from "@/components/CivilOSLogo";

const AppLoading = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={compact ? "flex min-h-[45vh] items-center justify-center" : "fixed inset-0 z-[100] flex items-center justify-center bg-background"}
    role="status"
    aria-live="polite"
    aria-label="Loading CivilOS AI"
  >
    <div className="flex flex-col items-center gap-4 px-6 text-center">
      <div className="motion-safe:animate-[logo-breathe_2.4s_ease-in-out_infinite]">
        <CivilOSLogo variant="icon" size="xl" />
      </div>
      <div>
        <p className="font-heading text-lg font-bold">
          CivilOS <span className="text-gradient-primary">AI</span>
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Build Smarter • Engineer Better
        </p>
      </div>
      <span className="h-1 w-28 overflow-hidden rounded-full bg-muted">
        <span className="block h-full w-1/2 rounded-full bg-accent motion-safe:animate-[loading-slide_900ms_ease-in-out_infinite]" />
      </span>
    </div>
  </div>
);

export default AppLoading;
