import { useEffect, useState, type RefObject } from "react";
import { getProblemContainer, getProblemSelection } from "./domReaders";

/**
 * Reports the text currently selected inside the problem description, or null.
 *
 * Pointerdowns on the trigger and on its panel are deliberately ignored. The
 * panel is portalled outside the description, so clicking into it to select and
 * copy part of an answer would otherwise count as "clicked elsewhere" and wipe
 * the selection; on the trigger it would clear the selection before the click
 * handler ran, turning a selection request into a whole-description one.
 */
export function useDescriptionSelection(
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
): string | null {
  const [selection, setSelection] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setSelection((previous) => {
        const next = getProblemSelection();
        // selectionchange fires continuously while a selection is being dragged,
        // so an unchanged string must not re-render the button.
        return next === previous ? previous : next;
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node) {
        if (
          anchorRef.current?.contains(target) ||
          panelRef.current?.contains(target)
        ) {
          return;
        }
        // A pointerdown inside the description may be the start of a new
        // selection, so selectionchange is left to report the outcome.
        if (getProblemContainer()?.contains(target)) {
          return;
        }
      }
      setSelection(null);
    };

    document.addEventListener("selectionchange", refresh);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("selectionchange", refresh);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [anchorRef, panelRef]);

  return selection;
}
