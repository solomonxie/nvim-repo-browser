import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes every built asset path relative to wherever index.html
// physically sits -- required for file:// (no server to resolve root-absolute paths).
export default defineConfig({
  base: './',
  plugins: [react()],
});
