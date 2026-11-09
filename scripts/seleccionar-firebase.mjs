import { readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

const PROYECTOS = {
  pruebas: 'calculatupresupuesto-pru-b2e9a',
  produccion: 'calculatupresupuesto-prod',
};
const PAQUETE_ANDROID = 'com.calculatupresupuesto.app';
const VARIABLES_OBLIGATORIAS = [
  'QCLI_FIREBASE_API_KEY',
  'QCLI_FIREBASE_AUTH_DOMAIN',
  'QCLI_FIREBASE_PROJECT_ID',
  'QCLI_FIREBASE_APP_ID',
];
const raiz = resolve(import.meta.dirname, '..');
const entorno = process.argv[2];

async function leerAnterior(ruta) {
  try {
    return await readFile(ruta);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function seleccionarEntorno() {
  if (!Object.hasOwn(PROYECTOS, entorno) || process.argv.length !== 3) {
    throw new Error('Indicá exactamente un entorno: pruebas o produccion.');
  }

  const rutaEnv = resolve(raiz, `.env.firebase.${entorno}`);
  const rutaAndroid = resolve(raiz, `google-services.${entorno}.json`);
  const destinoEnv = resolve(raiz, '.env.local');
  const destinoAndroid = resolve(raiz, 'src-capacitor/android/app/google-services.json');
  const [contenidoEnv, contenidoAndroid] = await Promise.all([
    readFile(rutaEnv, 'utf8'),
    readFile(rutaAndroid, 'utf8'),
  ]);
  const variables = {};
  for (const linea of contenidoEnv.split(/\r?\n/)) {
    const coincidencia = linea.match(/^\s*(QCLI_FIREBASE_[A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (coincidencia) {
      if (Object.hasOwn(variables, coincidencia[1])) {
        throw new Error(`Variable duplicada: ${coincidencia[1]}.`);
      }
      variables[coincidencia[1]] = coincidencia[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  for (const nombre of VARIABLES_OBLIGATORIAS) {
    if (!variables[nombre]) throw new Error(`Falta completar ${nombre}.`);
  }
  let configuracionAndroid;
  try {
    configuracionAndroid = JSON.parse(contenidoAndroid);
  } catch {
    throw new Error('La configuración Android no es un JSON válido.');
  }
  const proyecto = PROYECTOS[entorno];
  if (
    variables.QCLI_FIREBASE_PROJECT_ID !== proyecto ||
    configuracionAndroid.project_info?.project_id !== proyecto ||
    !configuracionAndroid.client?.some(
      (cliente) => cliente.client_info?.android_client_info?.package_name === PAQUETE_ANDROID,
    )
  ) {
    throw new Error('Los proyectos o el paquete Android no coinciden con el entorno elegido.');
  }

  const anteriores = await Promise.all([leerAnterior(destinoEnv), leerAnterior(destinoAndroid)]);
  try {
    await writeFile(destinoEnv, contenidoEnv, 'utf8');
    await writeFile(destinoAndroid, contenidoAndroid, 'utf8');
  } catch (error) {
    const restauraciones = await Promise.allSettled(
      [destinoEnv, destinoAndroid].map((ruta, indice) =>
        anteriores[indice] === null ? unlink(ruta).catch((fallo) => {
          if (fallo.code !== 'ENOENT') throw fallo;
        }) : writeFile(ruta, anteriores[indice]),
      ),
    );
    if (restauraciones.some((resultado) => resultado.status === 'rejected')) {
      throw new Error('Falló la copia y no se pudieron restaurar ambos archivos. Revisalos antes de compilar.');
    }
    throw new Error('Falló la copia; se restauraron las configuraciones anteriores.', { cause: error });
  }
  console.log(`Entorno seleccionado: ${entorno}. Proyecto: ${proyecto}.`);
}

seleccionarEntorno().catch((error) => {
  console.error(`No se pudo seleccionar Firebase: ${error.message}`);
  process.exitCode = 1;
});
