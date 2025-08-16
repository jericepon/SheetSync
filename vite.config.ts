import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      // input: {
      //   // code: "src/plugin/code.ts",
      //   // index: "index.html",
      // },
      output: {
        entryFileNames: "[name].js",   // <-- no hash
        chunkFileNames: "[name].js",   // <-- no hash
        assetFileNames: "[name].[ext]", // <-- no hash
        inlineDynamicImports: true, // 👈 avoids preload helper
      },
    },
    target: "esnext",      // 👈 don’t transpile, no polyfills
    polyfillModulePreload: false, // 👈 remove preload polyfill
  },
});
