import { createPortal } from "react-dom";
import { RefreshCw } from "lucide-react";
import { Spinner } from "../components/Spinner";
import { MarkdownAnswer } from "./MarkdownAnswer";

interface ResponsePopoverProps {
  panelRef: React.RefObject<HTMLDivElement | null>;
  entered: boolean;
  title: string;
  loading: boolean;
  failed: boolean;
  text: string;
  onRegenerate: () => void;
}

/**
 * The floating answer dialog shared by every LeetGlint trigger. It is
 * portalled to <body> and anchored imperatively by useAnchoredPopover, so it can
 * be opened from anywhere on the page without being clipped or restacked.
 */
export function ResponsePopover({
  panelRef,
  entered,
  title,
  loading,
  failed,
  text,
  onRegenerate,
}: ResponsePopoverProps) {
  return createPortal(
    <div
      ref={panelRef}
      className="leetglint-popover"
      data-state={entered ? "entered" : "exited"}
      role="dialog"
      aria-label={title}
    >
      <div className="leetglint-popover-header">
        <span>{title}</span>
        <button
          type="button"
          className="leetglint-regenerate"
          onClick={onRegenerate}
          disabled={loading}
          title="Ask again"
        >
          {loading ? (
            <Spinner size={12} label="Regenerating" />
          ) : (
            <>
              <RefreshCw size={12} strokeWidth={2.5} aria-hidden="true" />
              <span>Regenerate</span>
            </>
          )}
        </button>
      </div>
      <div className="leetglint-popover-body">
        {loading ? (
          <p className="leetglint-popover-status">
            <Spinner size={14} label="Thinking" />
            <span>Thinking…</span>
          </p>
        ) : failed ? (
          <p className="leetglint-error">{text}</p>
        ) : (
          <MarkdownAnswer text={text} />
        )}
      </div>
    </div>,
    document.body,
  );
}
