import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

const PANEL_OFFSET = 10;
const VIEWPORT_MARGIN = 12;
const EXIT_DURATION_MS = 160;
const SCROLL_OPTIONS: AddEventListenerOptions = {
  capture: true,
  passive: true,
};

export interface PopoverHandle {
  panelOpen: boolean;
  entered: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Owns the open/close animation and the hand-rolled anchoring of a dialog that
 * floats next to a trigger buried in the LeetCode layout.
 *
 * The panel is portalled to <body> so it escapes any stacking context or
 * overflow clipping on the host page. That means it is position: fixed and has
 * to be re-anchored to the trigger by hand, and coordinates are written
 * straight to the node instead of into state so that scrolling never re-renders.
 *
 * The refs are owned by the caller rather than created here, so the returned
 * handle stays free of refs.
 */
export function useAnchoredPopover(
  anchorRef: RefObject<HTMLDivElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
): PopoverHandle {
  const [panelOpen, setPanelOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  const exitTimer = useRef<number | null>(null);
  const enterFrames = useRef<number[]>([]);

  const cancelEnterFrames = useCallback(() => {
    enterFrames.current.forEach((frame) => window.cancelAnimationFrame(frame));
    enterFrames.current = [];
  }, []);

  const close = useCallback(() => {
    setEntered(false);
    if (exitTimer.current !== null) {
      window.clearTimeout(exitTimer.current);
    }
    exitTimer.current = window.setTimeout(() => {
      exitTimer.current = null;
      setPanelOpen(false);
    }, EXIT_DURATION_MS);
  }, []);

  const open = useCallback(() => {
    if (exitTimer.current !== null) {
      window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
    setEntered(false);
    setPanelOpen(true);

    // Two frames: the first lets the closed styles be committed and painted,
    // the second flips them so the browser can interpolate the transition.
    cancelEnterFrames();
    enterFrames.current.push(
      window.requestAnimationFrame(() => {
        enterFrames.current.push(
          window.requestAnimationFrame(() => setEntered(true)),
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
      placement === "top"
        ? rect.top - PANEL_OFFSET - height
        : rect.bottom + PANEL_OFFSET;

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
    panel.dataset.placement = placement;
  }, [anchorRef, panelRef]);

  useLayoutEffect(() => {
    if (!panelOpen) {
      return;
    }

    const panel = panelRef.current;
    positionPanel();

    // Re-anchor on scroll/resize, and whenever the rendered content changes
    // height (KaTeX, web fonts, a long code block settling in).
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
  }, [panelOpen, panelRef, positionPanel]);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && anchorRef.current?.contains(target)) {
        return;
      }
      // The panel lives in a portal, so containment is checked against both
      // the trigger wrapper and the panel itself.
      if (target instanceof Node && panelRef.current?.contains(target)) {
        return;
      }
      close();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [panelOpen, anchorRef, panelRef, close]);

  return { panelOpen, entered, open, close };
}
