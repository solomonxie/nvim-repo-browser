import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served by the Node live server (server/), not opened as file:// anymore --
// base '/' since the server controls routing. Output goes to ../dist-shell
// so the server can serve it as a plain static directory.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: '../dist-shell',
    emptyOutDir: true,
  },
});
