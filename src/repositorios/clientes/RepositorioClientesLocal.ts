import { esClienteGuardado, type Cliente } from '@/dominio/clientes';
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

    let valor: unknown;
    try {
      valor = JSON.parse(datosGuardados) as unknown;
    } catch {
      throw new Error('Los clientes guardados tienen un formato ilegible.');
    }
    if (!Array.isArray(valor)) {
      throw new Error('El almacenamiento de clientes no contiene una lista válida.');
    }
    const clientes = valor.map((cliente: unknown) => normalizarClienteAnterior(cliente));
    if (
      !clientes.every(esClienteGuardado) ||
      new Set(clientes.map((cliente) => cliente.id)).size !== clientes.length
    ) {
      throw new Error('Hay clientes guardados que no se pudieron recuperar de forma segura.');
    }
    return structuredClone(clientes);
  }

  async agregarFaltantes(clientesEntrantes: readonly Cliente[]): Promise<number> {
    if (
      !clientesEntrantes.every(esClienteGuardado) ||
      new Set(clientesEntrantes.map((cliente) => cliente.id)).size !== clientesEntrantes.length
    ) {
      throw new Error('La copia contiene clientes inválidos.');
    }
    const clientes = await this.obtenerTodos();
    const ids = new Set(clientes.map((cliente) => cliente.id));
    const faltantes = clientesEntrantes.filter((cliente) => !ids.has(cliente.id));
    if (faltantes.length === 0) return 0;
    await this.guardarTodos([...clientes, ...structuredClone(faltantes)]);
    return faltantes.length;
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
    const valor = JSON.stringify(clientes);
    await this.almacenamiento.guardar(CLAVES_ALMACENAMIENTO.clientes, valor);
    if (await this.almacenamiento.obtener(CLAVES_ALMACENAMIENTO.clientes) !== valor) {
      throw new Error('No se pudo verificar el guardado de clientes.');
    }
  }
}

function normalizarClienteAnterior(valor: unknown): unknown {
  if (typeof valor !== 'object' || valor === null || !('locales' in valor) || !Array.isArray(valor.locales)) {
    return valor;
  }
  return {
    ...valor,
    locales: valor.locales.map((local: unknown) =>
      typeof local === 'object' && local !== null && !('telefonos' in local)
        ? { ...local, telefonos: [] }
        : local,
    ),
  };
}
