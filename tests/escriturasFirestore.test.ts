import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esperarEscrituraFirestore } from '../src/repositorios/almacenamiento/esperarEscrituraFirestore';

test('una escritura pendiente deja continuar y avisa al sincronizarse', async () => {
  const ventanaAnterior = globalThis.window;
  const ventana = new EventTarget();
  Object.assign(globalThis, { window: ventana });
  const estados: string[] = [];
  ventana.addEventListener('firebase-sincronizacion', (evento) => {
    estados.push((evento as CustomEvent<string>).detail);
  });
  let confirmar!: () => void;
  const escritura = new Promise<void>((resolver) => {
    confirmar = resolver;
  });
  try {
    await esperarEscrituraFirestore(escritura);
    assert.deepEqual(estados, ['pendiente']);
    confirmar();
    await new Promise((resolver) => setImmediate(resolver));
    assert.deepEqual(estados, ['pendiente', 'sincronizado']);
  } finally {
    Object.assign(globalThis, { window: ventanaAnterior });
  }
});
