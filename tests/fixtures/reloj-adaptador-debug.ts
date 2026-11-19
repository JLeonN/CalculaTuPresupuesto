import { obtenerReferenciaRelojAndroid } from '../../src/servicios/suscripcion/relojAndroid';

const ventanaPrueba = globalThis as typeof globalThis & {
  chObtenerReferenciaReloj?: typeof obtenerReferenciaRelojAndroid;
};
ventanaPrueba.chObtenerReferenciaReloj = obtenerReferenciaRelojAndroid;
