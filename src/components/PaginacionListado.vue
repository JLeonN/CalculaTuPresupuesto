<script setup lang="ts">
defineProps<{
  totalPaginas: number;
}>();

const paginaActual = defineModel<number>({ required: true });
</script>

<template>
  <nav v-if="totalPaginas > 1" class="paginacion-listado" aria-label="Páginas de resultados">
    <q-pagination
      v-model="paginaActual"
      :max="totalPaginas"
      :max-pages="3"
      direction-links
      boundary-numbers
      color="primary"
    />
  </nav>
</template>
