import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@biaomai/plugin-sdk': path.resolve(__dirname, '../../packages/plugin-sdk/src/index.ts'),
      '@biaomai/ai-browser': path.resolve(__dirname, '../../packages/ai-browser/src/index.ts'),
    },
  },
  server: {
    port: 5178,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
