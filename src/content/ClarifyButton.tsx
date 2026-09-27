import { useRef, useState } from "react";
import { Astroid } from "lucide-react";
import { Spinner } from "../components/Spinner";
import { ResponsePopover } from "./ResponsePopover";
import { useAnchoredPopover } from "./useAnchoredPopover";
import { useDescriptionSelection } from "./useDescriptionSelection";

type ClarifyScope = "description" | "selection";

interface ClarifyResponse {
  scope: ClarifyScope;
  text: string;
  failed: boolean;
}

interface ClarifyButtonProps {
  onRequest: (selection: string | null) => Promise<string>;
}

/**
 * The single Clarify trigger. It clarifies the whole statement by default, and
 * switches to the highlighted span while the reader has text selected in the
 * description, so both modes share this button, its spinner and its popover.
 */
export function ClarifyButton({ onRequest }: ClarifyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ClarifyResponse | null>(null);

  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { panelOpen, entered, open, close } = useAnchoredPopover(
    anchorRef,
    panelRef,
  );

  const selection = useDescriptionSelection(anchorRef, panelRef);
  const scope: ClarifyScope = selection ? "selection" : "description";

  const label = scope === "selection" ? "Clarify selection" : "Clarify";

  // A response belongs to the scope it was requested for, so clearing the
  // selection retires a selection answer instead of leaving it behind under a
  // button that now says it clarifies the whole statement.
  const active = response?.scope === scope ? response : null;
  const showPanel = panelOpen && active !== null;

  async function request(quote: string | null) {
    const targetScope: ClarifyScope = quote ? "selection" : "description";
    setLoading(true);
    try {
      const text = await onRequest(quote);
      setResponse({ scope: targetScope, text, failed: false });
    } catch (requestError) {
      setResponse({
        scope: targetScope,
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

    await request(selection);
    open();
  }

  async function handleRegenerate() {
    if (loading) {
      return;
    }
    // The popover stays open and shows its own loading state, so the answer is
    // swapped in place rather than flashing closed and reopened.
    await request(selection);
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
        data-scope={scope}
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
          title={active.scope === "selection" ? "Selected excerpt" : "Clarification"}
          loading={loading}
          failed={active.failed}
          text={active.text}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  );
}
