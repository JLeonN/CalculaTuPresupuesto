import { obtenerClaveAlmacenamientoAnterior } from '@/configuracion/clavesAlmacenamiento';
import type { AlmacenamientoClaveValor } from '@/repositorios/clientes/AlmacenamientoClaveValor';

export class AlmacenamientoConMigracionClaves implements AlmacenamientoClaveValor {
  constructor(private readonly almacenamientoBase: AlmacenamientoClaveValor) {}

  async obtener(clave: string): Promise<string | null> {
    const claveAnterior = obtenerClaveAlmacenamientoAnterior(clave);
    const valorActual = await this.almacenamientoBase.obtener(clave);

    if (claveAnterior === null) {
      return valorActual;
    }

    if (valorActual !== null) {
      await this.eliminarSinInterrumpir(claveAnterior);
      return valorActual;
    }

    const valorAnterior = await this.almacenamientoBase.obtener(claveAnterior);

    if (valorAnterior === null) {
      return null;
    }

    return this.copiarValorAnterior(clave, claveAnterior, valorAnterior);
  }

  guardar(clave: string, valor: string): Promise<void> {
    return this.almacenamientoBase.guardar(clave, valor);
  }

  async eliminar(clave: string): Promise<void> {
    await this.almacenamientoBase.eliminar(clave);

    const claveAnterior = obtenerClaveAlmacenamientoAnterior(clave);
    if (claveAnterior !== null) {
      await this.almacenamientoBase.eliminar(claveAnterior);
    }
  }

  private async copiarValorAnterior(
    claveActual: string,
    claveAnterior: string,
    valorAnterior: string,
  ): Promise<string> {
    try {
      await this.almacenamientoBase.guardar(claveActual, valorAnterior);
      const valorVerificado = await this.almacenamientoBase.obtener(claveActual);

      if (valorVerificado !== valorAnterior) {
        return valorAnterior;
      }

      await this.eliminarSinInterrumpir(claveAnterior);
      return valorVerificado;
    } catch {
      return valorAnterior;
    }
  }

  private async eliminarSinInterrumpir(clave: string): Promise<void> {
    try {
      await this.almacenamientoBase.eliminar(clave);
    } catch {
      // La copia válida sigue disponible y la limpieza se reintentará en una carga posterior.
    }
  }
}
