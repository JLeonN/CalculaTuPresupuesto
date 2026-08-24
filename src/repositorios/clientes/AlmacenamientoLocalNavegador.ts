import type { AlmacenamientoClaveValor } from './AlmacenamientoClaveValor';

export class AlmacenamientoLocalNavegador implements AlmacenamientoClaveValor {
  obtener(clave: string): Promise<string | null> {
    return Promise.resolve(window.localStorage.getItem(clave));
  }

  guardar(clave: string, valor: string): Promise<void> {
    window.localStorage.setItem(clave, valor);
    return Promise.resolve();
  }

  eliminar(clave: string): Promise<void> {
    window.localStorage.removeItem(clave);
    return Promise.resolve();
  }
}
