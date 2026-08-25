import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['chart.js'],
    esbuildOptions: {
      plugins: []
    }
  },
  resolve: {
    alias: {
      'chart.js/auto': 'chart.js'
    }
  }
});
