import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permette connessioni da rete esterna
    port: 3000, // Porta del frontend
    allowedHosts: [
      'bba28ca-27ab-40da-9a1f-4d14a7bb953f-00-36j9y8iy69567.worf.repl.co' // Dominio Replit
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Indirizza le richieste al backend
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
