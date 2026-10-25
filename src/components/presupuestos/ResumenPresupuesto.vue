<script setup lang="ts">
import { computed } from 'vue';
import SelectorMoneda from '@/components/monedas/SelectorMoneda.vue';
import { convertirEntradaPorcentajeAdicionalMateriales } from '@/dominio/porcentajeAdicionalMateriales';
import { crearOpcionesMonedaOperacion, formatearImporte, type Moneda } from '@/dominio/monedas';
import {
  calcularTotalMateriales,
  calcularTotalPresupuesto,
  calcularTotalManoObraYTraslado,
  lineaTieneMonedaCompatible,
  lineaTienePrecioPendiente,
  type LineaPresupuesto,
} from '@/dominio/presupuestos';

const FACTOR_REDONDEO_IMPORTES = 100;

function convertirACentavos(importe: number): number {
  return Math.round((importe + Number.EPSILON) * FACTOR_REDONDEO_IMPORTES);
}

const props = defineProps<{
  lineas: LineaPresupuesto[];
  monedaPrincipal: Moneda;
  soloLectura?: boolean;
}>();

const moneda = defineModel<Moneda>('moneda', { required: true });
const porcentajeAdicionalMaterialesEntrada = defineModel<string | number | null>(
  'porcentajeAdicionalMaterialesEntrada',
  { required: true },
);
const porcentajeAdicionalMateriales = computed(
  () =>
    convertirEntradaPorcentajeAdicionalMateriales(porcentajeAdicionalMaterialesEntrada.value) ?? 0,
);
const caracteresPorcentaje = computed(() =>
  Math.max(String(porcentajeAdicionalMaterialesEntrada.value ?? '').length, 1),
);

function validarPorcentajeAdicionalMaterialesEntrada(valor: unknown): true | string {
  return (
    convertirEntradaPorcentajeAdicionalMateriales(valor) !== null || 'Ingresá un porcentaje válido.'
  );
}

function seleccionarContenidoPorcentaje(evento: Event): void {
  if (evento.target instanceof HTMLInputElement) {
    evento.target.select();
  }
}

const totalManoObraYTraslado = computed(() =>
  calcularTotalManoObraYTraslado(props.lineas, moneda.value),
);
const totalMateriales = computed(() =>
  calcularTotalMateriales(props.lineas, moneda.value, porcentajeAdicionalMateriales.value),
);
const totalMaterialesSinAdicional = computed(
  () =>
    convertirACentavos(calcularTotalMateriales(props.lineas, moneda.value, 0)) /
    FACTOR_REDONDEO_IMPORTES,
);
const importeAdicionalMateriales = computed(
  () =>
    (convertirACentavos(totalMateriales.value) -
      convertirACentavos(totalMaterialesSinAdicional.value)) /
    FACTOR_REDONDEO_IMPORTES,
);
const total = computed(() =>
  calcularTotalPresupuesto(props.lineas, moneda.value, porcentajeAdicionalMateriales.value),
);
const cantidadIncompatibles = computed(
  () => props.lineas.filter((linea) => !lineaTieneMonedaCompatible(linea, moneda.value)).length,
);
const cantidadPendientes = computed(
  () => props.lineas.filter((linea) => lineaTienePrecioPendiente(linea)).length,
);
const opcionesMonedaPresupuesto = computed(() =>
  crearOpcionesMonedaOperacion(props.monedaPrincipal, moneda.value),
);
</script>

<template>
  <footer class="resumen-presupuesto" aria-live="polite">
    <div v-if="soloLectura" class="resumen-presupuesto__datos-lectura">
      <div>
        <span>Adicional sobre materiales</span>
        <strong>{{ porcentajeAdicionalMateriales }} %</strong>
      </div>
      <div>
        <span>Moneda del presupuesto</span>
        <strong>{{ moneda }}</strong>
      </div>
      <div class="resumen-presupuesto__estado">
        <span>{{ lineas.length }} conceptos</span>
        <span v-if="cantidadPendientes">{{ cantidadPendientes }} con precio pendiente</span>
        <span v-if="cantidadIncompatibles" class="resumen-presupuesto__error">
          {{ cantidadIncompatibles }} sin sumar por moneda
        </span>
      </div>
    </div>
    <div v-else class="resumen-presupuesto__grupo-controles">
      <div class="resumen-presupuesto__campo-porcentaje">
        <q-input
          v-model="porcentajeAdicionalMaterialesEntrada"
          class="campo-porcentaje"
          :style="{ '--caracteres-porcentaje': caracteresPorcentaje }"
          dark
          outlined
          dense
          type="text"
          inputmode="decimal"
          suffix="%"
          label="Porcentaje adicional"
          hint="Se aplica solo a los materiales de este presupuesto."
          :rules="[validarPorcentajeAdicionalMaterialesEntrada]"
          :readonly="soloLectura"
          @focus="seleccionarContenidoPorcentaje"
          @click="seleccionarContenidoPorcentaje"
        />
      </div>
      <div class="resumen-presupuesto__controles">
        <SelectorMoneda
          v-model="moneda"
          class="selector-moneda-presupuesto"
          :opciones="opcionesMonedaPresupuesto"
          etiqueta="Moneda del presupuesto"
          :deshabilitado="soloLectura"
          denso
        />

        <div class="resumen-presupuesto__estado">
          <span>{{ lineas.length }} conceptos</span>
          <span v-if="cantidadPendientes">{{ cantidadPendientes }} con precio pendiente</span>
          <span v-if="cantidadIncompatibles" class="resumen-presupuesto__error">
            {{ cantidadIncompatibles }} sin sumar por moneda
          </span>
        </div>
      </div>
    </div>
    <div class="resumen-presupuesto__importes">
      <div class="resumen-presupuesto__importe">
        <span>Mano de obra</span>
        <strong>{{ formatearImporte(totalManoObraYTraslado, moneda) }}</strong>
      </div>
      <div class="resumen-presupuesto__importe">
        <span>Materiales</span>
        <strong>{{ formatearImporte(totalMateriales, moneda) }}</strong>
      </div>
      <Transition name="desglose-materiales">
        <div v-if="porcentajeAdicionalMateriales > 0" class="resumen-presupuesto__desglose">
          <div class="resumen-presupuesto__desglose-contenido">
            <div class="resumen-presupuesto__importe resumen-presupuesto__importe--desglose">
              <span>Materiales sin adicional</span>
              <strong>{{ formatearImporte(totalMaterialesSinAdicional, moneda) }}</strong>
            </div>
            <div class="resumen-presupuesto__importe resumen-presupuesto__importe--desglose">
              <span>Adicional ({{ porcentajeAdicionalMateriales }} %)</span>
              <strong>{{ formatearImporte(importeAdicionalMateriales, moneda) }}</strong>
            </div>
          </div>
        </div>
      </Transition>
      <div class="resumen-presupuesto__importe resumen-presupuesto__importe--total">
        <span>Total</span>
        <strong>{{ formatearImporte(total, moneda) }}</strong>
      </div>
    </div>
  </footer>
</template>
