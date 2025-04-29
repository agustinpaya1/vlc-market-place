import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: [
      // Add the problematic chunks here
      'chunk-AVA4JVRP',
      'chunk-X5YBUYOV'
    ]
  }
}); 