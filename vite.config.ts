import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Use VITE_BASE_PATH env var, default to "/" for production, "/biotrack/" for GitHub Pages
  base: process.env.VITE_BASE_PATH || "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Define environment variables available at build time
  define: {
    __API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"),
  },
});
