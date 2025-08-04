import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-index-html',
      writeBundle() {
        // Copy the generated index.html to public directory
        const indexHtml = fs.readFileSync('dist/index.html', 'utf-8');
        fs.writeFileSync('public/index.html', indexHtml);
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: 'styles.css',
      },
    },
  },
  server: {
    port: 3000,
  },
});