import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts'))            return 'charts';
            if (id.includes('@supabase'))            return 'supabase';
            if (id.includes('lucide-react'))         return 'icons';
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor';
            if (id.includes('react'))                return 'vendor';
          }
        },
      },
    },
  },
});
