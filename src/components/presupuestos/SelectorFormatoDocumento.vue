<script setup lang="ts">
import type { FormatoDocumentoPresupuesto } from '@/dominio/presupuestos';

const props = defineProps<{
  formato: FormatoDocumentoPresupuesto;
  deshabilitado?: boolean;
}>();

const emitir = defineEmits<{
  cambiar: [formato: FormatoDocumentoPresupuesto];
}>();

function cambiarFormato(): void {
  emitir('cambiar', props.formato === 'completo' ? 'resumido' : 'completo');
}
</script>

<template>
  <div class="selector-formato-documento-contenedor">
    <button
      type="button"
      class="selector-formato-documento"
      :class="{ 'selector-formato-documento--resumido': formato === 'resumido' }"
      role="switch"
      :aria-checked="formato === 'resumido'"
      :aria-label="`Vista resumida: ${formato === 'resumido' ? 'activada' : 'desactivada'}`"
      :disabled="deshabilitado"
      @click="cambiarFormato"
    >
      <span class="selector-formato-documento__texto">{{
        formato === 'resumido' ? 'Resumida' : 'Completa'
      }}</span>
      <span class="selector-formato-documento__perilla" aria-hidden="true" />
    </button>
  </div>
</template>
