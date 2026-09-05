import { cn } from "@/lib/utils";

type Variant = "full" | "icon" | "compact" | "wordmark";
type Theme = "dark" | "light" | "auto";
type Size = "sm" | "md" | "lg" | "xl";

const ICON_SRC = "/branding/civilos-ai-icon-192.png";
const ICON_SRC_2X = "/branding/civilos-ai-icon-512.png";

const iconSize: Record<Size, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const wordSize: Record<Size, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-4xl",
};

const taglineSize: Record<Size, string> = {
  sm: "text-[7px]",
  md: "text-[8px]",
  lg: "text-[10px]",
  xl: "text-xs",
};

interface CivilOSLogoProps {
  variant?: Variant;
  theme?: Theme;
  size?: Size;
  showTagline?: boolean;
  className?: string;
}

const CivilOSLogo = ({
  variant = "full",
  theme = "auto",
  size = "md",
  showTagline = false,
  className,
}: CivilOSLogoProps) => {
  const wordColor =
    theme === "dark"
      ? "text-white"
      : theme === "light"
        ? "text-primary"
        : "text-foreground";

  const Icon = (
    <img
      src={ICON_SRC}
      srcSet={`${ICON_SRC} 192w, ${ICON_SRC_2X} 512w`}
      sizes="64px"
      width={192}
      height={192}
      alt="CivilOS AI logo"
      loading="eager"
      decoding="async"
      className={cn(
        "shrink-0 rounded-[22%] object-contain transition-transform duration-300 group-hover:scale-105",
        iconSize[size],
      )}
    />
  );

  if (variant === "icon") {
    return <span className={cn("group inline-flex", className)}>{Icon}</span>;
  }

  const Word = (
    <span className={cn("font-heading font-extrabold leading-none tracking-tight", wordSize[size], wordColor)}>
      CivilOS <span className="text-gradient-primary">AI</span>
    </span>
  );

  if (variant === "wordmark") {
    return (
      <span className={cn("inline-flex flex-col", className)}>
        {Word}
        {showTagline && (
          <span className={cn("mt-1 uppercase tracking-[0.22em] text-muted-foreground", taglineSize[size])}>
            Build Smarter • Engineer Better
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={cn("group inline-flex items-center gap-2.5", className)}>
      {Icon}
      <span className="flex flex-col">
        <span className={cn(variant === "compact" ? "hidden sm:flex" : "flex", "flex-col")}>
          {Word}
          {showTagline && (
            <span className={cn("mt-1 uppercase tracking-[0.22em] text-muted-foreground", taglineSize[size])}>
              Build Smarter • Engineer Better
            </span>
          )}
        </span>
      </span>
    </span>
  );
};

export default CivilOSLogo;
