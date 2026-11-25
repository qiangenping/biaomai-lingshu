import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@biaomai/plugin-sdk': path.resolve(__dirname, 'packages/plugin-sdk/src/index.ts'),
      '@biaomai/plugin-runtime': path.resolve(__dirname, 'packages/plugin-runtime/src/index.ts'),
      '@biaomai/ai-browser': path.resolve(__dirname, 'packages/ai-browser/src/index.ts'),
    },
  },
  test: {
    include: [
      'packages/*/tests/**/*.test.ts',
      'packs/*/tests/**/*.test.ts',
      'services/*/tests/**/*.test.ts',
    ],
  },
});
