<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { UNIDADES_MEDIDA } from '@/dominio/materiales';
import { formatearImporte, type Moneda } from '@/dominio/monedas';
import type { TarifaManoObraConfiguracion } from '@/dominio/configuracion';
import {
  calcularSubtotalLinea,
  lineaTieneMonedaCompatible,
  type LineaPresupuesto,
} from '@/dominio/presupuestos';

const props = defineProps<{
  monedaPresupuesto: Moneda;
  tarifasManoObra?: TarifaManoObraConfiguracion[];
  soloLectura?: boolean;
}>();

const linea = defineModel<LineaPresupuesto>({ required: true });

const emitir = defineEmits<{
  eliminar: [];
  confirmarConversion: [];
}>();

const esMaterial = computed(() => linea.value.tipo === 'material');
const esManoObra = computed(() => linea.value.tipo === 'manoObra');
const textoBusquedaManoObra = ref('');
const seleccionManoObra = ref<TarifaManoObraConfiguracion | string | null>(null);
const monedaCompatible = computed(() =>
  lineaTieneMonedaCompatible(linea.value, props.monedaPresupuesto),
);
const subtotal = computed(() => calcularSubtotalLinea(linea.value));
const etiquetaCantidad = computed(() => {
  if (linea.value.tipo === 'traslado') {
    return 'Kilómetros';
  }

  return linea.value.tipo === 'manoObra' ? 'Horas' : 'Cantidad';
});
const etiquetaPrecio = computed(() => {
  if (linea.value.tipo === 'traslado') {
    return 'Precio por km';
  }

  return linea.value.tipo === 'manoObra' ? 'Precio por hora' : 'Precio unitario';
});
const opcionesManoObra = computed(() => {
  const termino = textoBusquedaManoObra.value.trim().toLocaleLowerCase('es');
  return termino === ''
    ? (props.tarifasManoObra ?? [])
    : (props.tarifasManoObra ?? []).filter((tarifa) =>
        tarifa.nombre.toLocaleLowerCase('es').includes(termino),
      );
});
const opcionesUnidad = computed(() => {
  if (linea.value.origen === 'catalogo') {
    return linea.value.opcionesUnidad.map((opcion) => opcion.unidad);
  }

  return [...UNIDADES_MEDIDA];
});
const mostrarSelectorUnidad = computed(
  () =>
    esMaterial.value &&
    (linea.value.origen !== 'catalogo' || linea.value.opcionesUnidad.length > 1),
);

watch(
  [() => linea.value.nombre, () => props.tarifasManoObra],
  () => {
    if (!esManoObra.value) {
      return;
    }

    seleccionManoObra.value =
      props.tarifasManoObra?.find((tarifa) => tarifa.nombre === linea.value.nombre) ??
      linea.value.nombre;
  },
  { immediate: true, deep: true },
);

function actualizarPrecioPorUnidad(unidad: string): void {
  const opcion = linea.value.opcionesUnidad.find((actual) => actual.unidad === unidad);
  if (opcion !== undefined) {
    linea.value.precioUnitario = opcion.precioUnitario;
  }
}

function etiquetaManoObra(opcion: TarifaManoObraConfiguracion | string): string {
  return typeof opcion === 'string' ? opcion : opcion.nombre;
}

function seleccionarManoObra(opcion: TarifaManoObraConfiguracion | string | null): void {
  if (opcion === null) {
    aplicarManoObraManual('');
    return;
  }

  if (typeof opcion === 'string') {
    aplicarManoObraManual(opcion);
    return;
  }

  linea.value.nombre = opcion.nombre;
  linea.value.origen = 'predefinido';
  linea.value.precioUnitario = opcion.precioHora ?? 0;
  textoBusquedaManoObra.value = '';
}

function crearManoObraManual(nombre: string, finalizar: (valor?: string) => void): void {
  const nombreNormalizado = nombre.trim();
  if (nombreNormalizado === '') {
    finalizar();
    return;
  }

  finalizar(nombreNormalizado);
  aplicarManoObraManual(nombreNormalizado);
}

