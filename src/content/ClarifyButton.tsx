import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Spinner } from "../components/Spinner";
import { MarkdownAnswer } from "./MarkdownAnswer";

const PANEL_OFFSET = 10;
const VIEWPORT_MARGIN = 12;
const EXIT_DURATION_MS = 160;
const SCROLL_OPTIONS: AddEventListenerOptions = {
  capture: true,
  passive: true,
};

interface ClarifyResponse {
  level: number;
  text: string;
  failed: boolean;
}

interface ClarifyButtonProps {
  level: number;
  onRequest: (kind: "clarify" | "hint", level: number) => Promise<string>;
  pillClassName?: string;
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

export function ClarifyButton({
  level,
  onRequest,
  pillClassName,
}: ClarifyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ClarifyResponse | null>(null);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);

  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const exitTimer = useRef<number | null>(null);
  const enterFrames = useRef<number[]>([]);

  const label = `Clarify${level > 1 ? ` · ${level}` : ""}`;

  // A response only belongs to the level it was requested for, so a level
  // change invalidates it without needing a reset effect.
  const active = response?.level === level ? response : null;
  const panelOpen = panelMounted && active !== null;

  const cancelEnterFrames = useCallback(() => {
    enterFrames.current.forEach((frame) => window.cancelAnimationFrame(frame));
    enterFrames.current = [];
  }, []);

  const closePanel = useCallback(() => {
    setPanelEntered(false);
    if (exitTimer.current !== null) {
      window.clearTimeout(exitTimer.current);
    }
    exitTimer.current = window.setTimeout(() => {
      exitTimer.current = null;
      setPanelMounted(false);
    }, EXIT_DURATION_MS);
  }, []);

  const openPanel = useCallback(() => {
    if (exitTimer.current !== null) {
      window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
    setPanelEntered(false);
    setPanelMounted(true);

    // Two frames: the first lets the closed styles be committed and painted,
    // the second flips them so the browser can interpolate the transition.
    cancelEnterFrames();
    enterFrames.current.push(
      window.requestAnimationFrame(() => {
        enterFrames.current.push(
          window.requestAnimationFrame(() => setPanelEntered(true)),
        );
      }),
    );
  }, [cancelEnterFrames]);

  useEffect(
    () => () => {
      cancelEnterFrames();
      if (exitTimer.current !== null) {
        window.clearTimeout(exitTimer.current);
      }
    },
    [cancelEnterFrames],
  );

  /**
   * The popover is portalled to <body> so it escapes any stacking context or
   * overflow clipping on the LeetCode problem header. That means it is
   * position: fixed and has to be re-anchored to the button by hand.
   *
   * Coordinates are written straight to the node instead of into React state
   * so that scrolling does not re-render on every frame.
   */
  const positionPanel = useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    // offsetWidth/offsetHeight are layout based, so they stay accurate while
    // the scale transition is running.
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;

    const fitsBelow =
      rect.bottom + PANEL_OFFSET + height <= window.innerHeight - VIEWPORT_MARGIN;
    const fitsAbove = rect.top - PANEL_OFFSET - height >= VIEWPORT_MARGIN;
    const placement = !fitsBelow && fitsAbove ? "top" : "bottom";

    const left = Math.max(
      Math.min(rect.left, window.innerWidth - VIEWPORT_MARGIN - width),
      VIEWPORT_MARGIN,
    );
    const top =
      placement === "top" ? rect.top - PANEL_OFFSET - height : rect.bottom + PANEL_OFFSET;

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
    panel.dataset.placement = placement;
  }, []);

  useLayoutEffect(() => {
    if (!panelOpen) {
      return;
    }

    const panel = panelRef.current;
    positionPanel();

    // Re-anchor on scroll/resize, and whenever the rendered content changes
    // height (async markdown chunk, KaTeX, web fonts).
    let frame = 0;
    const schedule = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        positionPanel();
      });
    };

    const observer =
      panel && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    observer?.observe(panel as HTMLDivElement);

    window.addEventListener("scroll", schedule, SCROLL_OPTIONS);
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      observer?.disconnect();
      window.removeEventListener("scroll", schedule, SCROLL_OPTIONS);
      window.removeEventListener("resize", schedule);
    };
  }, [panelOpen, positionPanel]);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && anchorRef.current?.contains(target)) {
        return;
      }
      // The popover lives in a portal, so containment is checked against both
      // the button wrapper and the panel itself.
      if (target instanceof Node && panelRef.current?.contains(target)) {
        return;
      }
      closePanel();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [panelOpen, closePanel]);

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

    if (panelOpen) {
      closePanel();
      return;
    }

    // An existing answer is only toggled, never silently re-requested. A failed
    // request is retried instead, so the user is not shown a stale error.
    if (active && !active.failed) {
      openPanel();
      return;
    }

    await request();
    openPanel();
  }

  async function handleRegenerate() {
    if (loading) {
      return;
    }
    // The popover stays open and shows its own loading state, so the answer is
    // swapped in place rather than flashing closed and reopened.
    await request();
  }

  const buttonClassName = pillClassName
    ? `${pillClassName} leetglint-clarify-trigger`
    : "leetglint-trigger leetglint-clarify-trigger";

  return (
    <div className="leetglint-inline" data-kind="clarify" ref={anchorRef}>
      <button
        className={buttonClassName}
        type="button"
        onClick={handleClick}
        disabled={loading}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        aria-expanded={panelOpen}
      >
        <span className="leetglint-trigger-label">{label}</span>
        <span className="leetglint-trigger-spinner" aria-hidden="true">
          <Spinner size={14} />
        </span>
      </button>
      {panelOpen &&
        active &&
        createPortal(
          <div
            ref={panelRef}
            className="leetglint-popover"
            data-state={panelEntered ? "entered" : "exited"}
            role="dialog"
            aria-label="Clarification"
          >
            <div className="leetglint-popover-header">
              <span>Clarification</span>
              <button
                type="button"
                className="leetglint-regenerate"
                onClick={handleRegenerate}
                disabled={loading}
                title="Ask for a fresh clarification"
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
              ) : active.failed ? (
                <p className="leetglint-error">{active.text}</p>
              ) : (
                <MarkdownAnswer text={active.text} />
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
