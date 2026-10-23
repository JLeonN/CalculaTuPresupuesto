<script setup lang="ts">
import { ref } from 'vue';
import {
  crearLocal,
  crearTelefono,
  crearTelefonoLocal,
  ETIQUETAS_TELEFONO,
  type DatosCliente,
  type LocalCliente,
  type TelefonoCliente,
} from '@/dominio/clientes';

defineProps<{
  guardando: boolean;
}>();

const emitir = defineEmits<{
  guardar: [datos: DatosCliente];
  cancelar: [];
}>();

const nombre = ref('');
const telefonos = ref<TelefonoCliente[]>([crearTelefono()]);
const locales = ref<LocalCliente[]>([crearLocal()]);
const correo = ref('');
const notas = ref('');
const mostrarDatosAdicionales = ref(false);
const telefonoPrincipalId = ref('');
telefonoPrincipalId.value = telefonos.value[0]?.id ?? '';

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

function agregarTelefonoLocal(local: LocalCliente): void {
  local.telefonos.push({
    ...crearTelefonoLocal(),
    esPrincipal: local.telefonos.length === 0,
  });
}

function quitarTelefonoLocal(local: LocalCliente, idTelefono: string): void {
  local.telefonos = local.telefonos.filter((telefono) => telefono.id !== idTelefono);
  if (local.telefonos.length > 0 && !local.telefonos.some((telefono) => telefono.esPrincipal)) {
    local.telefonos[0]!.esPrincipal = true;
  }
}

function marcarTelefonoLocalPrincipal(local: LocalCliente, idTelefono: string): void {
  local.telefonos.forEach((telefono) => {
    telefono.esPrincipal = telefono.id === idTelefono;
  });
}

function quitarLocal(idLocal: string): void {
  locales.value = locales.value.filter((local) => local.id !== idLocal);
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

      <section class="seccion-formulario" aria-labelledby="titulo-locales">
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
            <div class="telefonos-local-formulario">
              <div
                v-for="telefono in local.telefonos"
                :key="telefono.id"
                class="telefono-local-formulario"
              >
                <q-input
                  v-model="telefono.numero"
                  dark
                  outlined
                  type="tel"
                  label="Teléfono del local"
                />
                <q-select
                  v-model="telefono.etiqueta"
                  dark
                  outlined
                  behavior="menu"
                  label="Tipo"
                  popup-content-class="selector-opciones"
                  :options="ETIQUETAS_TELEFONO"
                />
                <q-radio
                  :model-value="local.telefonos.find((actual) => actual.esPrincipal)?.id"
                  :val="telefono.id"
                  label="Principal"
                  @update:model-value="marcarTelefonoLocalPrincipal(local, telefono.id)"
                />
                <q-btn
                  flat
                  round
                  icon="delete_outline"
                  aria-label="Quitar teléfono del local"
                  @click="quitarTelefonoLocal(local, telefono.id)"
                />
              </div>
              <q-btn
                class="boton-secundario"
                flat
                no-caps
                icon="add"
                label="Agregar teléfono del local"
                @click="agregarTelefonoLocal(local)"
              />
            </div>
            <q-btn
              class="boton-icono-secundario"
              flat
              round
              dense
              icon="delete_outline"
              aria-label="Quitar local"
              @click="quitarLocal(local.id)"
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
          label="Guardar cliente"
        />
      </div>
    </div>
  </q-form>
</template>
