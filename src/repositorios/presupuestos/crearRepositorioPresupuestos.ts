import { crearAlmacenamientoAplicacion } from '@/repositorios/almacenamiento/crearAlmacenamientoAplicacion';
import { RepositorioPresupuestosLocal } from './RepositorioPresupuestosLocal';
import type { RepositorioPresupuestos } from './RepositorioPresupuestos';

export function crearRepositorioPresupuestos(): RepositorioPresupuestos {
  // TODO(firebase): reemplazar esta selección por el repositorio compartido de presupuestos.
  return new RepositorioPresupuestosLocal(crearAlmacenamientoAplicacion());
}
