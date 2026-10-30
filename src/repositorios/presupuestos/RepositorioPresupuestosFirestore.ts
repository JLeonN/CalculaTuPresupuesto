import { esPresupuestoGuardado, type Presupuesto } from '@/dominio/presupuestos';
import { RepositorioColeccionFirestore } from '@/repositorios/almacenamiento/RepositorioColeccionFirestore';
import type { RepositorioPresupuestos } from './RepositorioPresupuestos';

export class RepositorioPresupuestosFirestore
  extends RepositorioColeccionFirestore<Presupuesto>
  implements RepositorioPresupuestos
{
  constructor(uid: string) {
    super(uid, 'presupuestos', esPresupuestoGuardado);
  }
}
