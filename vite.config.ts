import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['mermaid', 'react-markdown', 'remark-gfm', '@react-oauth/google', 'axios', 'lucide-react'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/fastapi': {
        target: 'https://querydata-fastapi-114564247435.us-central1.run.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/fastapi/, ''),
      },
    },
  },
});
