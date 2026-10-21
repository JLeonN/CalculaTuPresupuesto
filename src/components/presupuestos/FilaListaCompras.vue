<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CambiosMaterialListaCompras } from '@/dominio/listaCompras';
import { formatearImporte, formatearNumero } from '@/dominio/monedas';
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
const editando = ref(false);

watch(
  () => [props.linea.nombre, props.linea.cantidad, props.linea.precioUnitario],
  () => {
    restaurarValores();
    editando.value = false;
  },
  { immediate: true },
);

const hayCambios = computed(() => {
  const cantidad = convertirNumero(cantidadEntrada.value);
  const precio = convertirNumero(precioEntrada.value);
  return (
    nombreEntrada.value.trim() !== props.linea.nombre ||
    cantidad !== props.linea.cantidad ||
    (props.precioEditable && precio !== props.linea.precioUnitario)
  );
});

function restaurarValores(): void {
  nombreEntrada.value = props.linea.nombre;
  cantidadEntrada.value = props.linea.cantidad;
  precioEntrada.value = props.linea.precioUnitario;
  errorValidacion.value = null;
}

function abrirEdicion(): void {
  restaurarValores();
  editando.value = true;
}

function cancelarEdicion(): void {
  restaurarValores();
  editando.value = false;
}

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
    <div class="lista-compras__resumen">
      <strong class="lista-compras__nombre">{{ linea.nombre }}</strong>
      <span class="lista-compras__cantidad">
        {{ linea.cantidad === null ? '—' : formatearNumero(linea.cantidad) }} {{ linea.unidad }}
      </span>
      <q-checkbox
        class="lista-compras__checkbox"
        :model-value="linea.comprado"
        :disable="guardando"
        :aria-label="`${linea.nombre}: ${linea.comprado ? 'comprado' : 'pendiente'}`"
        @update:model-value="emitir('cambiarComprado', !linea.comprado)"
      />
    </div>
    <div class="lista-compras__detalle">
      <span class="lista-compras__precio">
        Precio unitario:
        {{
          linea.precioUnitario === null
            ? `Sin precio · ${linea.moneda}`
            : formatearImporte(linea.precioUnitario, linea.moneda)
        }}
      </span>
      <q-btn
        v-if="!editando"
        class="boton-secundario lista-compras__editar"
        flat
        round
        dense
        icon="edit"
        :aria-label="`Editar ${linea.nombre}`"
        :disable="guardando"
        @click="abrirEdicion"
      />
    </div>
    <div v-if="editando" class="lista-compras__edicion">
      <q-input v-model="nombreEntrada" dark outlined dense label="Material" :disable="guardando" />
      <div class="lista-compras__campos">
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
          :suffix="linea.unidad"
          :disable="guardando"
        />
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
          :suffix="linea.moneda"
          :disable="guardando"
        />
      </div>
      <div class="lista-compras__acciones-edicion">
        <q-btn
          class="boton-secundario"
          flat
          no-caps
          label="Cancelar"
          :disable="guardando"
          @click="cancelarEdicion"
        />
        <q-btn
          v-if="hayCambios"
          class="boton-secundario lista-compras__guardar"
          flat
          no-caps
          icon="save"
          label="Guardar cambios"
          :disable="guardando"
          :loading="guardando"
          @click="guardarDetalles"
        />
      </div>
    </div>
    <p v-if="errorValidacion || error" class="lista-compras__error" role="alert">
      {{ errorValidacion || error }}
    </p>
  </article>
</template>
