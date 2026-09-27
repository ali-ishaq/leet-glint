import { useRef, useState } from "react";
import { Astroid } from "lucide-react";
import { Spinner } from "../components/Spinner";
import { ResponsePopover } from "./ResponsePopover";
import { useAnchoredPopover } from "./useAnchoredPopover";

interface ClarifyResponse {
  level: number;
  text: string;
  failed: boolean;
}

interface ClarifyButtonProps {
  level: number;
  onRequest: (kind: "clarify" | "hint", level: number) => Promise<string>;
}

export function ClarifyButton({ level, onRequest }: ClarifyButtonProps) {

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ClarifyResponse | null>(null);

  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { panelOpen, entered, open, close } = useAnchoredPopover(
    anchorRef,
    panelRef,
  );

  const label = `Clarify${level > 1 ? ` · ${level}` : ""}`;

  // A response only belongs to the level it was requested for, so a level
  // change invalidates it without needing a reset effect.
  const active = response?.level === level ? response : null;
  const showPanel = panelOpen && active !== null;

  async function request() {
    setLoading(true);
    try {
      const text = await onRequest("clarify", level);
      setResponse({ level, text, failed: false });
    } catch (requestError) {
      setResponse({
        level,
        text:
          requestError instanceof Error
            ? requestError.message
            : "Unable to clarify this problem right now.",
        failed: true,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleClick() {
    if (loading) {
      return;
    }

    if (showPanel) {
      close();
      return;
    }

    // An existing answer is only toggled, never silently re-requested. A failed
    // request is retried instead, so the user is not shown a stale error.
    if (active && !active.failed) {
      open();
      return;
    }

    await request();
    open();
  }

  async function handleRegenerate() {
    if (loading) {
      return;
    }
    // The popover stays open and shows its own loading state, so the answer is
    // swapped in place rather than flashing closed and reopened.
    await request();
  }

  return (
    <div className="leetglint-inline" data-kind="clarify" ref={anchorRef}>
      <button
        className="leetglint-trigger"
        type="button"
        onClick={handleClick}
        disabled={loading}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        aria-expanded={showPanel}
      >
        <span className="leetglint-trigger-label">
          <span className="leetglint-trigger-icon">
            <Astroid size={14} strokeWidth={2} aria-hidden="true" />
          </span>
          {label}
        </span>
        <span className="leetglint-trigger-spinner" aria-hidden="true">
          <Spinner size={14} />
        </span>
      </button>
      {showPanel && active && (
        <ResponsePopover
          panelRef={panelRef}
          entered={entered}
          title="Clarification"
          loading={loading}
          failed={active.failed}
          text={active.text}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  );
}
