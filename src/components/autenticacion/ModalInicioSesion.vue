<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore } from '@/stores/autenticacion';

type Modo = 'entrar' | 'registrar' | 'recuperar' | 'verificar';
const $q = useQuasar();
const sesion = useAutenticacionStore();
const modo = ref<Modo>('entrar');
const correo = ref('');
const nombre = ref('');
const contrasena = ref('');
const mostrarContrasena = ref(false);
const aviso = ref('');
const titulo = computed(
  () =>
    ({
      entrar: 'Iniciar sesión',
      registrar: 'Crear cuenta',
      recuperar: 'Recuperar contraseña',
      verificar: 'Verificar correo',
    })[modo.value],
);

watch(
  () => sesion.modalInicioSesionVisible,
  (visible) => {
    if (!visible) {
      contrasena.value = '';
      mostrarContrasena.value = false;
      aviso.value = '';
      modo.value = 'entrar';
    }
  },
);

function cambiarModo(nuevoModo: Modo): void {
  modo.value = nuevoModo;
  contrasena.value = '';
  aviso.value = '';
  sesion.error = null;
}

async function enviarFormulario(): Promise<void> {
  if (sesion.cargando) return;
  aviso.value = '';
  if (modo.value === 'registrar' && sesion.firebaseActivo) {
    if (await sesion.registrarConCorreo(correo.value, contrasena.value, nombre.value)) {
      cambiarModo('verificar');
      aviso.value =
        'Te enviamos un correo de verificación. Abrí el enlace y después iniciá sesión.';
    }
  } else if (modo.value === 'recuperar') {
    if (await sesion.enviarRecuperacionContrasena(correo.value))
      aviso.value =
        'Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.';
  } else if (modo.value === 'verificar') {
    if (await sesion.reenviarVerificacion(correo.value, contrasena.value)) {
      contrasena.value = '';
      aviso.value = 'Te enviamos nuevamente el correo de verificación.';
    }
  } else if (await sesion.iniciarSesion({ usuario: correo.value, contrasena: contrasena.value })) {
    contrasena.value = '';
    $q.notify({
      message: 'Sesión iniciada correctamente.',
      position: 'top',
      classes: 'notificacion-exito',
    });
  }
}

async function entrarConGoogle(): Promise<void> {
  if (sesion.cargando) return;
  if (await sesion.iniciarSesionConGoogle())
    $q.notify({
      message: 'Sesión iniciada con Google.',
      position: 'top',
      classes: 'notificacion-exito',
    });
}
</script>

<template>
  <q-dialog
    :model-value="sesion.modalInicioSesionVisible"
    @update:model-value="(visible) => !visible && sesion.cerrarModalInicioSesion()"
  >
    <q-card class="modal-inicio-sesion">
      <q-card-section class="modal-inicio-sesion__encabezado">
        <span class="modal-inicio-sesion__icono" aria-hidden="true"><q-icon name="key" /></span>
        <div>
          <p class="etiqueta-seccion">Cuenta privada</p>
          <h2 class="titulo-seccion">{{ titulo }}</h2>
        </div>
      </q-card-section>

      <q-form class="modal-inicio-sesion__formulario" @submit="enviarFormulario">
        <p class="texto-secundario modal-inicio-sesion__descripcion">
          {{
            modo === 'entrar'
              ? 'Entrá para sincronizar tus datos y descargar, imprimir o enviar presupuestos.'
              : modo === 'registrar'
                ? 'Creá tu cuenta para guardar tus clientes, materiales y presupuestos.'
                : modo === 'recuperar'
                  ? 'Te enviaremos un enlace para crear una contraseña nueva.'
                  : 'Ingresá tu contraseña para reenviar el correo de verificación.'
          }}
        </p>
        <q-input
          v-if="modo === 'registrar'"
          v-model="nombre"
          dark
          outlined
          autocomplete="name"
          label="Nombre"
          :disable="sesion.cargando"
          :rules="[(valor) => Boolean(String(valor).trim()) || 'Ingresá tu nombre.']"
        />
        <q-input
          v-model="correo"
          dark
          outlined
          autofocus
          :autocomplete="sesion.firebaseActivo ? 'email' : 'username'"
          :type="sesion.firebaseActivo ? 'email' : 'text'"
          :label="sesion.firebaseActivo ? 'Correo electrónico' : 'Usuario'"
          :disable="sesion.cargando"
          :rules="[(valor) => Boolean(String(valor).trim()) || 'Ingresá tu correo o usuario.']"
        />
        <q-input
          v-if="modo !== 'recuperar'"
          v-model="contrasena"
          dark
          outlined
          :autocomplete="modo === 'registrar' ? 'new-password' : 'current-password'"
          label="Contraseña"
          :type="mostrarContrasena ? 'text' : 'password'"
          :disable="sesion.cargando"
          :rules="[(valor) => Boolean(valor) || 'Ingresá la contraseña.']"
        >
          <template #append
            ><q-btn
              flat
              round
              dense
              :icon="mostrarContrasena ? 'visibility_off' : 'visibility'"
              :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="mostrarContrasena = !mostrarContrasena"
          /></template>
        </q-input>
        <q-banner v-if="aviso" class="aviso-exito" rounded role="status">{{ aviso }}</q-banner>
        <q-banner v-if="sesion.error" class="aviso-error" rounded role="alert"
          ><template #avatar><q-icon name="error_outline" /></template>{{ sesion.error }}</q-banner
        >

        <div v-if="sesion.firebaseActivo" class="modal-inicio-sesion__enlaces">
          <q-btn
            v-if="modo !== 'entrar'"
            flat
            dense
            no-caps
            label="Ya tengo cuenta"
            :disable="sesion.cargando"
            @click="cambiarModo('entrar')"
          />
          <q-btn
            v-if="modo === 'entrar'"
            flat
            dense
            no-caps
            label="Crear cuenta"
            :disable="sesion.cargando"
            @click="cambiarModo('registrar')"
          />
          <q-btn
            v-if="modo === 'entrar'"
            flat
            dense
            no-caps
            label="Olvidé mi contraseña"
            :disable="sesion.cargando"
            @click="cambiarModo('recuperar')"
          />
          <q-btn
            v-if="modo === 'entrar'"
            flat
            dense
            no-caps
            label="Reenviar verificación"
            :disable="sesion.cargando"
            @click="cambiarModo('verificar')"
          />
        </div>

        <q-card-actions class="modal-inicio-sesion__acciones" align="right">
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            label="Cancelar"
            :disable="sesion.cargando"
            @click="sesion.cerrarModalInicioSesion()"
          />
          <q-btn
            class="boton-accion-principal"
            unelevated
            no-caps
            type="submit"
            :label="
              modo === 'entrar'
                ? 'Entrar'
                : modo === 'registrar'
                  ? 'Registrarme'
                  : modo === 'recuperar'
                    ? 'Enviar enlace'
                    : 'Reenviar correo'
            "
            :loading="sesion.cargando"
          />
        </q-card-actions>
        <q-btn
          v-if="sesion.firebaseActivo && (modo === 'entrar' || modo === 'registrar')"
          class="full-width"
          outline
          no-caps
          icon="account_circle"
          label="Continuar con Google"
          :disable="sesion.cargando"
          @click="entrarConGoogle"
        />
      </q-form>
    </q-card>
  </q-dialog>
</template>
