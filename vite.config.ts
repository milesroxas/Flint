import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';
import { Plugin } from 'vite';

const wfDesignerExtensionPlugin = (): Plugin => {
  let webflowHTML = '';
  const configPath = path.join('./webflow.json');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const webflowConfig = JSON.parse(configContent);

  return {
    name: 'wf-vite-extension-plugin',
    transformIndexHtml: {
      order: 'pre',
      handler: async (html: string, ctx) => {
        if (ctx.server) {
          // Development mode
          console.log('\x1b[36m%s\x1b[0m', 'Development mode');
          if (!webflowHTML) {
            const { name, apiVersion } = webflowConfig;
            const template = apiVersion === '2' ? '/template/v2' : '/template';
            const url = `https://webflow-ext.com${template}?name=${name}`;
            webflowHTML = await fetch(url).then((res) => res.text());
          }

          // Extract script tags from webflowHTML
          const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
          let match;
          let scripts = '';
          while ((match = scriptRegex.exec(webflowHTML)) !== null) {
            scripts += match[0] + '\n';
          }

          // Insert extracted scripts at the end of the head tag
          const finalHTML = html.replace('</head>', `${scripts}</head>`);
          return finalHTML;
        }
      },
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__webflow') {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
          });
          res.end(configContent);
        } else {
          next();
        }
      });

      // Watch for changes in your source files
      const watcher = chokidar.watch([
        './src/**/*.tsx',
        './src/**/*.ts',
        './src/**/*.css'
      ], {
        ignoreInitial: true,
        persistent: true,
      });

      watcher.on('all', (event, filePath) => {
        console.log(
          '\x1b[33m%s\x1b[0m',
          `File ${filePath} has been ${event}, restarting server...`
        );

        void server.restart();
      });

      // Close the watcher when the server is closed
      server?.httpServer?.on('close', () => {
        void watcher.close();
      });
    },
  };
};

export default defineConfig({
  base: './',
  plugins: [
    react(),
    wfDesignerExtensionPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 1337,
    watch: {
      usePolling: true,
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
});