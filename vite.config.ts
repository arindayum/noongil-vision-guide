import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // ✅ Required for Capacitor: assets must use relative paths
    // Without this, the Android WebView (file:// scheme) can't load /assets/...
    // base: './' ensures all asset references are relative
    outDir: "dist",
    sourcemap: false, // Disable sourcemaps in production for smaller APK
    rollupOptions: {
      output: {
        // ✅ Prevent Tesseract.js worker from being inlined — keep as separate chunk
        // so it can be loaded as a Web Worker properly
        manualChunks: (id) => {
          if (id.includes('tesseract')) return 'tesseract';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  // ✅ This is the critical fix for Capacitor blank screen (alongside HashRouter)
  // './' means all asset paths in index.html will be relative, not absolute
  base: "./",
}));
