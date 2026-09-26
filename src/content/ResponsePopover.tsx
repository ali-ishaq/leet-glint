import { createPortal } from "react-dom";
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

function RefreshIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 12a8.5 8.5 0 1 1-2.9-6.4" />
      <path d="M21 3v5h-5" />
    </svg>
  );
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
              <RefreshIcon />
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
