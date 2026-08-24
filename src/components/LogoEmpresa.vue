<script setup lang="ts">
withDefaults(
  defineProps<{
    origen: string;
    textoAlternativo: string;
    tamano?: 'pequeno' | 'mediano' | 'grande';
  }>(),
  {
    tamano: 'mediano',
  },
);
</script>

<template>
  <span class="logo-empresa" :class="`logo-empresa--${tamano}`">
    <img class="logo-empresa__imagen" :src="origen" :alt="textoAlternativo" />
  </span>
</template>
