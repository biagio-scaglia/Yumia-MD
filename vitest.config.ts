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
      '@biagioscaglia/yumia-ast': path.resolve(__dirname, './packages/ast/src/index.ts'),
      '@biagioscaglia/yumia-parser': path.resolve(__dirname, './packages/parser/src/index.ts'),
      '@biagioscaglia/yumia-theme': path.resolve(__dirname, './packages/theme/src/index.ts'),
      '@biagioscaglia/yumia-layout': path.resolve(__dirname, './packages/layout/src/index.ts'),
      '@biagioscaglia/yumia-renderer': path.resolve(__dirname, './packages/renderer/src/index.ts'),
      '@biagioscaglia/yumia-renderer-pptx': path.resolve(
        __dirname,
        './packages/renderer-pptx/src/index.ts'
      ),
      '@biagioscaglia/yumia-renderer-pdf': path.resolve(
        __dirname,
        './packages/renderer-pdf/src/index.ts'
      ),
      '@biagioscaglia/yumia-renderer-html': path.resolve(
        __dirname,
        './packages/renderer-html/src/index.ts'
      ),
      '@biagioscaglia/yumia-core': path.resolve(__dirname, './packages/core/src/index.ts'),
      yumiamd: path.resolve(__dirname, './packages/cli/src/index.ts'),
    },
  },
});
