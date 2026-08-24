import { Capacitor } from '@capacitor/core';
import { AlmacenamientoLocalNavegador } from '@/repositorios/clientes/AlmacenamientoLocalNavegador';
import { AlmacenamientoPreferenciasCapacitor } from '@/repositorios/clientes/AlmacenamientoPreferenciasCapacitor';
import type { AlmacenamientoClaveValor } from '@/repositorios/clientes/AlmacenamientoClaveValor';
import { AlmacenamientoConMigracionClaves } from './AlmacenamientoConMigracionClaves';

export function crearAlmacenamientoAplicacion(): AlmacenamientoClaveValor {
  const almacenamientoBase = Capacitor.isNativePlatform()
    ? new AlmacenamientoPreferenciasCapacitor()
    : new AlmacenamientoLocalNavegador();

  return new AlmacenamientoConMigracionClaves(almacenamientoBase);
}
