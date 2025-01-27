import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permette connessioni da rete esterna
    port: 3000, // Porta del frontend
    allowedHosts: [
      'a8c53afa-3c5e-40e2-9720-c80d94dc8fce-00-38hpfajldn658.janeway.replit.dev' // Dominio Replit specificato
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
