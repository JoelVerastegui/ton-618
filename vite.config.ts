import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { copyFileSync } from 'fs';
import * as path from 'path';

// GitHub Pages sirve `404.html` en las rutas sin archivo: con una copia de `index.html`, la SPA
// arranca también al abrir directamente la ruta de una sección.
function spaFallback(): Plugin {
  let outDir = '';

  return {
    name: 'spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      copyFileSync(path.join(outDir, 'index.html'), path.join(outDir, '404.html'));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/ton-618/',
  plugins: [react(), spaFallback()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(import.meta.dirname, 'src'),
      },
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Silencia las advertencias de depreciación de Sass que genera Bootstrap
        silenceDeprecations: ['import', 'color-functions', 'global-builtin', 'if-function'],
      },
    },
  },
});
