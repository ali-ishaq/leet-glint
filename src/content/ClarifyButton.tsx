import { useEffect, useState } from "react";

interface ClarifyButtonProps {
  level: number;
  onRequest: (kind: "clarify" | "hint", level: number) => Promise<string>;
}

export function ClarifyButton({ level, onRequest }: ClarifyButtonProps) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAnswer("");
    setError("");
    setOpen(false);
  }, [level]);

  async function handleClick() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await onRequest("clarify", level);
      setAnswer(result);
      setOpen(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to clarify this problem right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="leetglint-inline" data-kind="clarify">
      <button
        className="leetglint-trigger"
        type="button"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? "Working…" : `Clarify${level > 1 ? ` · ${level}` : ""}`}
      </button>
      {open && (
        <div className="leetglint-panel">
          <div className="leetglint-panel-header">Clarification</div>
          <p>{answer}</p>
        </div>
      )}
      {error && <div className="leetglint-error">{error}</div>}
    </div>
  );
}
