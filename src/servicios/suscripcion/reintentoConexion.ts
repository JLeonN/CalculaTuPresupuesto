/** Conserva un reintento solicitado mientras otra consulta está terminando. */
export function crearReintentoConexion(opciones: {
  disponible: () => boolean;
  cargando: () => boolean;
  consultar: () => void;
}): { solicitar: () => void; alTerminar: () => void } {
  let pendiente = false;
  function solicitar(): void {
    if (!opciones.disponible()) {
      pendiente = false;
    } else if (opciones.cargando()) {
      pendiente = true;
    } else {
      pendiente = false;
      opciones.consultar();
    }
  }
  return {
    solicitar,
    alTerminar: () => {
      if (pendiente) solicitar();
    },
  };
}
