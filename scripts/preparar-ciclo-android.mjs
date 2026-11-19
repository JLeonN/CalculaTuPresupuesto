import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFile, unlink } from 'node:fs/promises';

const raiz = fileURLToPath(new URL('../src/', import.meta.url));
await build({
  configFile: false,
  envDir: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  publicDir: false,
  plugins: [
    {
      name: 'aislar-ciclo-android',
      enforce: 'pre',
      resolveId(id) {
        return ['\0firebase-ficticio', '\0suscripcion-ficticia'].includes(id) ? id : null;
      },
      async load(id) {
        if (id === '\0firebase-ficticio')
          return `export const obtenerFirebase = () => ({ aplicacion: { options: { projectId: 'proyecto-ciclo-ficticio' } } });`;
        if (id === '\0suscripcion-ficticia')
          return `
        export async function consultarEstadoSuscripcion() {
          if (window.chEstadoSimulado === 'sin-conexion') throw new Error('Sin conexión simulada');
          const horaServidor = Date.now();
          const vencimiento = window.chEstadoSimulado === 'pro' ? horaServidor + 600000 :
            window.chEstadoSimulado === 'pro-margen' ? horaServidor - 4 * 86400000 : horaServidor - 6 * 86400000;
          return { estado: window.chEstadoSimulado.startsWith('pro') ? { tipo: 'pro', vencimiento, permiteMargen: true } : { tipo: 'gratis' }, horaServidor, mostrarAvisoPrueba: false };
        }
        export async function reconciliarSuscripcion() { return 'limitada'; }
        export async function confirmarAvisoPrueba() {}`;
        return null;
      },
      transform(codigo, id) {
        if (
          !id.replaceAll('\\', '/').endsWith('/src/servicios/suscripcion/referenciaPersistente.ts')
        )
          return null;
        if (!codigo.includes("'calcula-tu-presupuesto:referencia-suscripcion-v1'"))
          throw new Error('No se pudo aislar la clave de la referencia.');
        return codigo.replace(
          "'calcula-tu-presupuesto:referencia-suscripcion-v1'",
          "'ch:referencia-ciclo-ficticio'",
        );
      },
    },
  ],
  resolve: {
    alias: [
      { find: '@/configuracion/firebase', replacement: '\0firebase-ficticio' },
      {
        find: '@/servicios/suscripcion/servicioSuscripcion',
        replacement: '\0suscripcion-ficticia',
      },
      { find: '@', replacement: raiz },
    ],
  },
  build: {
    outDir: fileURLToPath(
      new URL('../src-capacitor/android/app/src/debug/assets', import.meta.url),
    ),
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: fileURLToPath(
        new URL('../tests/fixtures/ciclo-suscripcion-debug.ts', import.meta.url),
      ),
      name: 'CHCicloSuscripcion',
      formats: ['iife'],
      fileName: () => 'ciclo-suscripcion.debug.js',
    },
  },
});
const salida = fileURLToPath(
  new URL(
    '../src-capacitor/android/app/src/debug/assets/ciclo-suscripcion.debug.js',
    import.meta.url,
  ),
);
const modulo = await readFile(salida, 'utf8');
if (
  !modulo.includes('ch:referencia-ciclo-ficticio') ||
  !modulo.includes('proyecto-ciclo-ficticio') ||
  modulo.includes('calcula-tu-presupuesto:referencia-suscripcion-v1') ||
  modulo.includes('iniciarPruebaSuscripcion')
) {
  await unlink(salida);
  throw new Error('El módulo de prueba no quedó aislado; se eliminó el archivo generado.');
}
