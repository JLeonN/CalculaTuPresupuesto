import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearCliente } from '../src/dominio/clientes';
import { crearMaterial } from '../src/dominio/materiales';
import { crearPresupuesto } from '../src/dominio/presupuestos';
import { crearConfiguracionInicial } from '../src/dominio/configuracion';
import { crearRespaldo } from '../src/dominio/respaldo';
import type { AlmacenamientoClaveValor } from '../src/repositorios/clientes/AlmacenamientoClaveValor';
import { RepositorioClientesLocal } from '../src/repositorios/clientes/RepositorioClientesLocal';
import { RepositorioMaterialesLocal } from '../src/repositorios/materiales/RepositorioMaterialesLocal';
import { RepositorioPresupuestosLocal } from '../src/repositorios/presupuestos/RepositorioPresupuestosLocal';
import { RepositorioConfiguracionLocal } from '../src/repositorios/configuracion/RepositorioConfiguracionLocal';
import { ServicioRespaldo } from '../src/servicios/respaldo/ServicioRespaldo';

function crearAlmacenamientoMemoria(): AlmacenamientoClaveValor {
  const valores = new Map<string, string>();
  return {
    obtener: async (clave) => valores.get(clave) ?? null,
    guardar: async (clave, valor) => {
      valores.set(clave, valor);
    },
    eliminar: async (clave) => {
      valores.delete(clave);
    },
  };
}

function crearServicio(almacenamiento: AlmacenamientoClaveValor): ServicioRespaldo {
  return new ServicioRespaldo(
    new RepositorioClientesLocal(almacenamiento),
    new RepositorioMaterialesLocal(almacenamiento),
    new RepositorioPresupuestosLocal(almacenamiento),
    new RepositorioConfiguracionLocal(almacenamiento),
  );
}

test('importar dos veces agrega faltantes una sola vez y conserva registros existentes', async () => {
  const origen = crearAlmacenamientoMemoria();
  const destino = crearAlmacenamientoMemoria();
  const servicioOrigen = crearServicio(origen);
  const servicioDestino = crearServicio(destino);
  const repositorioClientesOrigen = new RepositorioClientesLocal(origen);
  const repositorioClientesDestino = new RepositorioClientesLocal(destino);
  const clienteExistente = crearCliente({
    nombre: 'Cliente original',
    telefonos: [],
    locales: [],
    correo: '',
    notas: '',
  });
  const clienteNuevo = crearCliente({
    nombre: 'Cliente nuevo',
    telefonos: [],
    locales: [],
    correo: '',
    notas: '',
  });
  await repositorioClientesOrigen.guardar(clienteExistente);
  await repositorioClientesOrigen.guardar(clienteNuevo);
  await repositorioClientesDestino.guardar({ ...clienteExistente, nombre: 'Nombre conservado' });
  await new RepositorioMaterialesLocal(origen).guardar(
    crearMaterial({ nombre: 'Material sintético', precios: [], idPrecioPredeterminado: '' }),
  );
  await new RepositorioPresupuestosLocal(origen).guardar(
    crearPresupuesto({
      destinatario: {
        tipo: 'potencial',
        idCliente: null,
        nombre: 'Destinatario sintético',
        telefono: '',
      },
      fechaPresupuesto: '2026-10-30',
      moneda: 'UYU',
      porcentajeAdicionalMateriales: 0,
      formatoDocumento: 'completo',
      lineas: [],
      configuracionDocumento: null,
    }),
  );
  await new RepositorioConfiguracionLocal(origen).guardar(crearConfiguracionInicial());

  const respaldo = await servicioOrigen.generarRespaldo(true);
  const primeraVista = await servicioDestino.previsualizarImportacion(
    JSON.stringify(respaldo),
    true,
  );
  assert.equal(primeraVista.resumen.clientes.nuevos, 1);
  assert.equal(primeraVista.resumen.clientes.existentesDistintos, 1);
  const primerResultado = await servicioDestino.importarFaltantes(
    primeraVista.respaldo,
    primeraVista.resumen,
    true,
  );
  assert.equal(primerResultado.clientes.nuevos, 1);
  assert.equal(primerResultado.materiales.nuevos, 1);
  assert.equal(primerResultado.presupuestos.nuevos, 1);
  assert.equal(primerResultado.configuracion, 'seAgrega');

  const segundaVista = await servicioDestino.previsualizarImportacion(
    JSON.stringify(respaldo),
    true,
  );
  assert.equal(segundaVista.resumen.clientes.nuevos, 0);
  assert.equal(segundaVista.resumen.materiales.nuevos, 0);
  assert.equal(segundaVista.resumen.presupuestos.nuevos, 0);
  const segundoResultado = await servicioDestino.importarFaltantes(
    segundaVista.respaldo,
    segundaVista.resumen,
    true,
  );
  assert.equal(segundoResultado.clientes.nuevos, 0);
  assert.equal(segundoResultado.materiales.nuevos, 0);
  assert.equal(segundoResultado.presupuestos.nuevos, 0);
  assert.equal(
    (await repositorioClientesDestino.obtenerTodos()).find(
      (cliente) => cliente.id === clienteExistente.id,
    )?.nombre,
    'Nombre conservado',
  );
  assert.equal((await repositorioClientesOrigen.obtenerTodos()).length, 2);
});
