<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import EnlaceWhatsapp from '@/components/clientes/EnlaceWhatsapp.vue';
import {
  crearLocal,
  crearTelefono,
  crearTelefonoLocal,
  ETIQUETAS_TELEFONO,
  obtenerLocalesConDatos,
  obtenerTelefonoPrincipal,
  obtenerTelefonosConNumero,
  type Cliente,
  type DatosCliente,
  type LocalCliente,
  type TelefonoCliente,
} from '@/dominio/clientes';
import { useClientesStore } from '@/stores/clientes';

const ruta = useRoute();
const router = useRouter();
const $q = useQuasar();
const clientesStore = useClientesStore();
const cargando = ref(true);
const editando = ref(false);
const borrador = ref<DatosCliente | null>(null);
const camposEditables = ref<string[]>([]);
const idLocalActivo = ref<string | null>(null);
const idLocalPendiente = ref<string | null>(null);
const confirmarLocal = ref(false);
const confirmarCliente = ref(false);
const confirmarAbandono = ref(false);
let resolverAbandono: ((confirmado: boolean) => void) | null = null;
const cliente = computed(() => clientesStore.obtenerClientePorId(String(ruta.params.idCliente)));
const datos = computed(() => borrador.value ?? cliente.value);
const telefonos = computed(() =>
  editando.value
    ? (borrador.value?.telefonos ?? [])
    : obtenerTelefonosConNumero(cliente.value?.telefonos ?? []),
);
const locales = computed(() =>
  editando.value
    ? (borrador.value?.locales ?? [])
    : obtenerLocalesConDatos(cliente.value?.locales ?? []),
);
const telefonoPrincipal = computed(() =>
  datos.value ? obtenerTelefonoPrincipal(datos.value as Cliente) : undefined,
);
const iniciales = computed(() =>
  (datos.value?.nombre.trim().split(/\s+/).slice(0, 2) ?? [])
    .map((palabra) => palabra.charAt(0).toLocaleUpperCase())
    .join(''),
);
const cantidadLocales = computed(() => obtenerLocalesConDatos(cliente.value?.locales ?? []).length);
const descripcionEliminacion = computed(() =>
  cantidadLocales.value === 0
    ? 'Esta acción no se puede deshacer.'
    : cantidadLocales.value === 1
      ? 'Se eliminará también su local asociado.'
      : `Se eliminarán también sus ${cantidadLocales.value} locales asociados.`,
);
const hayCambios = computed(() =>
  editando.value && borrador.value && cliente.value
    ? JSON.stringify(borrador.value) !== JSON.stringify(copiarDatos(cliente.value))
    : false,
);

