import { recuperarPresupuestoGuardado, type Presupuesto } from '@/dominio/presupuestos';
import { CLAVES_ALMACENAMIENTO } from '@/configuracion/clavesAlmacenamiento';
import type { AlmacenamientoClaveValor } from '@/repositorios/clientes/AlmacenamientoClaveValor';
import type { RepositorioPresupuestos } from './RepositorioPresupuestos';

export class RepositorioPresupuestosLocal implements RepositorioPresupuestos {
  // TODO(firebase): sustituir este repositorio por Firestore conservando las copias históricas.
  constructor(private readonly almacenamiento: AlmacenamientoClaveValor) {}

  async obtenerTodos(): Promise<Presupuesto[]> {
    const datosGuardados = await this.almacenamiento.obtener(CLAVES_ALMACENAMIENTO.presupuestos);

    if (datosGuardados === null) {
      return [];
    }

    let presupuestos: unknown;

    try {
      presupuestos = JSON.parse(datosGuardados) as unknown;
    } catch (error) {
      throw new Error('Los presupuestos guardados tienen un formato ilegible.', { cause: error });
    }

    if (!Array.isArray(presupuestos)) {
      throw new Error('El almacenamiento de presupuestos no contiene una lista válida.');
    }

    const presupuestosRecuperados = presupuestos.map(recuperarPresupuestoGuardado);

    if (presupuestosRecuperados.some((presupuesto) => presupuesto === null)) {
      throw new Error('Hay presupuestos guardados que no se pudieron recuperar de forma segura.');
    }

    return presupuestosRecuperados.filter(
      (presupuesto): presupuesto is Presupuesto => presupuesto !== null,
    );
  }

  async guardar(presupuesto: Presupuesto): Promise<void> {
    const presupuestos = await this.obtenerTodos();
    const indicePresupuesto = presupuestos.findIndex(
      (presupuestoActual) => presupuestoActual.id === presupuesto.id,
    );

    if (indicePresupuesto === -1) {
      presupuestos.push(presupuesto);
    } else {
      presupuestos.splice(indicePresupuesto, 1, presupuesto);
    }

    await this.almacenamiento.guardar(
      CLAVES_ALMACENAMIENTO.presupuestos,
      JSON.stringify(presupuestos),
    );
  }
}
