import { defineConfig } from "vite";
import { resolve } from "node:path";

// The provider's document page (src/doc-view/). One script and one
// stylesheet with fixed names, because a server config points at them.
export default defineConfig({
  build: {
    outDir: "dist-doc-view",
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: true,
    lib: {
      entry: {
        "doc-view": resolve(import.meta.dirname, "src/doc-view/doc-view.ts"),
        styles: resolve(import.meta.dirname, "src/doc-view/styles.ts"),
      },
      formats: ["es"],
      fileName: (_format, name) => (name === "doc-view" ? "doc-view.js" : "styles.js"),
      cssFileName: "doc-view",
    },
  },
});
