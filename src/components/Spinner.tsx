import { ClipLoader } from "react-spinners";

interface SpinnerProps {
  size?: number;
  speedMultiplier?: number;
  label?: string;
  className?: string;
}

export function Spinner({
  size = 14,
  speedMultiplier = 0.85,
  label = "Loading",
  className,
}: SpinnerProps) {
  return (
    <span
      className={className ? `leetglint-spinner ${className}` : "leetglint-spinner"}
      role="status"
      aria-label={label}
    >
      <ClipLoader
        aria-hidden="true"
        color="currentColor"
        size={size}
        speedMultiplier={speedMultiplier}
        cssOverride={{ borderWidth: Math.max(2, Math.round(size / 7)) }}
      />
    </span>
  );
}
