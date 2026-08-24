import { computed, watch, type WatchStopHandle } from 'vue';
import {
  FAVICON_PREDETERMINADO,
  LOGO_PREDETERMINADO,
  NOMBRE_APLICACION,
  TIPO_MIME_LOGO_PREDETERMINADO,
} from '@/configuracion/identidadAplicacion';
import { useConfiguracionStore } from '@/stores/configuracion';

const ID_FAVICON_APLICACION = 'favicon-aplicacion';

export function useIdentidadAplicacion() {
  const configuracionStore = useConfiguracionStore();
  const nombreEmpresaVisible = computed(
    () => configuracionStore.configuracion.nombreEmpresa.trim() || NOMBRE_APLICACION,
  );
  const logoVisible = computed(
    () => configuracionStore.configuracion.logo?.datosUrl || LOGO_PREDETERMINADO,
  );
  const tipoMimeLogoVisible = computed(
    () => configuracionStore.configuracion.logo?.tipoMime || TIPO_MIME_LOGO_PREDETERMINADO,
  );
  const textoAlternativoLogo = computed(() => `Logo de ${nombreEmpresaVisible.value}`);

  function sincronizarFavicon(): WatchStopHandle {
    return watch(
      [
        () => configuracionStore.configuracion.logo?.datosUrl,
        () => configuracionStore.configuracion.logo?.tipoMime,
      ],
      ([datosUrl, tipoMime]) => {
        const favicon = obtenerFavicon();
        favicon.href = datosUrl || FAVICON_PREDETERMINADO;
        favicon.type = tipoMime || TIPO_MIME_LOGO_PREDETERMINADO;
      },
      { immediate: true },
    );
  }

  return {
    nombreEmpresaVisible,
    logoVisible,
    tipoMimeLogoVisible,
    textoAlternativoLogo,
    sincronizarFavicon,
  };
}

function obtenerFavicon(): HTMLLinkElement {
  const faviconExistente = document.querySelector<HTMLLinkElement>(`link#${ID_FAVICON_APLICACION}`);

  if (faviconExistente) {
    return faviconExistente;
  }

  const favicon = document.createElement('link');
  favicon.id = ID_FAVICON_APLICACION;
  favicon.rel = 'icon';
  document.head.append(favicon);
  return favicon;
}
