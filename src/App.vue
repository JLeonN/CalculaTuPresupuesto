<script setup lang="ts">
import ModalInicioSesion from '@/components/autenticacion/ModalInicioSesion.vue';
import ModalActualizacion from '@/components/ModalActualizacion.vue';
</script>

<template>
  <router-view />
  <ModalInicioSesion />
  <ModalActualizacion />
</template>
