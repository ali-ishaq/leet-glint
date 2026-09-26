const KATEX_CSS_PATH = "vendor/katex/katex.min.css";

let pending: Promise<void> | null = null;

/**
 * Injects KaTeX's stylesheet from the extension package on first use.
 *
 * It is not bundled into the content script stylesheet because
 * @crxjs/vite-plugin can only inject content-script CSS it can map to an
 * emitted asset, and a stylesheet living in node_modules defeats that. The
 * katexAssets() plugin in vite.config.ts copies the file (and its woff2 fonts)
 * into the build output, and manifest.json exposes it as a web accessible
 * resource so the LeetCode page is allowed to load it.
 */
export function loadKatexStyles(): Promise<void> {
  if (pending) {
    return pending;
  }

  const href = chrome?.runtime?.getURL(KATEX_CSS_PATH) ?? `/${KATEX_CSS_PATH}`;
  pending = new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLLinkElement>(
      `link[data-leetglint="${KATEX_CSS_PATH}"]`,
    );
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.leetglint = KATEX_CSS_PATH;
    link.addEventListener("load", () => resolve(), { once: true });
    // Never block rendering on a stylesheet: if it fails, KaTeX still emits
    // markup, it just falls back to system fonts.
    link.addEventListener("error", () => resolve(), { once: true });
    document.head.appendChild(link);
  });

  return pending;
}
