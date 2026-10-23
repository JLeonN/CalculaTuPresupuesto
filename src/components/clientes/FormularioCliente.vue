<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import {
  crearLocal,
  crearTelefono,
  ETIQUETAS_TELEFONO,
  type Cliente,
  type DatosCliente,
  type LocalCliente,
  type TelefonoCliente,
} from '@/dominio/clientes';

const props = defineProps<{
  cliente: Cliente | undefined;
  guardando: boolean;
  agregarLocalAlAbrir?: boolean;
}>();

const emitir = defineEmits<{
  guardar: [datos: DatosCliente];
  cancelar: [];
}>();

const nombre = ref('');
const telefonos = ref<TelefonoCliente[]>([]);
const locales = ref<LocalCliente[]>([]);
const correo = ref('');
const notas = ref('');
const mostrarDatosAdicionales = ref(false);
const telefonoPrincipalId = ref('');
const idLocalPendienteEliminar = ref<string | null>(null);
const mostrarConfirmacionEliminarLocal = ref(false);
const seccionLocales = ref<HTMLElement | null>(null);

const esEdicion = computed(() => props.cliente !== undefined);

function cargarDatosCliente(cliente: Cliente | undefined): void {
  nombre.value = cliente?.nombre ?? '';
  telefonos.value = (cliente?.telefonos ?? [crearTelefono()]).map((telefono) => ({
    ...telefono,
  }));
  const localesGuardados = cliente?.locales ?? [];
  locales.value = localesGuardados.length
    ? localesGuardados.map((local) => ({ ...local }))
    : [crearLocal()];
  if (props.agregarLocalAlAbrir && localesGuardados.length > 0) {
    locales.value.push(crearLocal());
  }
  correo.value = cliente?.correo ?? '';
  notas.value = cliente?.notas ?? '';
  telefonoPrincipalId.value =
    cliente?.telefonos.find((telefono) => telefono.esPrincipal)?.id ?? telefonos.value[0]?.id ?? '';
  mostrarDatosAdicionales.value = false;
}

watch(() => props.cliente, cargarDatosCliente, { immediate: true });

onMounted(async () => {
  if (props.agregarLocalAlAbrir) {
    await nextTick();
    const campoNuevoLocal = seccionLocales.value?.querySelector<HTMLInputElement>(
      '.bloque-repetible:last-child input',
    );
    requestAnimationFrame(() => {
      campoNuevoLocal?.focus();
      campoNuevoLocal?.scrollIntoView({ block: 'center' });
    });
  }
});

function agregarTelefono(): void {
  const telefono = crearTelefono();
  telefonos.value.push(telefono);
  telefonoPrincipalId.value ||= telefono.id;
}

function eliminarTelefono(idTelefono: string): void {
  if (telefonos.value.length === 1) {
    return;
  }

  telefonos.value = telefonos.value.filter((telefono) => telefono.id !== idTelefono);

  if (telefonoPrincipalId.value === idTelefono) {
    telefonoPrincipalId.value = telefonos.value[0]?.id ?? '';
  }
}

function agregarLocal(): void {
  locales.value.push(crearLocal());
}

function solicitarEliminarLocal(idLocal: string): void {
  if (locales.value.length > 1) {
    idLocalPendienteEliminar.value = idLocal;
    mostrarConfirmacionEliminarLocal.value = true;
  }
}

function confirmarEliminarLocal(): void {
  if (idLocalPendienteEliminar.value === null) {
    return;
  }

  locales.value = locales.value.filter((local) => local.id !== idLocalPendienteEliminar.value);
  idLocalPendienteEliminar.value = null;
  mostrarConfirmacionEliminarLocal.value = false;
}

function guardarCliente(): void {
  emitir('guardar', {
    nombre: nombre.value,
    telefonos: telefonos.value.map((telefono) => ({
      ...telefono,
      esPrincipal: telefono.id === telefonoPrincipalId.value,
    })),
    locales: locales.value,
    correo: correo.value,
    notas: notas.value,
  });
}
</script>

