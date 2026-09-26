import { useRef, useState } from "react";
import { Spinner } from "../components/Spinner";
import { ResponsePopover } from "./ResponsePopover";
import { useAnchoredPopover } from "./useAnchoredPopover";

interface HintAnswer {
  text: string;
  failed: boolean;
}

interface HintButtonProps {
  /** Resolves to the hint body. A rejection is shown inside the popover. */
  onRequest: () => Promise<string>;
  label?: string;
  disabled?: boolean;
}

export function HintButton({
  onRequest,
  label = "Hint",
  disabled = false,
}: HintButtonProps) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<HintAnswer | null>(null);

  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { panelOpen, entered, open, close } = useAnchoredPopover(
    anchorRef,
    panelRef,
  );

  const showPanel = panelOpen && answer !== null;

  async function request() {
    setLoading(true);
    try {
      setAnswer({ text: await onRequest(), failed: false });
    } catch (requestError) {
      setAnswer({
        text:
          requestError instanceof Error
            ? requestError.message
            : "Unable to fetch guidance right now.",
        failed: true,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleClick() {
    if (disabled || loading) {
      return;
    }

    if (showPanel) {
      close();
      return;
    }

    // Only a failed request is retried; a good answer is just toggled open.
    if (answer && !answer.failed) {
      open();
      return;
    }

    await request();
    open();
  }

  async function handleRegenerate() {
    if (loading || disabled) {
      return;
    }
    await request();
  }

  return (
    <div className="leetglint-inline" data-kind="hint" ref={anchorRef}>
      <button
        className="leetglint-trigger leetglint-pill-loading"
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        aria-expanded={showPanel}
      >
        <span className="leetglint-trigger-label">{label}</span>
        <span className="leetglint-trigger-spinner" aria-hidden="true">
          <Spinner size={14} />
        </span>
      </button>
      {showPanel && answer && (
        <ResponsePopover
          panelRef={panelRef}
          entered={entered}
          title={label}
          loading={loading}
          failed={answer.failed}
          text={answer.text}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  );
}
