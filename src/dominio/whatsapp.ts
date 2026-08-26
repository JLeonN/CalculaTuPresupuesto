import { formatearImporte, type Moneda } from '@/dominio/monedas';
import {
  calcularTotalManoObraYTraslado,
  calcularTotalMateriales,
  calcularTotalPresupuesto,
  type LineaPresupuesto,
} from '@/dominio/presupuestos';

export interface DatosMensajePresupuestoWhatsapp {
  nombreCliente: string;
  nombreResponsable: string;
  nombreEmpresa: string;
  fechaPresupuesto: string;
  moneda: Moneda;
  lineas: readonly LineaPresupuesto[];
}

export function normalizarNumeroWhatsapp(numeroIngresado: string): string {
  const numero = numeroIngresado.trim();
  const incluyeCodigoPais = numero.startsWith('+') || numero.startsWith('00');
  const numeroSoloDigitos = numero.replace(/\D/g, '').replace(/^00/, '');

  if (numeroSoloDigitos.startsWith('598')) {
    return numeroSoloDigitos;
  }

  if (incluyeCodigoPais) {
    return numeroSoloDigitos;
  }

  return numeroSoloDigitos.startsWith('0')
    ? `598${numeroSoloDigitos.slice(1)}`
    : numeroSoloDigitos === ''
      ? ''
      : `598${numeroSoloDigitos}`;
}

export function crearEnlaceWhatsapp(numero: string, mensaje: string): string {
  const numeroNormalizado = normalizarNumeroWhatsapp(numero);
  const consultaMensaje = mensaje.trim() ? `?text=${encodeURIComponent(mensaje.trim())}` : '';
  return `https://wa.me/${numeroNormalizado}${consultaMensaje}`;
}

export function crearMensajePresupuestoWhatsapp(datos: DatosMensajePresupuestoWhatsapp): string {
  const nombreCliente = datos.nombreCliente.trim() || 'Cliente';
  const nombreResponsable = datos.nombreResponsable.trim();
  const nombreEmpresa = datos.nombreEmpresa.trim();
  const fecha = formatearFechaPresupuesto(datos.fechaPresupuesto);
  const totalManoObra = calcularTotalManoObraYTraslado(datos.lineas, datos.moneda);
  const totalMateriales = calcularTotalMateriales(datos.lineas, datos.moneda);
  const total = calcularTotalPresupuesto(datos.lineas, datos.moneda);

  return [
    `Hola, *${nombreCliente}*`,
    '',
    crearPresentacionPresupuesto(nombreResponsable, nombreEmpresa, fecha),
    '',
    '*Resumen del presupuesto*',
    '',
    `• Mano de obra: *${formatearImporte(totalManoObra, datos.moneda)}*`,
    `• Materiales: *${formatearImporte(totalMateriales, datos.moneda)}*`,
    '',
    `*Total: ${formatearImporte(total, datos.moneda)}*`,
    '',
    'Adjunto encontrarás el presupuesto completo en PDF.',
    '',
    'Quedo a disposición por cualquier consulta.',
  ].join('\n');
}

function crearPresentacionPresupuesto(
  nombreResponsable: string,
  nombreEmpresa: string,
  fecha: string,
): string {
  if (nombreResponsable && nombreEmpresa) {
    return `Soy *${nombreResponsable}*, de *${nombreEmpresa}*. Te comparto el presupuesto solicitado, con fecha *${fecha}*.`;
  }

  if (nombreResponsable) {
    return `Soy *${nombreResponsable}*. Te comparto el presupuesto solicitado, con fecha *${fecha}*.`;
  }

  if (nombreEmpresa) {
    return `Desde *${nombreEmpresa}* te compartimos el presupuesto solicitado, con fecha *${fecha}*.`;
  }

  return `Te comparto el presupuesto solicitado, con fecha *${fecha}*.`;
}

function formatearFechaPresupuesto(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;
}
