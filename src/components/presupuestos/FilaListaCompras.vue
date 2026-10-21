<script setup lang="ts">
import { ref, watch } from 'vue';
import type { CambiosMaterialListaCompras } from '@/dominio/listaCompras';
import type { LineaPresupuesto } from '@/dominio/presupuestos';

const props = defineProps<{
  linea: LineaPresupuesto;
  guardando: boolean;
  precioEditable: boolean;
  error: string | null;
}>();
const emitir = defineEmits<{
  cambiarComprado: [comprado: boolean];
  guardarDetalles: [cambios: CambiosMaterialListaCompras];
}>();

const nombreEntrada = ref('');
const cantidadEntrada = ref<string | number | null>(null);
const precioEntrada = ref<string | number | null>(null);
const errorValidacion = ref<string | null>(null);

watch(
  () => props.linea,
  (linea) => {
    nombreEntrada.value = linea.nombre;
    cantidadEntrada.value = linea.cantidad;
    precioEntrada.value = linea.precioUnitario;
    errorValidacion.value = null;
  },
  { immediate: true },
);

function convertirNumero(entrada: string | number | null): number | null | undefined {
  if (entrada === null || entrada === '') return null;
  const numero = typeof entrada === 'number' ? entrada : Number(entrada);
  return Number.isFinite(numero) && numero >= 0 ? numero : undefined;
}

function guardarDetalles(): void {
  const nombre = nombreEntrada.value.trim();
  const cantidad = convertirNumero(cantidadEntrada.value);
  const precio = convertirNumero(precioEntrada.value);
  if (!nombre || cantidad === undefined || (props.precioEditable && precio === undefined)) {
    errorValidacion.value = 'Ingresá un nombre y valores numéricos no negativos.';
    return;
  }
  errorValidacion.value = null;
  const cambios: CambiosMaterialListaCompras = {};
  if (nombre !== props.linea.nombre) cambios.nombre = nombre;
  if (cantidad !== undefined && cantidad !== props.linea.cantidad) cambios.cantidad = cantidad;
  if (props.precioEditable && precio !== undefined && precio !== props.linea.precioUnitario)
    cambios.precioUnitario = precio;
  if (Object.keys(cambios).length > 0) emitir('guardarDetalles', cambios);
}
</script>

<template>
  <article class="lista-compras__fila" :class="{ 'lista-compras__fila--comprado': linea.comprado }">
    <q-checkbox
      class="lista-compras__checkbox"
      :model-value="linea.comprado"
      :disable="guardando"
      :label="`Comprado: ${linea.nombre}`"
      :aria-label="`${linea.nombre}: ${linea.comprado ? 'comprado' : 'pendiente'}`"
      @update:model-value="emitir('cambiarComprado', !linea.comprado)"
    />
    <div class="lista-compras__campos">
      <q-input v-model="nombreEntrada" dark outlined dense label="Material" :disable="guardando" />
      <q-input
        v-model="cantidadEntrada"
        dark
        outlined
        dense
        type="number"
        inputmode="decimal"
        min="0"
        step="any"
        label="Cantidad"
        :disable="guardando"
      />
      <div class="lista-compras__dato">
        <span>Unidad</span><strong>{{ linea.unidad }}</strong>
      </div>
      <q-input
        v-if="precioEditable"
        v-model="precioEntrada"
        dark
        outlined
        dense
        type="number"
        inputmode="decimal"
        min="0"
        step="any"
        label="Precio real unitario"
        :disable="guardando"
      />
      <div v-else class="lista-compras__dato">
        <span>Precio real unitario</span><strong>{{ linea.precioUnitario ?? 'Sin precio' }}</strong>
      </div>
      <div class="lista-compras__dato">
        <span>Moneda</span><strong>{{ linea.moneda }}</strong>
      </div>
    </div>
    <q-btn
      class="boton-secundario lista-compras__guardar"
      flat
      no-caps
      icon="save"
      label="Guardar cambios"
      :disable="guardando"
      :loading="guardando"
      @click="guardarDetalles"
    />
    <p v-if="errorValidacion || error" class="lista-compras__error" role="alert">
      {{ errorValidacion || error }}
    </p>
  </article>
</template>
