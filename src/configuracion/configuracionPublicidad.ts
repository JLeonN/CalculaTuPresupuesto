export const PUBLICIDAD_DE_PRUEBA: boolean = false;

export const ID_APLICACION_ADMOB_ANDROID = 'ca-app-pub-7620083100302566~7742704663';
export const ID_BANNER_ADMOB_ANDROID = 'ca-app-pub-7620083100302566/2220669269';
export const ID_BANNER_PRUEBA_ANDROID = 'ca-app-pub-3940256099942544/6300978111';

export function obtenerConfiguracionSolicitudPublicidad(unidades: {
  produccion: string;
  prueba: string;
}): { adId: string; isTesting: boolean } {
  if (!unidades.produccion?.trim() || !unidades.prueba?.trim()) {
    throw new Error('La publicidad requiere unidades de producción y prueba válidas.');
  }

  return {
    adId: PUBLICIDAD_DE_PRUEBA ? unidades.prueba : unidades.produccion,
    isTesting: PUBLICIDAD_DE_PRUEBA,
  };
}
