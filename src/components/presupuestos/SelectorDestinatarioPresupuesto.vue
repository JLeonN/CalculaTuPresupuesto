<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { obtenerTelefonoPrincipal, type Cliente } from '@/dominio/clientes';
import type { TipoDestinatario } from '@/dominio/presupuestos';

const props = defineProps<{
  clientes: Cliente[];
  cargando: boolean;
  soloLectura?: boolean;
}>();

const tipo = defineModel<TipoDestinatario>('tipo', { required: true });
const idCliente = defineModel<string | null>('idCliente', { required: true });
const nombre = defineModel<string>('nombre', { required: true });
const telefono = defineModel<string>('telefono', { required: true });

const terminoBusqueda = ref('');

const opcionesTipo = [
  { label: 'Potencial cliente', value: 'potencial' },
  { label: 'Cliente guardado', value: 'guardado' },
];

const opcionesClientes = computed(() => {
  const termino = terminoBusqueda.value.trim().toLocaleLowerCase('es');
  const clientes = termino
    ? props.clientes.filter((cliente) =>
        [
          cliente.nombre,
          ...cliente.telefonos.map((telefonoCliente) => telefonoCliente.numero),
          ...cliente.locales.flatMap((local) => [local.nombre, local.direccion]),
        ].some((dato) => dato.toLocaleLowerCase('es').includes(termino)),
      )
    : props.clientes;

  return clientes.map((cliente) => ({
    label: cliente.nombre,
    value: cliente.id,
    caption: obtenerTelefonoPrincipal(cliente)?.numero ?? 'Sin teléfono',
  }));
});

watch(tipo, (tipoActual) => {
  if (tipoActual === 'potencial') {
    idCliente.value = null;
  }
});

watch(idCliente, (idClienteActual) => {
  if (tipo.value !== 'guardado' || idClienteActual === null) {
    return;
  }

  const cliente = props.clientes.find((clienteActual) => clienteActual.id === idClienteActual);
  if (cliente === undefined) {
    return;
  }

  nombre.value = cliente.nombre;
  telefono.value = obtenerTelefonoPrincipal(cliente)?.numero ?? '';
});
</script>

<template>
  <section
    class="seccion-formulario destinatario-presupuesto"
    :class="{ 'destinatario-presupuesto--lectura': soloLectura }"
    aria-labelledby="titulo-destinatario"
  >
    <div class="encabezado-seccion-formulario">
      <div>
        <p class="etiqueta-seccion">Destinatario</p>
        <h2 id="titulo-destinatario" class="titulo-seccion">Cliente</h2>
        <p v-if="!soloLectura" class="texto-secundario texto-ayuda-formulario">
          Usá el nombre del cliente, comercio o referencia que prefieras.
        </p>
      </div>
    </div>

    <div v-if="soloLectura" class="destinatario-presupuesto__lectura">
      <strong>{{ nombre || 'Sin nombre' }}</strong>
      <span>{{ telefono || 'Sin teléfono' }}</span>
    </div>

    <template v-else>
      <q-btn-toggle
        v-model="tipo"
        class="selector-tipo-destinatario"
        no-caps
        spread
        unelevated
        toggle-color="primary"
        :options="opcionesTipo"
        :disable="soloLectura"
      />

      <q-select
        v-if="tipo === 'guardado' && !soloLectura"
        v-model="idCliente"
        dark
        outlined
        behavior="menu"
        menu-anchor="bottom left"
        menu-self="top left"
        popup-content-class="selector-opciones"
        clearable
        emit-value
        map-options
        use-input
        input-debounce="100"
        label="Buscar cliente guardado"
        :loading="cargando"
        :options="opcionesClientes"
        :readonly="soloLectura"
        @input-value="terminoBusqueda = $event"
      >
        <template #no-option>
          <q-item>
            <q-item-section class="texto-secundario">No encontramos clientes.</q-item-section>
          </q-item>
        </template>
      </q-select>

      <div class="campos-destinatario-presupuesto">
        <q-input
          v-model="nombre"
          dark
          outlined
          label="Nombre, comercio o referencia"
          autocomplete="name"
          :readonly="soloLectura"
        />
        <q-input
          v-model="telefono"
          dark
          outlined
          type="tel"
          label="Teléfono (opcional)"
          autocomplete="tel"
          :readonly="soloLectura"
        />
      </div>
    </template>
  </section>
</template>
