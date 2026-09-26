/*
 * Static styles for the Clarify popover's rendered markdown.
 *
 * The syntax theme is kept in-tree (src/styles/syntax.css) because
 * @crxjs/vite-plugin cannot map a stylesheet that lives in node_modules onto an
 * emitted content-script asset, so importing it directly fails the build.
 * KaTeX, which ships far too much CSS to vendor, is loaded at runtime instead
 * -- see src/content/katexStyles.ts and the katexAssets() plugin in
 * vite.config.ts.
 */
import "../styles/syntax.css";
