import { esClienteGuardado, type Cliente } from '@/dominio/clientes';
import { RepositorioColeccionFirestore } from '@/repositorios/almacenamiento/RepositorioColeccionFirestore';
import type { RepositorioClientes } from './RepositorioClientes';

export class RepositorioClientesFirestore
  extends RepositorioColeccionFirestore<Cliente>
  implements RepositorioClientes
{
  constructor(uid: string) {
    super(uid, 'clientes', esClienteGuardado);
  }
}
