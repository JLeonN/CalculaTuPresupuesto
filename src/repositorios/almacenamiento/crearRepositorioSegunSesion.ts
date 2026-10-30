import { estaFirebaseConfigurado, obtenerFirebase } from '@/configuracion/firebase';

export function crearRepositorioSegunSesion<T>(
  crearLocal: () => T,
  crearRemoto: (uid: string) => T,
): T {
  const local = crearLocal();
  return new Proxy(local as object, {
    get(_destino, propiedad) {
      const uid = estaFirebaseConfigurado()
        ? obtenerFirebase().autenticacion.currentUser?.uid
        : null;
      const repositorio = uid ? crearRemoto(uid) : local;
      const valor = Reflect.get(repositorio as object, propiedad);
      return typeof valor === 'function' ? valor.bind(repositorio) : valor;
    },
  }) as T;
}
