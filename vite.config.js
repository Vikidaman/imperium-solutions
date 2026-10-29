import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts")) {
            return "vendor-charts";
          }
          if (
            id.includes("node_modules/d3-geo") ||
            id.includes("node_modules/topojson-client") ||
            id.includes("world-atlas") ||
            id.includes("us-atlas")
          ) {
            return "vendor-geo";
          }
        },
      },
    },
  },
});

