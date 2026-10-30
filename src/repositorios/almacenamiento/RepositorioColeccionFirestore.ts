import { collection, deleteDoc, doc, getDocs, runTransaction, setDoc } from 'firebase/firestore';
import { obtenerFirebase } from '@/configuracion/firebase';
import { esperarEscrituraFirestore } from './esperarEscrituraFirestore';

type ColeccionUsuario = 'clientes' | 'materiales' | 'presupuestos';

export class RepositorioColeccionFirestore<T extends { id: string }> {
  constructor(
    private readonly uid: string,
    private readonly coleccion: ColeccionUsuario,
    private readonly validar: (dato: unknown) => dato is T,
  ) {}

  async obtenerTodos(): Promise<T[]> {
    this.exigirCuentaActual();
    const { baseDatos } = obtenerFirebase();
    const resultado = await getDocs(collection(baseDatos, 'usuarios', this.uid, this.coleccion));
    this.exigirCuentaActual();
    return resultado.docs.map((documento) => {
      const dato: unknown = documento.data();
      if (!this.validar(dato) || dato.id !== documento.id) {
        throw new Error(`Hay un registro de ${this.coleccion} inválido en la nube.`);
      }
      return dato;
    });
  }

  async guardar(dato: T): Promise<void> {
    this.exigirCuentaActual();
    if (!this.validar(dato)) throw new Error(`El registro de ${this.coleccion} es inválido.`);
    const { baseDatos } = obtenerFirebase();
    await esperarEscrituraFirestore(
      setDoc(
        doc(baseDatos, 'usuarios', this.uid, this.coleccion, dato.id),
        prepararDocumento(dato),
      ),
    );
  }

  async eliminar(id: string): Promise<void> {
    this.exigirCuentaActual();
    const { baseDatos } = obtenerFirebase();
    await esperarEscrituraFirestore(
      deleteDoc(doc(baseDatos, 'usuarios', this.uid, this.coleccion, id)),
    );
  }

  async agregarFaltantes(datos: readonly T[]): Promise<number> {
    if (!navigator.onLine) throw new Error('Conectate a Internet para importar una copia.');
    const { baseDatos } = obtenerFirebase();
    let agregados = 0;
    for (const dato of datos) {
      this.exigirCuentaActual();
      if (!this.validar(dato)) throw new Error(`El registro de ${this.coleccion} es inválido.`);
      const referencia = doc(baseDatos, 'usuarios', this.uid, this.coleccion, dato.id);
      const agregado = await runTransaction(baseDatos, async (transaccion) => {
        if ((await transaccion.get(referencia)).exists()) return false;
        transaccion.set(referencia, prepararDocumento(dato));
        return true;
      });
      if (agregado) agregados += 1;
    }
    return agregados;
  }

  private exigirCuentaActual(): void {
    if (obtenerFirebase().autenticacion.currentUser?.uid !== this.uid) {
      throw new Error('La sesión cambió durante la operación. Volvé a empezar.');
    }
  }
}

export function prepararDocumento<T>(dato: T): T {
  const texto = JSON.stringify(dato);
  if (new TextEncoder().encode(texto).length > 900_000) {
    throw new RangeError(
      'Este registro supera el tamaño permitido para sincronizarlo. Reducí el logo o el contenido.',
    );
  }
  return JSON.parse(texto) as T;
}
