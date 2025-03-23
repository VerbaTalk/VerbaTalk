import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { writeFileSync, copyFileSync, mkdirSync, existsSync, readFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'extension-builder',
      closeBundle() {
        // Create dist/icons directory if it doesn't exist
        const iconDir = resolve(__dirname, 'dist/icons');
        if (!existsSync(iconDir)) {
          mkdirSync(iconDir, { recursive: true });
        }

        // Copy icons
        copyFileSync(
          resolve(__dirname, 'public/icons/icon16.png'),
          resolve(__dirname, 'dist/icons/icon16.png')
        );
        copyFileSync(
          resolve(__dirname, 'public/icons/icon48.png'),
          resolve(__dirname, 'dist/icons/icon48.png')
        );
        copyFileSync(
          resolve(__dirname, 'public/icons/icon128.png'),
          resolve(__dirname, 'dist/icons/icon128.png')
        );

        // Copy the manifest.json file
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        );

        // Copy popup.html to dist/popup.html
        try {
          const popupHtml = readFileSync(resolve(__dirname, 'src/popup.html'), 'utf8');
          writeFileSync(resolve(__dirname, 'dist/popup.html'), popupHtml);
          console.log('Vue popup HTML copied successfully');
        } catch (err) {
          console.error('Error processing popup HTML file:', err);
        }
        
        // Ensure content-script.js is included by manually copying it
        try {
          copyFileSync(
            resolve(__dirname, 'src/content-script.js'),
            resolve(__dirname, 'dist/content-script.js')
          );
          console.log('Content script copied successfully');
        } catch (err) {
          console.error('Error copying content-script.js:', err);
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.js'),
        background: resolve(__dirname, 'src/background.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}); 