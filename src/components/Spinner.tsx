import { Loader } from "lucide-react";

interface SpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}

export function Spinner({
  size = 14,
  label = "Loading",
  className,
}: SpinnerProps) {
  return (
    <span
      className={className ? `leetglint-spinner ${className}` : "leetglint-spinner"}
      role="status"
      aria-label={label}
    >
      <Loader
        className="leetglint-loader"
        size={size}
        strokeWidth={2}
        aria-hidden="true"
      />
    </span>
  );
}
