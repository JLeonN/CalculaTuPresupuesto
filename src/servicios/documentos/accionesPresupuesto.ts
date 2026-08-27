import { ErrorSalidaPresupuestoRestringida } from '@/dominio/autenticacion';
import type { ConfiguracionDocumentoPresupuesto, DatosPresupuesto } from '@/dominio/presupuestos';
import {
  crearEnlaceWhatsapp,
  crearMensajePresupuestoWhatsapp,
  normalizarNumeroWhatsapp,
} from '@/dominio/whatsapp';
import {
  compartirPdfPresupuesto,
  crearNombreArchivoPresupuesto,
  descargarPdfPresupuesto,
  esPlataformaNativa,
  generarPdfPresupuesto,
} from '@/servicios/documentos/pdfPresupuesto';

export interface OpcionesAccionDocumentoPresupuesto {
  datos: DatosPresupuesto;
  configuracion: ConfiguracionDocumentoPresupuesto;
  obtenerElemento: () => HTMLElement | null;
  permitirSalida: boolean;
  antesDeGenerar?: () => Promise<void>;
}

export async function descargarDocumentoPresupuesto(
  opciones: OpcionesAccionDocumentoPresupuesto,
): Promise<'nativo' | 'web'> {
  validarPermisoSalida(opciones);
  const { pdf, nombreArchivo } = await prepararDocumento(opciones);
  await descargarPdfPresupuesto(pdf, nombreArchivo);
  return esPlataformaNativa() ? 'nativo' : 'web';
}

export async function enviarDocumentoPresupuesto(
  opciones: OpcionesAccionDocumentoPresupuesto,
): Promise<'nativo' | 'web'> {
  validarPermisoSalida(opciones);
  const numeroWhatsapp = normalizarNumeroWhatsapp(opciones.datos.destinatario.telefono);
  const nombreCliente = opciones.datos.destinatario.nombre.trim();

  if (numeroWhatsapp === '' || nombreCliente === '') {
    throw new Error('Completá el nombre y el teléfono del cliente antes de enviar.');
  }

  const esNativo = esPlataformaNativa();
  const ventanaWhatsapp = esNativo ? null : window.open('about:blank', '_blank');

  try {
    const { pdf, nombreArchivo } = await prepararDocumento(opciones);
    const mensaje = crearMensajePresupuestoWhatsapp({
      nombreCliente,
      nombreResponsable: opciones.configuracion.nombreResponsable,
      nombreEmpresa: opciones.configuracion.nombreEmpresa,
      fechaPresupuesto: opciones.datos.fechaPresupuesto,
      moneda: opciones.datos.moneda,
      lineas: opciones.datos.lineas,
    });

    if (esNativo) {
      await compartirPdfPresupuesto(pdf, nombreArchivo, mensaje);
      return 'nativo';
    }

    await descargarPdfPresupuesto(pdf, nombreArchivo);
    const enlaceWhatsapp = crearEnlaceWhatsapp(numeroWhatsapp, mensaje);

    if (ventanaWhatsapp) {
      ventanaWhatsapp.opener = null;
      ventanaWhatsapp.location.href = enlaceWhatsapp;
    } else {
      window.open(enlaceWhatsapp, '_blank', 'noopener,noreferrer');
    }

    return 'web';
  } catch (errorCapturado) {
    ventanaWhatsapp?.close();
    throw errorCapturado;
  }
}

function validarPermisoSalida(opciones: OpcionesAccionDocumentoPresupuesto): void {
  if (!opciones.permitirSalida) {
    throw new ErrorSalidaPresupuestoRestringida();
  }
}

async function prepararDocumento(
  opciones: OpcionesAccionDocumentoPresupuesto,
): Promise<{ pdf: Blob; nombreArchivo: string }> {
  await opciones.antesDeGenerar?.();
  const elemento = opciones.obtenerElemento();

  if (!elemento) {
    throw new Error('No se pudo preparar el documento del presupuesto.');
  }

  return {
    pdf: await generarPdfPresupuesto(elemento),
    nombreArchivo: crearNombreArchivoPresupuesto(opciones.datos.destinatario.nombre),
  };
}
