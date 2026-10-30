import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import { obtenerFirebase } from '@/configuracion/firebase';
import {
  crearConfiguracionInicial,
  esConfiguracionGuardada,
  type Configuracion,
} from '@/dominio/configuracion';
import { prepararDocumento } from '@/repositorios/almacenamiento/RepositorioColeccionFirestore';
import { esperarEscrituraFirestore } from '@/repositorios/almacenamiento/esperarEscrituraFirestore';
import type { RepositorioConfiguracion } from './RepositorioConfiguracion';

export class RepositorioConfiguracionFirestore implements RepositorioConfiguracion {
  constructor(private readonly uid: string) {}

  private referencia() {
    if (obtenerFirebase().autenticacion.currentUser?.uid !== this.uid) {
      throw new Error('La sesión cambió durante la operación. Volvé a empezar.');
    }
    return doc(obtenerFirebase().baseDatos, 'usuarios', this.uid, 'configuracion', 'principal');
  }

  async obtener(): Promise<Configuracion> {
    return (await this.obtenerGuardada()) ?? crearConfiguracionInicial();
  }

  async obtenerGuardada(): Promise<Configuracion | null> {
    const resultado = await getDoc(this.referencia());
    this.referencia();
    if (!resultado.exists()) return null;
    const datos: unknown = resultado.data();
    if (!esConfiguracionGuardada(datos))
      throw new Error('La configuración de la nube es inválida.');
    return datos;
  }

  async guardar(configuracion: Configuracion): Promise<void> {
    if (!esConfiguracionGuardada(configuracion)) throw new Error('La configuración es inválida.');
    await esperarEscrituraFirestore(setDoc(this.referencia(), prepararDocumento(configuracion)));
  }

  async guardarSiAusente(configuracion: Configuracion): Promise<boolean> {
    if (!navigator.onLine) throw new Error('Conectate a Internet para importar una copia.');
    if (!esConfiguracionGuardada(configuracion)) throw new Error('La configuración es inválida.');
    return runTransaction(obtenerFirebase().baseDatos, async (transaccion) => {
      const referencia = this.referencia();
      if ((await transaccion.get(referencia)).exists()) return false;
      transaccion.set(referencia, prepararDocumento(configuracion));
      return true;
    });
  }
}
