const RESULT_SELECTOR = '[data-e2e-locator="console-result"]';
const RESULT_TEXT = "Wrong Answer";
const TOOLBAR_SELECTOR = ".flex.items-center";
const SLOT_SELECTOR = ".ml-auto";
const ANCHOR_CLASS = "leetglint-wrong-answer-anchor";

export interface WrongAnswerButtonHost {
  /** Called once per injected anchor. Mount the UI into it. */
  mount(anchor: HTMLElement): void;
  /** Called before an injected anchor is thrown away. Unmount any UI. */
  unmount(): void;
}

export interface WrongAnswerButtonSync {
  /**
   * Idempotently reconciles the button with the current console verdict. Safe to
   * call on every DOM mutation.
   */
  sync(scope?: Document | Element): void;
  remove(): void;
  anchor(): HTMLElement | null;
}

/**
 * Keeps the Wrong Answer hint button in sync with the console verdict.
 *
 * LeetCode renders the verdict and the toolbar together after a submission, so
 * the button is reconciled rather than injected once: it must appear only while
 * the verdict reads exactly "Wrong Answer" and must be taken away again as soon
 * as it does not, including when the console itself disappears.
 *
 * Only the DOM placement lives here; mounting React is left to the caller.
 */
export function createWrongAnswerButtonHost(
  host: WrongAnswerButtonHost,
): WrongAnswerButtonSync {
  let anchor: HTMLElement | null = null;

  function remove() {
    if (!anchor) {
      return;
    }
    host.unmount();
    anchor.remove();
    anchor = null;
  }

  function sync(scope: Document | Element = document) {
    const result = scope.querySelector(RESULT_SELECTOR);
    if (result?.textContent?.trim() !== RESULT_TEXT) {
      remove();
      return;
    }

    const container = result
      .closest(TOOLBAR_SELECTOR)
      ?.querySelector(SLOT_SELECTOR);
    if (!container) {
      remove();
      return;
    }

    // Already in the right place. This is what keeps repeated observer fires
    // from mounting a second copy of the button.
    if (anchor && anchor.isConnected && anchor.parentElement === container) {
      return;
    }

    remove();
    // Drops an anchor left by a re-injected content script that this instance
    // does not track, so the duplicate guard stays authoritative.
    container
      .querySelectorAll(`.${ANCHOR_CLASS}`)
      .forEach((node) => node.remove());

    const doc = container.ownerDocument ?? document;
    const next = doc.createElement("div");
    next.className = ANCHOR_CLASS;
    container.appendChild(next);
    anchor = next;
    host.mount(next);
  }

  return { sync, remove, anchor: () => anchor };
}