function copiarDatos(origen: DatosCliente): DatosCliente {
  return {
    nombre: origen.nombre,
    telefonos: origen.telefonos.map((telefono) => ({ ...telefono })),
    locales: origen.locales.map((local) => ({
      ...local,
      telefonos: (local.telefonos ?? []).map((telefono) => ({ ...telefono })),
    })),
    correo: origen.correo,
    notas: origen.notas,
  };
}
function estaEditable(clave: string): boolean {
  return camposEditables.value.includes(clave);
}
function habilitarCampo(clave: string): void {
  if (!estaEditable(clave)) camposEditables.value.push(clave);
}
function comenzarEdicion(): void {
  if (!cliente.value) return;
  clientesStore.limpiarError();
  borrador.value = copiarDatos(cliente.value);
  camposEditables.value = [];
  editando.value = true;
}
function cancelarEdicion(): void {
  clientesStore.limpiarError();
  editando.value = false;
  borrador.value = null;
  camposEditables.value = [];
}
function asegurarPrincipal(lista: TelefonoCliente[]): void {
  if (lista.length && !lista.some((telefono) => telefono.esPrincipal)) lista[0]!.esPrincipal = true;
}
function marcarPrincipal(lista: TelefonoCliente[], id: string): void {
  lista.forEach((telefono) => {
    telefono.esPrincipal = telefono.id === id;
  });
}
function agregarTelefono(): void {
  if (!borrador.value) return;
  const telefono = { ...crearTelefono(), esPrincipal: borrador.value.telefonos.length === 0 };
  borrador.value.telefonos.push(telefono);
  habilitarCampo(`telefono:${telefono.id}`);
}
function quitarTelefono(id: string): void {
  if (!borrador.value) return;
  borrador.value.telefonos = borrador.value.telefonos.filter((telefono) => telefono.id !== id);
  asegurarPrincipal(borrador.value.telefonos);
}
function agregarLocal(): void {
  if (!borrador.value) return;
  const local = crearLocal();
  borrador.value.locales.push(local);
  idLocalActivo.value = local.id;
  habilitarCampo(`nombre-local:${local.id}`);
  habilitarCampo(`direccion-local:${local.id}`);
}
function solicitarQuitarLocal(id: string): void {
  if (cliente.value?.locales.some((local) => local.id === id)) {
    idLocalPendiente.value = id;
    confirmarLocal.value = true;
  } else quitarLocal(id);
}
function quitarLocal(id: string): void {
  if (!borrador.value) return;
  borrador.value.locales = borrador.value.locales.filter((local) => local.id !== id);
  idLocalPendiente.value = null;
  confirmarLocal.value = false;
}
function agregarTelefonoLocal(local: LocalCliente): void {
  const telefono = { ...crearTelefonoLocal(), esPrincipal: local.telefonos.length === 0 };
  local.telefonos.push(telefono);
  habilitarCampo(`telefono-local:${telefono.id}`);
}
function quitarTelefonoLocal(local: LocalCliente, id: string): void {
  local.telefonos = local.telefonos.filter((telefono) => telefono.id !== id);
  asegurarPrincipal(local.telefonos);
}
async function guardarCambios(): Promise<void> {
  if (!cliente.value || !borrador.value || clientesStore.guardando) return;
  try {
    await clientesStore.editarCliente(cliente.value.id, borrador.value);
    cancelarEdicion();
    $q.notify({
      message: 'Los cambios se guardaron correctamente.',
      position: 'top',
      classes: 'notificacion-exito',
    });
  } catch {
    /* El store muestra el error y se conserva el borrador. */
  }
}
async function eliminarCliente(): Promise<void> {
  if (!cliente.value) return;
  try {
    await clientesStore.eliminarCliente(cliente.value.id);
    $q.notify({
      message: 'Cliente eliminado correctamente.',
      position: 'top',
      classes: 'notificacion-exito',
    });
    void router.replace('/clientes');
  } catch {
    confirmarCliente.value = false;
  }
}
function confirmarSalida(): Promise<boolean> {
  return new Promise((resolver) => {
    resolverAbandono = resolver;
    confirmarAbandono.value = true;
  });
}
function responderAbandono(confirmado: boolean): void {
  confirmarAbandono.value = false;
  resolverAbandono?.(confirmado);
  resolverAbandono = null;
}
function advertirCierre(evento: BeforeUnloadEvent): void {
  if (hayCambios.value) evento.preventDefault();
}
onBeforeRouteLeave(async () => !hayCambios.value || (await confirmarSalida()));
watch(
  locales,
  (lista) => {
    if (!lista.some((local) => local.id === idLocalActivo.value))
      idLocalActivo.value = lista[0]?.id ?? null;
  },
  { immediate: true },
);
onMounted(async () => {
  window.addEventListener('beforeunload', advertirCierre);
  if (!clientesStore.clientes.length) await clientesStore.cargarClientes();
  cargando.value = false;
});
onBeforeUnmount(() => window.removeEventListener('beforeunload', advertirCierre));
</script>

