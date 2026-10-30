type EstadoSincronizacion = 'pendiente' | 'sincronizado' | 'error';
const ESPERA_CONFIRMACION_MS = 3_000;
let escriturasPendientes = 0;

function avisar(estado: EstadoSincronizacion): void {
  window.dispatchEvent(new CustomEvent('firebase-sincronizacion', { detail: estado }));
}

export async function esperarEscrituraFirestore(escritura: Promise<void>): Promise<void> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  try {
    const estado = await Promise.race([
      escritura.then(() => 'confirmado' as const),
      new Promise<'pendiente'>((resolver) => {
        temporizador = setTimeout(() => resolver('pendiente'), ESPERA_CONFIRMACION_MS);
      }),
    ]);
    if (estado === 'confirmado') return;

    escriturasPendientes += 1;
    if (escriturasPendientes === 1) avisar('pendiente');
    void escritura.then(
      () => {
        escriturasPendientes -= 1;
        if (escriturasPendientes === 0) avisar('sincronizado');
      },
      () => {
        escriturasPendientes -= 1;
        avisar('error');
      },
    );
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}
