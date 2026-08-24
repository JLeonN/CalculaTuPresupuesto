import type { Cliente } from '@/dominio/clientes';
import { CLAVES_ALMACENAMIENTO } from '@/configuracion/clavesAlmacenamiento';
import type { AlmacenamientoClaveValor } from './AlmacenamientoClaveValor';
import type { RepositorioClientes } from './RepositorioClientes';

export class RepositorioClientesLocal implements RepositorioClientes {
  // TODO(firebase): sustituir este repositorio por Firestore sin cambiar el contrato ni los identificadores actuales.
  constructor(private readonly almacenamiento: AlmacenamientoClaveValor) {}

  async obtenerTodos(): Promise<Cliente[]> {
    const datosGuardados = await this.almacenamiento.obtener(CLAVES_ALMACENAMIENTO.clientes);

    if (datosGuardados === null) {
      return [];
    }

    try {
      const clientes = JSON.parse(datosGuardados) as unknown;
      return Array.isArray(clientes) ? structuredClone(clientes as Cliente[]) : [];
    } catch {
      return [];
    }
  }

  async guardar(cliente: Cliente): Promise<void> {
    const clientes = await this.obtenerTodos();
    const indiceCliente = clientes.findIndex((clienteActual) => clienteActual.id === cliente.id);

    if (indiceCliente === -1) {
      clientes.push(structuredClone(cliente));
    } else {
      clientes.splice(indiceCliente, 1, structuredClone(cliente));
    }

    await this.guardarTodos(clientes);
  }

  async eliminar(idCliente: string): Promise<void> {
    const clientes = await this.obtenerTodos();
    await this.guardarTodos(clientes.filter((cliente) => cliente.id !== idCliente));
  }

  private async guardarTodos(clientes: Cliente[]): Promise<void> {
    await this.almacenamiento.guardar(CLAVES_ALMACENAMIENTO.clientes, JSON.stringify(clientes));
  }
}
