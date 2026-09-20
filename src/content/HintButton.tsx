import { useEffect, useState } from "react";
import { CLARIFY_PROMPTS, HINT_PROMPTS } from "../shared/prompts";

interface HintButtonProps {
  target: "clarify" | "hint";
  level: number;
  onRequest: (kind: "clarify" | "hint", level: number) => Promise<string>;
  disabled?: boolean;
}

export function HintButton({
  target,
  level,
  onRequest,
  disabled = false,
}: HintButtonProps) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAnswer("");
    setError("");
    setOpen(false);
  }, [target, level, disabled]);

  async function handleClick() {
    if (disabled || loading) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await onRequest(target, level);
      setAnswer(result);
      setOpen(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to fetch guidance right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  const label =
    target === "clarify"
      ? `Clarify${level > 1 ? ` · ${level}` : ""}`
      : `Hint ${level} of 3${level > 1 ? ` — closer look` : ""}`;

  const inlineText =
    target === "clarify"
      ? (CLARIFY_PROMPTS[level as keyof typeof CLARIFY_PROMPTS] ??
        CLARIFY_PROMPTS[1])
      : (HINT_PROMPTS[level as keyof typeof HINT_PROMPTS] ?? HINT_PROMPTS[1]);

  return (
    <div className="leetglint-inline" data-kind={target}>
      <button
        className="leetglint-trigger"
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
      >
        {loading ? "Working…" : label}
      </button>
      {open && (
        <div className="leetglint-panel">
          <div className="leetglint-panel-header">
            {target === "clarify" ? "Clarification" : `Hint ${level} of 3`}
          </div>
          <p>{answer || inlineText}</p>
        </div>
      )}
      {error && <div className="leetglint-error">{error}</div>}
    </div>
  );
}
