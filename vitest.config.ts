import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/*/tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@yumiamd/ast': path.resolve(__dirname, './packages/ast/src/index.ts'),
      '@yumiamd/parser': path.resolve(__dirname, './packages/parser/src/index.ts'),
      '@yumiamd/theme': path.resolve(__dirname, './packages/theme/src/index.ts'),
      '@yumiamd/layout': path.resolve(__dirname, './packages/layout/src/index.ts'),
      '@yumiamd/renderer': path.resolve(__dirname, './packages/renderer/src/index.ts'),
      '@yumiamd/renderer-pptx': path.resolve(__dirname, './packages/renderer-pptx/src/index.ts'),
      '@yumiamd/renderer-pdf': path.resolve(__dirname, './packages/renderer-pdf/src/index.ts'),
      '@yumiamd/renderer-html': path.resolve(__dirname, './packages/renderer-html/src/index.ts'),
      '@yumiamd/core': path.resolve(__dirname, './packages/core/src/index.ts'),
      yumiamd: path.resolve(__dirname, './packages/cli/src/index.ts'),
    },
  },
});
