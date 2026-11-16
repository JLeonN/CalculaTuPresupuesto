import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

let entorno;

before(async () => {
  entorno = await initializeTestEnvironment({
    projectId: 'demo-calcula-pruebas',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(async () => {
  if (entorno) await entorno.cleanup();
});

test('cada cuenta puede leer y modificar solo sus clientes', async () => {
  const propietario = entorno
    .authenticatedContext('cuenta-a', { email_verified: true })
    .firestore();
  const otraCuenta = entorno.authenticatedContext('cuenta-b', { email_verified: true }).firestore();
  const ruta = 'usuarios/cuenta-a/clientes/cliente-1';
  const datos = { id: 'cliente-1', nombre: 'Cliente sintético', telefonos: [], locales: [] };
  await assertSucceeds(setDoc(doc(propietario, ruta), datos));
  const lectura = await assertSucceeds(getDoc(doc(propietario, ruta)));
  assert.equal(lectura.data()?.nombre, datos.nombre);
  await assertFails(getDoc(doc(otraCuenta, ruta)));
  await assertFails(setDoc(doc(otraCuenta, ruta), datos));
  await assertFails(deleteDoc(doc(otraCuenta, ruta)));
});

test('visitante no puede leer ni escribir datos privados', async () => {
  const visitante = entorno.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(visitante, 'usuarios/cuenta-a/clientes/cliente-1')));
  await assertFails(
    setDoc(doc(visitante, 'usuarios/cuenta-a/materiales/material-1'), {
      id: 'material-1',
      nombre: 'Material sintético',
      precios: [],
    }),
  );
});

test('una cuenta con correo sin verificar no puede acceder a Firestore', async () => {
  const cuenta = entorno.authenticatedContext('cuenta-a', { email_verified: false }).firestore();
  await assertFails(getDoc(doc(cuenta, 'usuarios/cuenta-a/clientes/cliente-1')));
  await assertFails(
    setDoc(doc(cuenta, 'usuarios/cuenta-a/clientes/cliente-3'), {
      id: 'cliente-3',
      nombre: 'Cliente sintético',
      telefonos: [],
      locales: [],
    }),
  );
});

test('la ruta y el identificador del documento deben coincidir', async () => {
  const propietario = entorno
    .authenticatedContext('cuenta-a', { email_verified: true })
    .firestore();
  await assertFails(
    setDoc(doc(propietario, 'usuarios/cuenta-a/clientes/cliente-2'), {
      id: 'cliente-de-otra-ruta',
      nombre: 'Cliente sintético',
      telefonos: [],
      locales: [],
    }),
  );
});

test('presupuestos y configuración quedan aislados', async () => {
  const propietario = entorno
    .authenticatedContext('cuenta-a', { email_verified: true })
    .firestore();
  const otraCuenta = entorno.authenticatedContext('cuenta-b', { email_verified: true }).firestore();
  const presupuesto = 'usuarios/cuenta-a/presupuestos/presupuesto-1';
  await assertSucceeds(
    setDoc(doc(propietario, presupuesto), {
      id: 'presupuesto-1',
      fechaCreacion: '2026-10-30',
      fechaPresupuesto: '2026-10-30',
    }),
  );
  await assertFails(getDoc(doc(otraCuenta, presupuesto)));
  const configuracion = 'usuarios/cuenta-a/configuracion/principal';
  await assertSucceeds(
    setDoc(doc(propietario, configuracion), {
      nombreEmpresa: 'Empresa sintética',
      tarifasManoObra: [],
      metodosPago: [],
    }),
  );
  await assertFails(getDoc(doc(otraCuenta, configuracion)));
});

test('las rutas comerciales no definidas permanecen cerradas', async () => {
  const propietario = entorno
    .authenticatedContext('cuenta-a', { email_verified: true })
    .firestore();
  await assertFails(
    setDoc(doc(propietario, 'usuarios/cuenta-a/suscripciones/principal'), {
      estado: 'activa',
    }),
  );
});

test('solo el dueño verificado lee el estado y ningún cliente modifica permisos', async () => {
  const ruta = 'usuarios/cuenta-a/suscripcion/estado';
  await entorno.withSecurityRulesDisabled(async (contexto) => {
    await setDoc(doc(contexto.firestore(), ruta), { tipo: 'prueba', vencimiento: 1000 });
  });
  const dueno = entorno.authenticatedContext('cuenta-a', { email_verified: true }).firestore();
  const otra = entorno.authenticatedContext('cuenta-b', { email_verified: true }).firestore();
  const sinVerificar = entorno.authenticatedContext('cuenta-a', { email_verified: false }).firestore();
  await assertSucceeds(getDoc(doc(dueno, ruta)));
  await assertFails(getDoc(doc(otra, ruta)));
  await assertFails(getDoc(doc(sinVerificar, ruta)));
  await assertFails(setDoc(doc(dueno, ruta), { tipo: 'exento' }));
  await assertFails(deleteDoc(doc(dueno, ruta)));
  await assertFails(getDoc(doc(dueno, 'suscripcionesPrivadas/cuenta-a')));
  await assertFails(setDoc(doc(dueno, 'suscripcionesPrivadas/cuenta-a'), { exento: true }));
  await assertFails(setDoc(doc(dueno, 'titularesCompras/token-sintetico'), { uid: 'cuenta-a' }));
  await assertFails(setDoc(doc(dueno, 'configuracionSuscripcion/activacion'), { fecha: 0 }));
});
