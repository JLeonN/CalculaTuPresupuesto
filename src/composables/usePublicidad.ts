import { ref, type Ref } from 'vue';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';
import { Notify } from 'quasar';
import {
  ID_BANNER_ADMOB_ANDROID,
  ID_BANNER_PRUEBA_ANDROID,
  obtenerConfiguracionSolicitudPublicidad,
} from '@/configuracion/configuracionPublicidad';

const ALTO_BANNER_ESTANDAR = 50;
const ANCHO_MINIMO_BANNER = 320;

const altoBanner: Ref<number> = ref(0);
const mostrarOpcionesPrivacidad: Ref<boolean> = ref(false);
let generacionSolicitud = 0;
let admobInicializado = false;
let bannerSolicitado = false;
let bannerNativoCreado = false;
let solicitudEnCurso: Promise<void> | null = null;
let colaOperaciones: Promise<void> = Promise.resolve();
const escuchasBanner: PluginListenerHandle[] = [];

function esAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

function requiereOpcionesPrivacidad(estado: string): boolean {
  // El plugin declara este enum en sus tipos, pero no lo exporta desde su API pública.
  return estado === 'REQUIRED';
}

function ejecutarEnCola(operacion: () => Promise<void>): Promise<void> {
  const resultado = colaOperaciones.then(operacion, operacion);
  colaOperaciones = resultado.catch(() => undefined);
  return resultado;
}

async function limpiarBanner(): Promise<void> {
  altoBanner.value = 0;
  bannerSolicitado = false;

  if (bannerNativoCreado) {
    bannerNativoCreado = false;
    try {
      await AdMob.removeBanner();
    } catch {
      // Una falla del SDK no debe bloquear la navegación ni la próxima solicitud.
    }
  }

  const escuchasAnteriores = escuchasBanner.splice(0);
  await Promise.allSettled(escuchasAnteriores.map((escucha) => escucha.remove()));
}

function retirarBannerPorFallo(generacion: number): void {
  if (generacion !== generacionSolicitud) return;

  generacionSolicitud += 1;
  altoBanner.value = 0;
  bannerSolicitado = false;
  void ejecutarEnCola(limpiarBanner);
}

async function registrarEscuchasBanner(generacion: number): Promise<void> {
  escuchasBanner.push(
    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, ({ height }) => {
      if (generacion !== generacionSolicitud) return;
      if (height <= 0) {
        retirarBannerPorFallo(generacion);
      } else {
        altoBanner.value = height;
      }
    }),
  );
  if (generacion !== generacionSolicitud) return;

  escuchasBanner.push(
    await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      if (generacion === generacionSolicitud && altoBanner.value === 0) {
        altoBanner.value = ALTO_BANNER_ESTANDAR;
      }
    }),
  );
  if (generacion !== generacionSolicitud) return;

  escuchasBanner.push(
    await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
      retirarBannerPorFallo(generacion);
    }),
  );
}

function iniciarPublicidad(): Promise<void> {
  if (!esAndroid() || window.innerWidth < ANCHO_MINIMO_BANNER) {
    return Promise.resolve();
  }
  if (bannerSolicitado) return Promise.resolve();
  if (solicitudEnCurso) return solicitudEnCurso;

  const generacion = ++generacionSolicitud;
  const solicitud = ejecutarEnCola(async () => {
    if (generacion !== generacionSolicitud) return;
    let consultaConsentimientoCompleta = false;

    try {
      let consentimiento = await AdMob.requestConsentInfo();
      if (generacion !== generacionSolicitud) return;
      consultaConsentimientoCompleta = true;

      mostrarOpcionesPrivacidad.value = requiereOpcionesPrivacidad(
        consentimiento.privacyOptionsRequirementStatus,
      );

      if (
        consentimiento.status === AdmobConsentStatus.REQUIRED &&
        consentimiento.isConsentFormAvailable
      ) {
        consentimiento = await AdMob.showConsentForm();
        if (generacion !== generacionSolicitud) return;
        mostrarOpcionesPrivacidad.value = requiereOpcionesPrivacidad(
          consentimiento.privacyOptionsRequirementStatus,
        );
      }

      if (!consentimiento.canRequestAds || window.innerWidth < ANCHO_MINIMO_BANNER) return;

      if (!admobInicializado) {
        await AdMob.initialize();
        if (generacion !== generacionSolicitud) return;
        admobInicializado = true;
      }

      await registrarEscuchasBanner(generacion);
      if (generacion !== generacionSolicitud) return;

      const configuracion = obtenerConfiguracionSolicitudPublicidad({
        produccion: ID_BANNER_ADMOB_ANDROID,
        prueba: ID_BANNER_PRUEBA_ANDROID,
      });

      // El espacio se reserva antes de pedir el anuncio para que no mueva los controles.
      altoBanner.value = ALTO_BANNER_ESTANDAR;
      bannerSolicitado = true;
      bannerNativoCreado = true;
      await AdMob.showBanner({
        ...configuracion,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
      });
      if (generacion !== generacionSolicitud) return;
    } catch {
      if (generacion === generacionSolicitud) {
        if (!consultaConsentimientoCompleta) mostrarOpcionesPrivacidad.value = false;
        bannerSolicitado = false;
        altoBanner.value = 0;
      }
    } finally {
      if (generacion !== generacionSolicitud || !bannerSolicitado) {
        await limpiarBanner();
      }
    }
  });

  solicitudEnCurso = solicitud;
  void solicitud.finally(() => {
    if (solicitudEnCurso === solicitud) solicitudEnCurso = null;
  });
  return solicitud;
}

function detenerPublicidad(): Promise<void> {
  generacionSolicitud += 1;
  altoBanner.value = 0;
  mostrarOpcionesPrivacidad.value = false;
  bannerSolicitado = false;
  solicitudEnCurso = null;

  if (!esAndroid()) return Promise.resolve();
  return ejecutarEnCola(limpiarBanner);
}

async function abrirOpcionesPrivacidad(): Promise<void> {
  if (!esAndroid() || !mostrarOpcionesPrivacidad.value) return;

  await detenerPublicidad();
  try {
    await AdMob.showPrivacyOptionsForm();
  } catch {
    Notify.create({
      message: 'No se pudieron abrir las opciones de privacidad. Intentá nuevamente.',
      position: 'top',
      classes: 'notificacion-error',
    });
  }
}

export function usePublicidad(): {
  altoBanner: Ref<number>;
  mostrarOpcionesPrivacidad: Ref<boolean>;
  iniciarPublicidad: () => Promise<void>;
  detenerPublicidad: () => Promise<void>;
  abrirOpcionesPrivacidad: () => Promise<void>;
} {
  return {
    altoBanner,
    mostrarOpcionesPrivacidad,
    iniciarPublicidad,
    detenerPublicidad,
    abrirOpcionesPrivacidad,
  };
}
