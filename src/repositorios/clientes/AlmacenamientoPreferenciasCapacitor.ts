import { Preferences } from '@capacitor/preferences';
import type { AlmacenamientoClaveValor } from './AlmacenamientoClaveValor';

export class AlmacenamientoPreferenciasCapacitor implements AlmacenamientoClaveValor {
  async obtener(clave: string): Promise<string | null> {
    const resultado = await Preferences.get({ key: clave });
    return resultado.value;
  }

  async guardar(clave: string, valor: string): Promise<void> {
    await Preferences.set({ key: clave, value: valor });
  }

  async eliminar(clave: string): Promise<void> {
    await Preferences.remove({ key: clave });
  }
}
