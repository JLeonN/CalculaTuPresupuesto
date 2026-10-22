<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import type { Material } from '@/dominio/materiales';

const props = defineProps<{
  materiales: Material[];
  cargando: boolean;
}>();

const emitir = defineEmits<{
  agregarMaterial: [material: Material];
  agregarManual: [nombre: string];
}>();

const textoBusqueda = ref('');
const seleccion = ref<Material | string | null>(null);
const campoMaterial = ref<{ focus: () => void } | null>(null);

const opcionesMateriales = computed(() => {
  const termino = textoBusqueda.value.trim().toLocaleLowerCase('es');
  if (termino === '') {
    return props.materiales;
  }

  return props.materiales.filter((material) =>
    material.nombre.toLocaleLowerCase('es').includes(termino),
  );
});

function etiquetaMaterial(opcion: Material | string): string {
  return typeof opcion === 'string' ? opcion : opcion.nombre;
}

function agregarSeleccion(): void {
  if (seleccion.value && typeof seleccion.value !== 'string') {
    emitir('agregarMaterial', seleccion.value);
    limpiar();
    return;
  }

  const nombre = (
    typeof seleccion.value === 'string' ? seleccion.value : textoBusqueda.value
  ).trim();
  if (nombre === '') {
    return;
  }

  emitir('agregarManual', nombre);
  limpiar();
}

function agregarMaterialSeleccionado(valor: Material | string | null): void {
  if (valor === null || typeof valor === 'string') {
    return;
  }

  emitir('agregarMaterial', valor);
  limpiar();
}

function crearValorManual(valor: string, finalizar: (valor?: string) => void): void {
  const nombre = valor.trim();
  if (nombre === '') {
    finalizar();
    return;
  }

  emitir('agregarManual', nombre);
  finalizar();
  limpiar();
}

function limpiar(): void {
  seleccion.value = null;
  textoBusqueda.value = '';
  void nextTick(() => campoMaterial.value?.focus());
}
</script>

<template>
  <section class="seccion-formulario agregador-material" aria-labelledby="titulo-agregar-material">
    <div class="encabezado-seccion-formulario">
      <div>
        <p class="etiqueta-seccion">Conceptos</p>
        <h2 id="titulo-agregar-material" class="titulo-seccion">Agregar material</h2>
        <p class="texto-secundario texto-ayuda-formulario">
          Elegí uno guardado o escribí un nombre nuevo para usarlo solamente en este presupuesto.
        </p>
      </div>
    </div>

    <div class="agregador-material__controles">
      <q-select
        ref="campoMaterial"
        v-model="seleccion"
        dark
        outlined
        behavior="menu"
        menu-anchor="bottom left"
        menu-self="top left"
        popup-content-class="selector-opciones"
        clearable
        fill-input
        hide-selected
        use-input
        input-debounce="0"
        label="Buscar o escribir material"
        :loading="cargando"
        :options="opcionesMateriales"
        :option-label="etiquetaMaterial"
        @input-value="textoBusqueda = $event"
        @new-value="crearValorManual"
        @update:model-value="agregarMaterialSeleccionado"
      >
        <template #no-option>
          <q-item>
            <q-item-section>
              <q-item-label>Agregar “{{ textoBusqueda.trim() }}”</q-item-label>
              <q-item-label caption>Se usará solamente en este presupuesto.</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-btn
        class="boton-accion-principal"
        unelevated
        no-caps
        icon="add"
        label="Agregar"
        @click="agregarSeleccion"
      />
    </div>
  </section>
</template>
