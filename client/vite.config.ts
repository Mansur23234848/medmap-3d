import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // The app lives under /medmap3d/ (XAMPP: http://localhost/medmap3d/, Node: http://localhost:4000/medmap3d/)
  base: '/medmap3d/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    strictPort: true,
    // Allow public demo links through a Cloudflare quick tunnel (see README).
    allowedHosts: ['.trycloudflare.com'],
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: false } },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          charts: ['recharts'],
        },
      },
    },
  },
});
