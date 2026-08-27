<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore } from '@/stores/autenticacion';

const $q = useQuasar();
const autenticacionStore = useAutenticacionStore();
const iconoSesion = computed(() => (autenticacionStore.estaAutenticado ? 'lock_open' : 'lock'));
const etiquetaSesion = computed(() =>
  autenticacionStore.estaAutenticado
    ? `Sesión iniciada como ${autenticacionStore.usuario?.nombre ?? 'usuario'}`
    : 'Iniciar sesión',
);

function solicitarAcceso(): void {
  if (!autenticacionStore.estaAutenticado) {
    autenticacionStore.solicitarInicioSesion();
  }
}

async function cerrarSesion(): Promise<void> {
  const cierreCorrecto = await autenticacionStore.cerrarSesion();

  $q.notify({
    message: cierreCorrecto
      ? 'Sesión cerrada correctamente.'
      : (autenticacionStore.error ?? 'No se pudo cerrar la sesión.'),
    position: 'top',
    classes: cierreCorrecto ? 'notificacion-exito' : 'notificacion-error',
  });
}
</script>

<template>
  <q-btn
    class="boton-sesion"
    flat
    round
    :icon="iconoSesion"
    :aria-label="etiquetaSesion"
    :loading="autenticacionStore.cargando"
    @click="solicitarAcceso"
  >
    <q-menu
      v-if="autenticacionStore.estaAutenticado"
      class="menu-sesion"
      anchor="bottom right"
      self="top right"
    >
      <div class="menu-sesion__usuario">
        <q-icon name="verified_user" aria-hidden="true" />
        <div>
          <small>Sesión activa</small>
          <strong>{{ autenticacionStore.usuario?.nombre }}</strong>
        </div>
      </div>
      <q-separator dark />
      <q-item v-close-popup clickable :disable="autenticacionStore.cargando" @click="cerrarSesion">
        <q-item-section avatar><q-icon name="logout" /></q-item-section>
        <q-item-section>Cerrar sesión</q-item-section>
      </q-item>
    </q-menu>
  </q-btn>
</template>
