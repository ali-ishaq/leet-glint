import { createRequire } from "node:module";
import { cp, mkdir } from "node:fs/promises";
import { statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import { defineConfig, type Plugin } from "vite";
import manifest from "./manifest.json" with { type: "json" };

const require = createRequire(import.meta.url);

const VENDOR_DIR = "vendor";

/**
 * Stages KaTeX's stylesheet and its woff2 fonts so the Clarify popover can load
 * them at runtime.
 *
 * Bundling them through the normal CSS pipeline is not possible:
 * @crxjs/vite-plugin records the id of every stylesheet in the content script's
 * module graph into manifest.content_scripts[].css, and for a file inside
 * node_modules that id does not resolve to an emitted asset, so the build
 * fails. The files are staged at the project root instead, where the plugin's
 * manifest validation finds them, copied into the build output, and exposed to
 * the LeetCode page as web accessible resources (see manifest.json). They are
 * requested only when a response containing math is rendered.
 *
 * Only woff2 is staged. The stylesheet lists woff and truetype fallbacks after
 * each woff2, but no browser that supports woff2 ever requests them, and every
 * Chrome extension target does.
 */
function katexAssets(): Plugin {
  const katexDist = dirname(require.resolve("katex/dist/katex.min.css"));
  const staged = join(VENDOR_DIR, "katex");
  const outDir = resolve("dist", VENDOR_DIR);

  async function stage() {
    await mkdir(join(staged, "fonts"), { recursive: true });
    await cp(join(katexDist, "katex.min.css"), join(staged, "katex.min.css"));
    await cp(join(katexDist, "fonts"), join(staged, "fonts"), {
      recursive: true,
      filter: (source) => statSync(source).isDirectory() || source.endsWith(".woff2"),
    });
  }

  return {
    name: "leetglint-katex-assets",
    apply: "build",
    // Runs before generateBundle, which is when @crxjs validates the manifest.
    buildStart: stage,
    async closeBundle() {
      await mkdir(outDir, { recursive: true });
      await cp(staged, outDir, { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    katexAssets(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
