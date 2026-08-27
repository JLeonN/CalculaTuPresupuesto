<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore } from '@/stores/autenticacion';

const $q = useQuasar();
const autenticacionStore = useAutenticacionStore();
const usuarioIngresado = ref('');
const contrasenaIngresada = ref('');
const mostrarContrasena = ref(false);
const tipoCampoContrasena = computed(() => (mostrarContrasena.value ? 'text' : 'password'));

watch(
  () => autenticacionStore.modalInicioSesionVisible,
  (modalVisible) => {
    if (!modalVisible) {
      contrasenaIngresada.value = '';
      mostrarContrasena.value = false;
    }
  },
);

async function enviarFormulario(): Promise<void> {
  const accesoCorrecto = await autenticacionStore.iniciarSesion({
    usuario: usuarioIngresado.value,
    contrasena: contrasenaIngresada.value,
  });

  if (!accesoCorrecto) {
    contrasenaIngresada.value = '';
    return;
  }

  contrasenaIngresada.value = '';
  $q.notify({
    message: 'Sesión iniciada correctamente.',
    position: 'top',
    classes: 'notificacion-exito',
  });
}

function cerrarModal(): void {
  contrasenaIngresada.value = '';
  mostrarContrasena.value = false;
  autenticacionStore.cerrarModalInicioSesion();
}
</script>

<template>
  <q-dialog
    :model-value="autenticacionStore.modalInicioSesionVisible"
    @update:model-value="(visible) => !visible && cerrarModal()"
  >
    <q-card class="modal-inicio-sesion">
      <q-card-section class="modal-inicio-sesion__encabezado">
        <span class="modal-inicio-sesion__icono" aria-hidden="true">
          <q-icon name="key" />
        </span>
        <div>
          <p class="etiqueta-seccion">Acceso privado</p>
          <h2 class="titulo-seccion">Iniciar sesión</h2>
        </div>
      </q-card-section>

      <q-form class="modal-inicio-sesion__formulario" @submit="enviarFormulario">
        <p class="texto-secundario modal-inicio-sesion__descripcion">
          Iniciá sesión para descargar, imprimir y enviar presupuestos.
        </p>

        <q-input
          v-model="usuarioIngresado"
          dark
          outlined
          autofocus
          autocomplete="username"
          label="Usuario"
          :disable="autenticacionStore.cargando"
          :rules="[(valor) => Boolean(String(valor).trim()) || 'Ingresá el usuario.']"
        />

        <q-input
          v-model="contrasenaIngresada"
          dark
          outlined
          autocomplete="current-password"
          label="Contraseña"
          :type="tipoCampoContrasena"
          :disable="autenticacionStore.cargando"
          :rules="[(valor) => Boolean(valor) || 'Ingresá la contraseña.']"
        >
          <template #append>
            <q-btn
              flat
              round
              dense
              :icon="mostrarContrasena ? 'visibility_off' : 'visibility'"
              :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="mostrarContrasena = !mostrarContrasena"
            />
          </template>
        </q-input>

        <q-banner v-if="autenticacionStore.error" class="aviso-error" rounded role="alert">
          <template #avatar><q-icon name="error_outline" /></template>
          {{ autenticacionStore.error }}
        </q-banner>

        <q-card-actions class="modal-inicio-sesion__acciones" align="right">
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            label="Cancelar"
            :disable="autenticacionStore.cargando"
            @click="cerrarModal"
          />
          <q-btn
            class="boton-accion-principal"
            unelevated
            no-caps
            type="submit"
            icon="login"
            label="Entrar"
            :loading="autenticacionStore.cargando"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>
