import { computed, ref } from 'vue';
import {
  actualizarCliente,
  crearCliente,
  type Cliente,
  type DatosCliente,
} from '@/dominio/clientes';
import { crearRepositorioClientes } from '@/repositorios/clientes/crearRepositorioClientes';
import { defineStore } from 'pinia';

const repositorioClientes = crearRepositorioClientes();

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref<Cliente[]>([]);
  const cargando = ref(false);
  const guardando = ref(false);
  const error = ref<string | null>(null);
  let versionDatos = 0;

  function invalidarDatos(): void {
    versionDatos += 1;
    clientes.value = [];
    error.value = null;
    cargando.value = false;
    guardando.value = false;
  }

  const clientesOrdenados = computed(() =>
    [...clientes.value].sort((clienteA, clienteB) =>
      clienteA.nombre.localeCompare(clienteB.nombre, 'es', { sensitivity: 'base' }),
    ),
  );

  async function cargarClientes(): Promise<void> {
    const version = versionDatos;
    cargando.value = true;
    error.value = null;

    try {
      const resultado = await repositorioClientes.obtenerTodos();
      if (version === versionDatos) clientes.value = resultado;
    } catch {
      if (version === versionDatos) error.value = 'No se pudieron cargar los clientes guardados.';
    } finally {
      if (version === versionDatos) cargando.value = false;
    }
  }

  async function agregarCliente(datos: DatosCliente): Promise<Cliente> {
    const version = versionDatos;
    guardando.value = true;
    error.value = null;
    const cliente = crearCliente(datos);

    try {
      await repositorioClientes.guardar(cliente);
      if (version !== versionDatos) throw new Error('La sesión cambió durante el guardado.');
      clientes.value = [...clientes.value, cliente];
      return cliente;
    } catch {
      error.value = 'No se pudo guardar el cliente.';
      throw new Error(error.value);
    } finally {
      guardando.value = false;
    }
  }

  async function editarCliente(idCliente: string, datos: DatosCliente): Promise<Cliente> {
    const version = versionDatos;
    const clienteActual = obtenerClientePorId(idCliente);

    if (clienteActual === undefined) {
      throw new Error('El cliente que intentás editar ya no existe.');
    }

    guardando.value = true;
    error.value = null;
    const clienteActualizado = actualizarCliente(clienteActual, datos);

    try {
      await repositorioClientes.guardar(clienteActualizado);
      if (version !== versionDatos) throw new Error('La sesión cambió durante el guardado.');
      clientes.value = clientes.value.map((cliente) =>
        cliente.id === idCliente ? clienteActualizado : cliente,
      );
      return clienteActualizado;
    } catch {
      error.value = 'No se pudieron guardar los cambios del cliente.';
      throw new Error(error.value);
    } finally {
      guardando.value = false;
    }
  }

  async function eliminarCliente(idCliente: string): Promise<void> {
    const version = versionDatos;
    guardando.value = true;
    error.value = null;

    try {
      await repositorioClientes.eliminar(idCliente);
      if (version !== versionDatos) throw new Error('La sesión cambió durante el borrado.');
      clientes.value = clientes.value.filter((cliente) => cliente.id !== idCliente);
    } catch {
      error.value = 'No se pudo eliminar el cliente.';
      throw new Error(error.value);
    } finally {
      guardando.value = false;
    }
  }

  function obtenerClientePorId(idCliente: string): Cliente | undefined {
    return clientes.value.find((cliente) => cliente.id === idCliente);
  }

  function limpiarError(): void {
    error.value = null;
  }

  function buscarClientes(termino: string): Cliente[] {
    const terminoNormalizado = termino.trim().toLocaleLowerCase('es');

    if (terminoNormalizado === '') {
      return clientesOrdenados.value;
    }

    return clientesOrdenados.value.filter((cliente) => {
      const coincideNombre = cliente.nombre.toLocaleLowerCase('es').includes(terminoNormalizado);
      const coincideLocal = cliente.locales.some((local) =>
        `${local.nombre} ${local.direccion}`.toLocaleLowerCase('es').includes(terminoNormalizado),
      );
      const coincideTelefono = cliente.telefonos.some((telefono) =>
        telefono.numero.toLocaleLowerCase('es').includes(terminoNormalizado),
      );
      const coincideTelefonoLocal = cliente.locales.some((local) =>
        local.telefonos.some((telefono) =>
          telefono.numero.toLocaleLowerCase('es').includes(terminoNormalizado),
        ),
      );

      return coincideNombre || coincideLocal || coincideTelefono || coincideTelefonoLocal;
    });
  }

  return {
    clientes,
    clientesOrdenados,
    cargando,
    guardando,
    error,
    cargarClientes,
    agregarCliente,
    editarCliente,
    eliminarCliente,
    obtenerClientePorId,
    limpiarError,
    buscarClientes,
    invalidarDatos,
  };
});
