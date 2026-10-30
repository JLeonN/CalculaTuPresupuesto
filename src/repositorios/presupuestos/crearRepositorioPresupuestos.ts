import { crearAlmacenamientoAplicacion } from '@/repositorios/almacenamiento/crearAlmacenamientoAplicacion';
import { RepositorioPresupuestosLocal } from './RepositorioPresupuestosLocal';
import { RepositorioPresupuestosFirestore } from './RepositorioPresupuestosFirestore';
import { crearRepositorioSegunSesion } from '@/repositorios/almacenamiento/crearRepositorioSegunSesion';
import type { RepositorioPresupuestos } from './RepositorioPresupuestos';

export function crearRepositorioPresupuestos(): RepositorioPresupuestos {
  return crearRepositorioSegunSesion<RepositorioPresupuestos>(
    () => new RepositorioPresupuestosLocal(crearAlmacenamientoAplicacion()),
    (uid) => new RepositorioPresupuestosFirestore(uid),
  );
}