function aplicarManoObraManual(nombre: string): void {
  linea.value.nombre = nombre.trim();
  linea.value.origen = 'manual';
  linea.value.precioUnitario = 0;
  textoBusquedaManoObra.value = '';
}

function mostrarTodasLasManosObra(): void {
  textoBusquedaManoObra.value = '';
}

function seleccionarContenidoNumerico(evento: Event): void {
  if (evento.target instanceof HTMLInputElement) {
    evento.target.select();
  }
}
</script>

<template>
  <article
    class="fila-presupuesto"
    :class="{ 'fila-presupuesto--moneda-incompatible': !monedaCompatible }"
  >
    <div
      class="fila-presupuesto__principal"
      :class="{ 'fila-presupuesto__principal--importe-unico': !esMaterial }"
    >
      <q-select
        v-if="esManoObra && !soloLectura"
        v-model="seleccionManoObra"
        dark
        outlined
        dense
        clearable
        use-input
        input-debounce="0"
        label="Mano de obra"
        :options="opcionesManoObra"
        :option-label="etiquetaManoObra"
        @input-value="textoBusquedaManoObra = $event"
        @new-value="crearManoObraManual"
        @popup-show="mostrarTodasLasManosObra"
        @update:model-value="seleccionarManoObra"
      >
        <template #no-option>
          <q-item>
            <q-item-section>
              <q-item-label>Usar “{{ textoBusquedaManoObra.trim() }}”</q-item-label>
              <q-item-label caption>Se aplicará solamente a este presupuesto.</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-input
        v-else
        v-model="linea.nombre"
        dark
        outlined
        dense
        label="Concepto"
        :readonly="soloLectura"
      />

      <q-input
        v-model.number="linea.cantidad"
        dark
        outlined
        dense
        type="number"
        min="0"
        step="0.01"
        :label="etiquetaCantidad"
        :readonly="soloLectura"
        @focus="seleccionarContenidoNumerico"
      />

      <template v-if="esMaterial">
        <q-select
          v-if="mostrarSelectorUnidad && linea.origen === 'catalogo'"
          v-model="linea.unidad"
          dark
          outlined
          dense
          label="Unidad"
          :options="opcionesUnidad"
          :readonly="soloLectura"
          @update:model-value="actualizarPrecioPorUnidad"
        />
        <q-select
          v-else-if="mostrarSelectorUnidad"
          v-model="linea.unidad"
          dark
          outlined
          dense
          use-input
          new-value-mode="add-unique"
          label="Unidad"
          :options="opcionesUnidad"
          :readonly="soloLectura"
        />
        <div v-else class="fila-presupuesto__unidad-fija">
          <strong>{{ linea.unidad }}</strong>
        </div>
      </template>

      <q-input
        v-model.number="linea.precioUnitario"
        dark
        outlined
        dense
        type="number"
        min="0"
        step="0.01"
        :label="etiquetaPrecio"
        :readonly="soloLectura"
        @focus="seleccionarContenidoNumerico"
      />

      <div class="fila-presupuesto__subtotal">
        <span>Subtotal</span>
        <strong>{{ formatearImporte(subtotal, linea.moneda) }}</strong>
      </div>

      <q-btn
        v-if="!soloLectura"
        class="boton-icono-secundario fila-presupuesto__eliminar"
        flat
        round
        dense
        icon="delete_outline"
        :aria-label="`Eliminar ${linea.nombre}`"
        @click="emitir('eliminar')"
      />
    </div>

    <div v-if="!monedaCompatible" class="fila-presupuesto__aviso-moneda" role="alert">
      <p class="fila-presupuesto__aviso">
        <template v-if="soloLectura">
          Esta línea está en {{ linea.moneda }} y no se incluye en el total {{ monedaPresupuesto }}.
        </template>
        <template v-else>
          Convertí manualmente el importe de {{ linea.moneda }} a {{ monedaPresupuesto }} y confirmá
          la conversión.
        </template>
      </p>
      <q-btn
        v-if="!soloLectura"
        class="boton-secundario fila-presupuesto__confirmar-moneda"
        flat
        no-caps
        :label="`Confirmar conversión a ${monedaPresupuesto}`"
        @click="emitir('confirmarConversion')"
      />
    </div>
  </article>
</template>
