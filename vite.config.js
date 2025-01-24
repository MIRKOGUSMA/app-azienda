import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Consente connessioni da altri dispositivi nella rete
    port: 3000, // Porta del frontend
    proxy: {
      "/api": {
        target: "http://localhost:5001", // Indirizza le richieste al backend
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
