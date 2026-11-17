/** Una compra pendiente todavía no confirma el acceso Pro. */
export function interpretarResultadoCompra(valor: unknown): 'pendiente' | 'verificada' {
  if (!valor || typeof valor !== 'object') throw new Error('Respuesta de compra inválida.');
  const resultado = valor as Record<string, unknown>;
  if (resultado.pendiente === true && resultado.actualizada === false) return 'pendiente';
  if (resultado.actualizada === true && resultado.pendiente === false) return 'verificada';
  throw new Error('La compra necesita una nueva verificación.');
}