<template>
  <q-form class="formulario-cliente" greedy @submit="guardarCliente">
    <div class="formulario-cliente__contenedor">
      <section class="seccion-formulario" aria-labelledby="titulo-datos-cliente">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Datos principales</p>
            <h2 id="titulo-datos-cliente" class="titulo-seccion">Cliente</h2>
          </div>
        </div>

        <q-input
          v-model="nombre"
          dark
          outlined
          label="Nombre del cliente"
          autocomplete="name"
          :rules="[(valor) => Boolean(String(valor).trim()) || 'Ingresá el nombre del cliente.']"
        />
      </section>

      <section class="seccion-formulario" aria-labelledby="titulo-telefonos">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Contacto</p>
            <h2 id="titulo-telefonos" class="titulo-seccion">Teléfonos</h2>
            <p class="texto-secundario texto-ayuda-formulario">
              Marcá el teléfono principal que querés ver en la lista de clientes.
            </p>
          </div>
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            icon="add"
            label="Agregar teléfono"
            @click="agregarTelefono"
          />
        </div>

        <div class="lista-campos-repetibles">
          <article v-for="telefono in telefonos" :key="telefono.id" class="bloque-repetible">
            <div class="bloque-repetible__campos bloque-repetible__campos--telefono">
              <q-input
                v-model="telefono.numero"
                dark
                outlined
                type="tel"
                label="Teléfono (opcional)"
                autocomplete="tel"
              />
              <q-select
                v-model="telefono.etiqueta"
                dark
                outlined
                behavior="menu"
                menu-anchor="bottom left"
                menu-self="top left"
                popup-content-class="selector-opciones"
                label="Tipo"
                :options="ETIQUETAS_TELEFONO"
              />
              <q-radio
                v-model="telefonoPrincipalId"
                class="selector-principal"
                :val="telefono.id"
                label="Principal"
              />
            </div>
            <q-btn
              v-if="telefonos.length > 1"
              class="boton-icono-secundario"
              flat
              round
              dense
              icon="delete_outline"
              aria-label="Quitar teléfono"
              @click="eliminarTelefono(telefono.id)"
            />
          </article>
        </div>
      </section>

      <section ref="seccionLocales" class="seccion-formulario" aria-labelledby="titulo-locales">
        <div class="encabezado-seccion-formulario">
          <div>
            <p class="etiqueta-seccion">Lugar de trabajo</p>
            <h2 id="titulo-locales" class="titulo-seccion">Locales</h2>
            <p class="texto-secundario texto-ayuda-formulario">
              Podés asociar varios locales a una misma persona.
            </p>
          </div>
          <q-btn
            class="boton-secundario"
            flat
            no-caps
            icon="add"
            label="Agregar otro local"
            @click="agregarLocal"
          />
        </div>

        <div class="lista-campos-repetibles">
          <article v-for="(local, indice) in locales" :key="local.id" class="bloque-repetible">
            <div class="bloque-repetible__campos bloque-repetible__campos--local">
              <q-input
                v-model="local.nombre"
                dark
                outlined
                :label="`Nombre del local ${indice + 1} (opcional)`"
              />
              <q-input
                v-model="local.direccion"
                dark
                outlined
                label="Dirección (opcional)"
                autocomplete="street-address"
              />
            </div>
            <q-btn
              v-if="locales.length > 1"
              class="boton-icono-secundario"
              flat
              round
              dense
              icon="delete_outline"
              aria-label="Quitar local"
              @click="solicitarEliminarLocal(local.id)"
            />
          </article>
        </div>
      </section>

      <q-expansion-item
        v-model="mostrarDatosAdicionales"
        class="seccion-formulario seccion-formulario--desplegable"
        icon="add_circle_outline"
        label="Datos adicionales"
        caption="Correo electrónico y notas generales"
        header-class="encabezado-datos-adicionales"
      >
        <div class="datos-adicionales__contenido">
          <q-input
            v-model="correo"
            dark
            outlined
            type="email"
            label="Correo electrónico"
            autocomplete="email"
            :rules="[
              (valor) =>
                !valor ||
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor)) ||
                'Ingresá un correo válido.',
            ]"
          />
          <q-input
            v-model="notas"
            class="campo-notas-generales"
            dark
            outlined
            type="textarea"
            rows="6"
            label="Notas generales"
            hint="Observaciones generales del cliente, no de un local específico."
          />
        </div>
      </q-expansion-item>

      <div class="acciones-formulario">
        <q-btn class="boton-secundario" flat no-caps label="Cancelar" @click="emitir('cancelar')" />
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          type="submit"
          :loading="guardando"
          :label="esEdicion ? 'Guardar cambios' : 'Guardar cliente'"
        />
      </div>
    </div>
  </q-form>

  <q-dialog v-model="mostrarConfirmacionEliminarLocal" persistent>
    <q-card class="dialogo-confirmacion">
      <q-card-section>
        <p class="etiqueta-seccion">Confirmar acción</p>
        <h2 class="titulo-seccion">¿Quitar este local?</h2>
        <p class="texto-secundario">
          Esta acción se aplicará cuando guardes los cambios del cliente.
        </p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn class="boton-secundario" flat no-caps label="Cancelar" v-close-popup />
        <q-btn
          class="boton-peligro"
          flat
          no-caps
          label="Quitar local"
          @click="confirmarEliminarLocal"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
