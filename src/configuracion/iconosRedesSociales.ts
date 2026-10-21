import {
  fabFacebook,
  fabInstagram,
  fabLinkedin,
  fabTiktok,
  fabXTwitter,
  fabYoutube,
  fasGlobe,
} from '@quasar/extras/fontawesome-v7';

const ICONOS_REDES_SOCIALES: Record<string, string> = {
  instagram: fabInstagram,
  facebook: fabFacebook,
  tiktok: fabTiktok,
  youtube: fabYoutube,
  linkedin: fabLinkedin,
  x: fabXTwitter,
};

export function obtenerIconoRedSocial(red: string): string {
  return ICONOS_REDES_SOCIALES[red.trim().toLowerCase()] ?? fasGlobe;
}

export function obtenerImagenRedSocial(red: string): string {
  const [trazadoConEstilo = '', dimensiones = '0 0 512 512'] =
    obtenerIconoRedSocial(red).split('|');
  const [trazado = ''] = trazadoConEstilo.split('@@');
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-documento-destacado')
    .trim();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${dimensiones}" fill="${color}"><path d="${trazado}"/></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
