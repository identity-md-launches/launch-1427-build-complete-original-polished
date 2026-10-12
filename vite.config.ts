export default {
  base: "./",
  build: {
    target: "es2022",
    sourcemap: false,
    assetsInlineLimit: 32768,
    modulePreload: false,
    rollupOptions: { output: { format: "iife" } },
  },
};
