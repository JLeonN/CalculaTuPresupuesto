import { build } from 'vite';
import { fileURLToPath } from 'node:url';

await build({
  configFile: false,
  envDir: false,
  publicDir: false,
  build: {
    outDir: fileURLToPath(
      new URL('../src-capacitor/android/app/src/debug/assets', import.meta.url),
    ),
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: fileURLToPath(new URL('../tests/fixtures/reloj-adaptador-debug.ts', import.meta.url)),
      name: 'CHAdaptadorReloj',
      formats: ['iife'],
      fileName: () => 'reloj-adaptador.debug.js',
    },
  },
});
