<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{ texto: string }>();
const contenedor = ref<HTMLElement | null>(null);
const contenido = ref<HTMLElement | null>(null);
const distancia = ref(0);
let observador: ResizeObserver | null = null;

const estiloMovimiento = computed(() => ({
  '--distancia-texto': `${distancia.value}px`,
  // La duración depende de los píxeles reales que necesita recorrer cada nombre.
  '--duracion-texto': `${Math.max(4, distancia.value / 60 + 1)}s`,
}));

function medirDesborde(): void {
  if (!contenedor.value || !contenido.value) return;
  distancia.value = Math.max(0, contenido.value.scrollWidth - contenedor.value.clientWidth);
}

watch(
  () => props.texto,
  async () => {
    await nextTick();
    medirDesborde();
  },
);

onMounted(() => {
  observador = new ResizeObserver(medirDesborde);
  if (contenedor.value) observador.observe(contenedor.value);
  if (contenido.value) observador.observe(contenido.value);
  medirDesborde();
});

onBeforeUnmount(() => observador?.disconnect());
</script>

<template>
  <span ref="contenedor" class="texto-desplazable" :title="texto">
    <span
      ref="contenido"
      class="texto-desplazable__contenido"
      :class="{ 'texto-desplazable__contenido--activo': distancia > 0 }"
      :style="estiloMovimiento"
      >{{ texto }}</span
    >
  </span>
</template>