<template>
  <q-page class="pagina-contenido">
    <main class="contenedor-principal contenedor-detalle-cliente">
      <q-banner v-if="clientesStore.error" class="aviso-error" rounded>
        <template #avatar><q-icon name="error_outline" /></template>{{ clientesStore.error }}
      </q-banner>
      <div v-if="cargando" class="estado-clientes">
        <q-spinner class="indicador-carga" size="2rem" /><span>Cargando datos del cliente…</span>
      </div>
      <q-form v-else-if="cliente && datos" class="detalle-cliente" greedy @submit="guardarCambios">
        <header class="encabezado-detalle-cliente">
          <div class="encabezado-detalle-cliente__fila-superior">
            <p class="etiqueta-seccion">Ficha del cliente</p>
            <q-btn
              class="boton-secundario boton-volver-adaptable"
              flat
              no-caps
              icon="arrow_back"
              aria-label="Volver a clientes"
              to="/clientes"
            >
              <span class="boton-volver-adaptable__completo">Volver a clientes</span
              ><span class="boton-volver-adaptable__corto">Volver</span>
            </q-btn>
          </div>
          <div class="encabezado-detalle-cliente__principal">
            <div class="encabezado-detalle-cliente__perfil">
              <div class="encabezado-detalle-cliente__avatar" aria-hidden="true">
                {{ iniciales }}
              </div>
              <div class="encabezado-detalle-cliente__datos">
                <div class="dato-editable-cliente">
                  <q-input
                    v-if="editando && estaEditable('nombre') && borrador"
                    v-model="borrador.nombre"
                    dark
                    outlined
                    autofocus
                    label="Nombre del cliente"
                    :rules="[
                      (valor) => Boolean(String(valor).trim()) || 'Ingresá el nombre del cliente.',
                    ]"
                  />
                  <h1 v-else class="titulo-pagina">{{ datos.nombre }}</h1>
                  <q-btn
                    v-if="editando && !estaEditable('nombre')"
                    flat
                    round
                    icon="edit"
                    aria-label="Editar nombre del cliente"
                    @click="habilitarCampo('nombre')"
                  />
                </div>
                <p v-if="telefonoPrincipal" class="encabezado-detalle-cliente__telefono">
                  <q-icon name="phone" aria-hidden="true" />{{ telefonoPrincipal.numero }}
                </p>
                <p v-else class="texto-secundario encabezado-detalle-cliente__telefono">
                  Sin teléfono principal
                </p>
              </div>
            </div>
            <div class="acciones-encabezado-detalle">
              <template v-if="editando">
                <q-btn
                  class="boton-secundario"
                  flat
                  no-caps
                  label="Cancelar"
                  :disable="clientesStore.guardando"
                  @click="cancelarEdicion"
                />
                <q-btn
                  class="boton-accion-principal"
                  unelevated
                  no-caps
                  type="submit"
                  label="Guardar cambios"
                  :loading="clientesStore.guardando"
                />
              </template>
              <q-btn
                v-else
                class="boton-accion-principal encabezado-detalle-cliente__editar"
                unelevated
                no-caps
                icon="edit"
                label="Editar cliente"
                @click="comenzarEdicion"
              />
            </div>
          </div>
        </header>
        <div class="detalle-cliente__columnas">
          <section
            class="tarjeta-detalle-cliente tarjeta-detalle-cliente--contacto"
            aria-labelledby="titulo-telefonos-cliente"
          >
            <p class="etiqueta-seccion">Contacto</p>
            <h2 id="titulo-telefonos-cliente" class="titulo-seccion">Teléfonos</h2>
            <p
              v-if="!telefonos.length"
              class="texto-secundario tarjeta-detalle-cliente__descripcion"
            >
              Sin teléfonos registrados.
            </p>
            <div v-else class="lista-detalle-cliente">
              <article
                v-for="telefono in telefonos"
                :key="telefono.id"
                class="fila-detalle-cliente fila-detalle-cliente--telefono"
              >
                <q-icon name="phone" class="fila-detalle-cliente__icono" aria-hidden="true" />
                <div class="fila-detalle-cliente__datos">
                  <template v-if="editando && estaEditable(`telefono:${telefono.id}`)">
                    <q-input v-model="telefono.numero" dark outlined type="tel" label="Teléfono" />
                    <q-select
                      v-model="telefono.etiqueta"
                      dark
                      outlined
                      behavior="menu"
                      label="Tipo"
                      popup-content-class="selector-opciones"
                      :options="ETIQUETAS_TELEFONO"
                    />
                  </template>
                  <template v-else
                    ><strong>{{ telefono.numero }}</strong
                    ><span>{{ telefono.etiqueta }}</span></template
                  >
                </div>
                <template v-if="editando && borrador">
                  <q-radio
                    :model-value="borrador.telefonos.find((actual) => actual.esPrincipal)?.id"
                    :val="telefono.id"
                    label="Principal"
                    @update:model-value="marcarPrincipal(borrador.telefonos, telefono.id)"
                  />
                  <q-btn
                    v-if="!estaEditable(`telefono:${telefono.id}`)"
                    flat
                    round
                    icon="edit"
                    :aria-label="`Editar teléfono ${telefono.numero}`"
                    @click="habilitarCampo(`telefono:${telefono.id}`)"
                  />
                  <q-btn
                    flat
                    round
                    icon="delete_outline"
                    :aria-label="`Quitar teléfono ${telefono.numero}`"
                    @click="quitarTelefono(telefono.id)"
                  />
                </template>
                <template v-else>
                  <q-badge v-if="telefono.esPrincipal" class="insignia-principal"
                    >Principal</q-badge
                  >
                  <EnlaceWhatsapp
                    class="fila-detalle-cliente__accion"
                    :nombre-cliente="cliente.nombre"
                    :numero="telefono.numero"
                    etiqueta="Abrir WhatsApp"
                  />
                </template>
              </article>
            </div>
            <q-btn
              v-if="editando"
              class="boton-secundario locales-cliente__agregar"
              flat
              no-caps
              icon="add"
              label="Agregar teléfono"
              @click="agregarTelefono"
            />
          </section>
          <section
            class="tarjeta-detalle-cliente tarjeta-detalle-cliente--locales"
            aria-labelledby="titulo-locales-cliente"
          >
            <p class="etiqueta-seccion">Lugar de trabajo</p>
            <h2 id="titulo-locales-cliente" class="titulo-seccion">Locales</h2>
            <div v-if="!locales.length" class="locales-cliente__vacio">
              <q-icon name="storefront" aria-hidden="true" />
              <p>Sin locales registrados</p>
            </div>
            <template v-else>
              <q-tabs
                v-model="idLocalActivo"
                class="locales-cliente__pestanas"
                align="left"
                no-caps
                outside-arrows
                mobile-arrows
                active-color="primary"
                indicator-color="primary"
                aria-label="Locales del cliente"
              >
                <q-tab
                  v-for="(local, indice) in locales"
                  :key="local.id"
                  :name="local.id"
                  :label="local.nombre || `Local ${indice + 1}`"
                  :title="local.nombre || `Local ${indice + 1}`"
                />
              </q-tabs>
              <q-tab-panels v-model="idLocalActivo" class="locales-cliente__paneles">
                <q-tab-panel v-for="local in locales" :key="local.id" :name="local.id">
                  <div class="contenido-local-cliente">
                    <div class="dato-editable-cliente">
                      <q-input
                        v-if="editando && estaEditable(`nombre-local:${local.id}`)"
                        v-model="local.nombre"
                        dark
                        outlined
                        label="Nombre del local"
                      />
                      <strong v-else>{{ local.nombre || 'Local sin nombre' }}</strong>
                      <q-btn
                        v-if="editando && !estaEditable(`nombre-local:${local.id}`)"
                        flat
                        round
                        icon="edit"
                        aria-label="Editar nombre del local"
                        @click="habilitarCampo(`nombre-local:${local.id}`)"
                      />
                    </div>
                    <div class="dato-editable-cliente">
                      <q-input
                        v-if="editando && estaEditable(`direccion-local:${local.id}`)"
                        v-model="local.direccion"
                        dark
                        outlined
                        label="Dirección"
                      />
                      <p v-else>{{ local.direccion || 'Sin dirección registrada.' }}</p>
                      <q-btn
                        v-if="editando && !estaEditable(`direccion-local:${local.id}`)"
                        flat
                        round
                        icon="edit"
                        aria-label="Editar dirección del local"
                        @click="habilitarCampo(`direccion-local:${local.id}`)"
                      />
                    </div>
                    <div class="lista-detalle-cliente">
                      <p class="texto-secundario">Teléfonos del local</p>
                      <article
                        v-for="telefono in editando
                          ? local.telefonos
                          : obtenerTelefonosConNumero(local.telefonos)"
                        :key="telefono.id"
                        class="fila-detalle-cliente fila-detalle-cliente--telefono"
                      >
                        <q-icon
                          name="phone"
                          class="fila-detalle-cliente__icono"
                          aria-hidden="true"
                        />
                        <div class="fila-detalle-cliente__datos">
                          <template
                            v-if="editando && estaEditable(`telefono-local:${telefono.id}`)"
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
                          </template>
                          <template v-else
                            ><strong>{{ telefono.numero }}</strong
                            ><span>{{ telefono.etiqueta }}</span></template
                          >
                        </div>
                        <template v-if="editando">
                          <q-radio
                            :model-value="local.telefonos.find((actual) => actual.esPrincipal)?.id"
                            :val="telefono.id"
                            label="Principal"
                            @update:model-value="marcarPrincipal(local.telefonos, telefono.id)"
                          />
                          <q-btn
                            v-if="!estaEditable(`telefono-local:${telefono.id}`)"
                            flat
                            round
                            icon="edit"
                            :aria-label="`Editar teléfono ${telefono.numero} del local`"
                            @click="habilitarCampo(`telefono-local:${telefono.id}`)"
                          />
                          <q-btn
                            flat
                            round
                            icon="delete_outline"
                            :aria-label="`Quitar teléfono ${telefono.numero} del local`"
                            @click="quitarTelefonoLocal(local, telefono.id)"
                          />
                        </template>
                        <template v-else>
                          <q-badge v-if="telefono.esPrincipal" class="insignia-principal"
                            >Principal</q-badge
                          >
                          <EnlaceWhatsapp
                            :nombre-cliente="cliente.nombre"
                            :numero="telefono.numero"
                            etiqueta="Abrir WhatsApp"
                          />
                        </template>
                      </article>
                      <q-btn
                        v-if="editando"
                        class="boton-secundario locales-cliente__agregar"
                        flat
                        no-caps
                        icon="add"
                        label="Agregar teléfono del local"
                        @click="agregarTelefonoLocal(local)"
                      />
                    </div>
                    <q-btn
                      v-if="editando"
                      class="boton-peligro"
                      flat
                      no-caps
                      icon="delete_outline"
                      label="Quitar local"
                      @click="solicitarQuitarLocal(local.id)"
                    />
                  </div>
                </q-tab-panel>
              </q-tab-panels>
            </template>
            <q-btn
              v-if="editando"
              class="boton-secundario locales-cliente__agregar"
              flat
              no-caps
              icon="add"
              label="Agregar otro local"
              @click="agregarLocal"
            />
          </section>
        </div>
        <section v-if="editando || datos.correo || datos.notas" class="tarjeta-detalle-cliente">
          <p class="etiqueta-seccion">Datos adicionales</p>
          <div v-if="editando || datos.correo" class="dato-adicional-cliente">
            <span>Correo electrónico</span>
            <div class="dato-editable-cliente">
              <q-input
                v-if="editando && estaEditable('correo') && borrador"
                v-model="borrador.correo"
                dark
                outlined
                type="email"
                label="Correo electrónico"
                :rules="[
                  (valor) =>
                    !valor ||
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor)) ||
                    'Ingresá un correo válido.',
                ]"
              />
              <strong v-else>{{ datos.correo || 'Sin correo registrado' }}</strong>
              <q-btn
                v-if="editando && !estaEditable('correo')"
                flat
                round
                icon="edit"
                aria-label="Editar correo electrónico"
                @click="habilitarCampo('correo')"
              />
            </div>
          </div>
          <div v-if="editando || datos.notas" class="dato-adicional-cliente">
            <span>Notas generales</span>
            <div class="dato-editable-cliente">
              <q-input
                v-if="editando && estaEditable('notas') && borrador"
                v-model="borrador.notas"
                class="campo-notas-generales"
                dark
                outlined
                type="textarea"
                rows="6"
                label="Notas generales"
              />
              <p v-else>{{ datos.notas || 'Sin notas registradas' }}</p>
              <q-btn
                v-if="editando && !estaEditable('notas')"
                flat
                round
                icon="edit"
                aria-label="Editar notas generales"
                @click="habilitarCampo('notas')"
              />
            </div>
          </div>
        </section>
        <section class="zona-peligro-cliente" aria-label="Eliminar cliente">
          <p class="texto-secundario">{{ descripcionEliminacion }}</p>
          <q-btn
            class="boton-peligro"
            flat
            no-caps
            icon="delete_outline"
            label="Eliminar cliente"
            :disable="editando"
            @click="confirmarCliente = true"
          />
        </section>
      </q-form>
      <section v-else class="estado-vacio-clientes">
        <q-icon name="person_off" aria-hidden="true" />
        <h1 class="titulo-seccion">No encontramos este cliente</h1>
        <p class="texto-secundario">
          Puede haber sido eliminado o no estar disponible en este dispositivo.
        </p>
        <q-btn
          class="boton-accion-principal"
          unelevated
          no-caps
          label="Volver a clientes"
          to="/clientes"
        />
      </section>
    </main>
  </q-page>
  <q-dialog v-model="confirmarLocal" persistent>
    <q-card class="dialogo-confirmacion">
      <q-card-section
        ><h2 class="titulo-seccion">¿Quitar este local?</h2>
        <p class="texto-secundario">Se quitará cuando guardes los cambios.</p></q-card-section
      >
      <q-card-actions align="right"
        ><q-btn
          class="boton-secundario"
          flat
          no-caps
          label="Cancelar"
          @click="confirmarLocal = false" /><q-btn
          class="boton-peligro"
          flat
          no-caps
          label="Quitar local"
          @click="quitarLocal(idLocalPendiente!)"
      /></q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="confirmarCliente" persistent>
    <q-card class="dialogo-confirmacion">
      <q-card-section
        ><p class="etiqueta-seccion">Acción irreversible</p>
        <h2 class="titulo-seccion">¿Eliminar a {{ cliente?.nombre }}?</h2>
        <p class="texto-secundario">{{ descripcionEliminacion }}</p></q-card-section
      >
      <q-card-actions align="right"
        ><q-btn class="boton-secundario" flat no-caps label="Cancelar" v-close-popup /><q-btn
          class="boton-peligro"
          flat
          no-caps
          :loading="clientesStore.guardando"
          label="Eliminar cliente"
          @click="eliminarCliente"
      /></q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="confirmarAbandono" persistent>
    <q-card class="dialogo-confirmacion">
      <q-card-section>
        <h2 class="titulo-seccion">Cambios sin guardar</h2>
        <p class="texto-secundario">¿Salir y descartar los cambios del cliente?</p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          class="boton-secundario"
          flat
          no-caps
          label="Seguir editando"
          @click="responderAbandono(false)"
        />
        <q-btn
          class="boton-peligro"
          flat
          no-caps
          label="Descartar cambios"
          @click="responderAbandono(true)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
