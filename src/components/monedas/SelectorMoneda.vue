<script setup lang="ts">
import { ref, watch } from 'vue';
import { buscarOpcionesMoneda, type Moneda, type OpcionMoneda } from '@/dominio/monedas';

const props = withDefaults(
  defineProps<{
    opciones: readonly OpcionMoneda[];
    etiqueta: string;
    buscable?: boolean;
    deshabilitado?: boolean;
    denso?: boolean;
    ayuda?: string;
  }>(),
  {
    buscable: false,
    deshabilitado: false,
    denso: false,
  },
);

const moneda = defineModel<Moneda>({ required: true });
const opcionesFiltradas = ref<OpcionMoneda[]>([...props.opciones]);

watch(
  () => props.opciones,
  (opciones) => {
    opcionesFiltradas.value = [...opciones];
  },
  { deep: true },
);

function filtrarOpciones(termino: string, actualizar: (funcion: () => void) => void): void {
  actualizar(() => {
    opcionesFiltradas.value = buscarOpcionesMoneda(props.opciones, termino);
  });
}

function restaurarOpciones(): void {
  opcionesFiltradas.value = [...props.opciones];
}
</script>

<template>
  <q-select
    v-model="moneda"
    class="selector-moneda"
    :class="{ 'selector-moneda--denso': denso }"
    dark
    outlined
    :dense="denso"
    :label="etiqueta"
    :options="opcionesFiltradas"
    option-label="etiqueta"
    option-value="codigo"
    emit-value
    map-options
    :use-input="buscable"
    :input-debounce="buscable ? 0 : undefined"
    :fill-input="buscable"
    :hide-selected="buscable"
    :disable="deshabilitado"
    :hint="ayuda"
    :aria-label="etiqueta"
    @filter="filtrarOpciones"
    @popup-show="restaurarOpciones"
  >
    <template #no-option>
      <q-item>
        <q-item-section>
          <q-item-label>Sin monedas disponibles</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>
