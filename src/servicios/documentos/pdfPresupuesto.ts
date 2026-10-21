import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const FORMATO_PDF = 'application/pdf';

export async function generarPdfPresupuesto(elementoDocumento: HTMLElement): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const contenedorExportacion = document.createElement('div');
  const copiaDocumento = elementoDocumento.cloneNode(true) as HTMLElement;

  contenedorExportacion.className = 'contenedor-exportacion-pdf';
  copiaDocumento.classList.add('documento-presupuesto--exportando');
  copiaDocumento.classList.remove('documento-presupuesto--oculto');
  contenedorExportacion.append(copiaDocumento);
  document.body.append(contenedorExportacion);

  try {
    await document.fonts.ready;
    await esperarImagenes(copiaDocumento);
    convertirIconosRedesSocialesAPng(copiaDocumento);
    await esperarImagenes(copiaDocumento);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    await pdf.html(copiaDocumento, {
      autoPaging: 'text',
      margin: 0,
      width: 210,
      windowWidth: copiaDocumento.scrollWidth,
      html2canvas: {
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      },
      image: {
        type: 'jpeg',
        quality: 0.98,
      },
    });

    return pdf.output('blob');
  } finally {
    contenedorExportacion.remove();
  }
}

export function crearNombreArchivoPresupuesto(nombreCliente: string, fecha = new Date()): string {
  const nombreSeguro = normalizarParteNombreArchivo(nombreCliente) || 'Cliente';
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');

  return `Presupuesto-${nombreSeguro}-${dia}-${mes}-${anio}(${hora}-${minutos}).pdf`;
}

export async function descargarPdfPresupuesto(pdf: Blob, nombreArchivo: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    descargarBlobEnNavegador(pdf, nombreArchivo);
    return;
  }

  await asegurarPermisoDocumentos();
  await Filesystem.writeFile({
    path: nombreArchivo,
    data: await convertirBlobABase64(pdf),
    directory: Directory.Documents,
    recursive: true,
  });
}

async function asegurarPermisoDocumentos(): Promise<void> {
  const permisosActuales = await Filesystem.checkPermissions();

  if (permisosActuales.publicStorage === 'granted') {
    return;
  }

  const permisosSolicitados = await Filesystem.requestPermissions();

  if (permisosSolicitados.publicStorage !== 'granted') {
    throw new Error('Necesitamos permiso para guardar el PDF en la carpeta Documentos.');
  }
}

export async function compartirPdfPresupuesto(
  pdf: Blob,
  nombreArchivo: string,
  mensaje: string,
): Promise<void> {
  const archivo = await Filesystem.writeFile({
    path: nombreArchivo,
    data: await convertirBlobABase64(pdf),
    directory: Directory.Cache,
    recursive: true,
  });

  await Share.share({
    title: nombreArchivo,
    text: mensaje,
    files: [archivo.uri],
    dialogTitle: 'Enviar presupuesto por WhatsApp',
  });
}

export function esPlataformaNativa(): boolean {
  return Capacitor.isNativePlatform();
}

function normalizarParteNombreArchivo(valor: string): string {
  return Array.from(valor)
    .filter((caracter) => caracter.charCodeAt(0) >= 32)
    .join('')
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[. ]+$/g, '');
}

function descargarBlobEnNavegador(pdf: Blob, nombreArchivo: string): void {
  const enlace = document.createElement('a');
  const url = URL.createObjectURL(new Blob([pdf], { type: FORMATO_PDF }));

  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function convertirBlobABase64(blob: Blob): Promise<string> {
  return await new Promise((resolver, rechazar) => {
    const lector = new FileReader();

    lector.onerror = () => rechazar(new Error('No se pudo preparar el archivo PDF.'));
    lector.onload = () => {
      if (typeof lector.result !== 'string') {
        rechazar(new Error('No se pudo convertir el archivo PDF.'));
        return;
      }

      const resultado = lector.result;
      resolver(resultado.substring(resultado.indexOf(',') + 1));
    };
    lector.readAsDataURL(blob);
  });
}

async function esperarImagenes(elemento: HTMLElement): Promise<void> {
  const imagenes = Array.from(elemento.querySelectorAll('img'));

  await Promise.all(
    imagenes.map(async (imagen) => {
      if (!imagen.complete) {
        await new Promise<void>((resolver) => {
          imagen.addEventListener('load', () => resolver(), { once: true });
          imagen.addEventListener('error', () => resolver(), { once: true });
        });
      }

      await imagen.decode().catch(() => undefined);
    }),
  );
}

function convertirIconosRedesSocialesAPng(elemento: HTMLElement): void {
  const iconos = elemento.querySelectorAll<HTMLImageElement>('.documento-presupuesto__icono-red');
  const colorFondo = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-documento-destacado-suave')
    .trim();

  for (const icono of iconos) {
    const lienzo = document.createElement('canvas');
    lienzo.width = icono.naturalWidth;
    lienzo.height = icono.naturalHeight;
    const contexto = lienzo.getContext('2d');

    if (!contexto) {
      throw new Error('No se pudo preparar el ícono de la red social para el PDF.');
    }

    // El fondo opaco evita que html2canvas convierta la transparencia del ícono en negro.
    contexto.fillStyle = colorFondo;
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
    contexto.drawImage(icono, 0, 0);
    icono.src = lienzo.toDataURL('image/png');
  }
}
