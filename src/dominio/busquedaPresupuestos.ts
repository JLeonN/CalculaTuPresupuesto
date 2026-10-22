import type { Presupuesto } from '@/dominio/presupuestos';

export function coincideBusquedaPresupuesto(presupuesto: Presupuesto, termino: string): boolean {
  const consulta = normalizarTexto(termino);
  if (consulta === '') return true;

  const nombre = normalizarTexto(presupuesto.destinatario.nombre);
  const fecha = presupuesto.fechaPresupuesto;
  const [anio, mes, dia] = fecha.split('-');
  const fechaVisible = anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;

  if (
    consulta.includes('/') ||
    /^\d{1,2}-\d{1,2}-\d{4}$/.test(consulta) ||
    /^\d{4}-\d{1,2}-\d{1,2}$/.test(consulta)
  ) {
    const fechaConsultada = consulta.replace(/\s*([/-])\s*/g, '$1');
    return (
      fechaVisible.includes(fechaConsultada.replace(/-/g, '/')) ||
      fecha.includes(fechaConsultada.replace(/\//g, '-'))
    );
  }

  if (/^[\d\s()+-]+$/.test(consulta)) {
    const digitos = consulta.replace(/\D/g, '');
    const telefono = presupuesto.destinatario.telefono.replace(/\D/g, '');
    return telefono.includes(digitos) || fecha.includes(digitos) || fechaVisible.includes(digitos);
  }

  return consulta.split(/\s+/).every((palabra) => nombre.includes(palabra));
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es');
}
