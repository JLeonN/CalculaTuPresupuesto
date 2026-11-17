<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Capacitor } from '@capacitor/core';
import { useAutenticacionStore } from '@/stores/autenticacion';
import { useSuscripcionStore } from '@/stores/suscripcion';
import { consultarConfiguracionCompra } from '@/servicios/suscripcion/servicioSuscripcion';
import {
  comprarSuscripcionAndroid,
  consultarProductoAndroid,
  gestionarSuscripcionAndroid,
  recuperarComprasAndroid,
} from '@/servicios/suscripcion/servicioComprasAndroid';

const autenticacion = useAutenticacionStore();
const suscripcion = useSuscripcionStore();
const esAndroid = Capacitor.getPlatform() === 'android';
const ocupado = ref(false);
const mensaje = ref<string | null>(null);
const producto = ref<Awaited<ReturnType<typeof consultarProductoAndroid>> | null>(null);
const estadoVisible = computed(
  () =>
    ({
      gratis: 'Plan Gratis',
      prueba: 'Prueba Pro',
      pro: 'Plan Pro',
      exento: 'Pro',
      pendiente: 'Verificando suscripción',
    })[suscripcion.estado.tipo],
);
const fecha = computed(() => {
  const estado = suscripcion.estado;
  if (estado.tipo !== 'prueba' && estado.tipo !== 'pro') return null;
  const fechaVencimiento = new Date(estado.vencimiento);
  return Number.isFinite(fechaVencimiento.getTime())
    ? new Intl.DateTimeFormat('es-UY', { dateStyle: 'long' }).format(fechaVencimiento)
    : null;
});

watch(
  () => autenticacion.usuario?.id,
  () => {
    producto.value = null;
    mensaje.value = null;
  },
);

async function cargarPrecio(): Promise<void> {
  const uid = autenticacion.usuario?.id;
  if (!uid || !esAndroid || ocupado.value) return;
  ocupado.value = true;
  mensaje.value = null;
  try {
    const configuracion = await consultarConfiguracionCompra();
    const resultado = await consultarProductoAndroid(configuracion.producto, configuracion.plan);
    if (autenticacion.usuario?.id === uid) producto.value = resultado;
  } catch {
    if (autenticacion.usuario?.id === uid)
      mensaje.value = 'No se pudo consultar el precio en Google Play. Intentá nuevamente.';
  } finally {
    ocupado.value = false;
  }
}

async function comprar(): Promise<void> {
  const uid = autenticacion.usuario?.id;
  if (!uid || !producto.value || ocupado.value) return;
  ocupado.value = true;
  mensaje.value = null;
  try {
    const resultado = await comprarSuscripcionAndroid(uid, producto.value);
    if (autenticacion.usuario?.id !== uid) return;
    mensaje.value =
      resultado === 'pendiente'
        ? 'La compra está pendiente de confirmación de Google Play.'
        : 'La compra se verificó correctamente.';
    if (resultado === 'verificada') await suscripcion.cargar(uid);
  } catch {
    if (autenticacion.usuario?.id === uid)
      mensaje.value = 'No se pudo completar o verificar la compra. Intentá nuevamente.';
  } finally {
    ocupado.value = false;
  }
}

async function recuperar(): Promise<void> {
  const uid = autenticacion.usuario?.id;
  if (!uid || ocupado.value) return;
  ocupado.value = true;
  mensaje.value = null;
  try {
    const { producto: idProducto } = await consultarConfiguracionCompra();
    const cantidad = await recuperarComprasAndroid(uid, idProducto);
    if (autenticacion.usuario?.id !== uid) return;
    mensaje.value = cantidad
      ? 'Se verificó la compra de esta cuenta.'
      : 'No se encontraron compras para recuperar.';
    if (cantidad) await suscripcion.cargar(uid);
  } catch {
    if (autenticacion.usuario?.id === uid)
      mensaje.value = 'No se pudieron recuperar las compras. Intentá nuevamente.';
  } finally {
    ocupado.value = false;
  }
}

async function gestionar(): Promise<void> {
  try {
    await gestionarSuscripcionAndroid();
  } catch {
    mensaje.value = 'No se pudo abrir la gestión de Google Play.';
  }
}
</script>

<template>
  <section aria-label="Suscripción">
    <h2 class="titulo-seccion">Suscripción</h2>
    <p v-if="!autenticacion.estaAutenticado">
      Iniciá sesión para comenzar tu prueba Pro de 10 días, sin tarjeta.
    </p>
    <template v-else>
      <p>
        <strong>{{ estadoVisible }}</strong
        ><span v-if="fecha"> · Hasta el {{ fecha }}</span>
      </p>
      <p v-if="suscripcion.estado.tipo === 'prueba'">
        Tu prueba no requiere tarjeta. Al terminar, pasarás al plan Gratis si no te suscribís.
      </p>
      <p>Pro permite descargar, enviar e imprimir presupuestos sin marca y elimina los anuncios.</p>
      <p v-if="!esAndroid">
        Para contratar Pro, abrí la aplicación Android e iniciá sesión con esta misma cuenta.
      </p>
      <template v-else>
        <p v-if="producto">
          {{ producto.precio }} al mes. La suscripción se renueva automáticamente; podés cancelarla
          en Google Play.
        </p>
        <q-btn
          v-if="!producto"
          flat
          no-caps
          label="Consultar precio"
          :loading="ocupado"
          @click="cargarPrecio"
        />
        <q-btn
          v-else
          unelevated
          no-caps
          label="Suscribirme con Google Play"
          :loading="ocupado"
          @click="comprar"
        />
        <q-btn flat no-caps label="Recuperar compra" :disable="ocupado" @click="recuperar" />
        <q-btn flat no-caps label="Gestionar suscripción" :disable="ocupado" @click="gestionar" />
      </template>
      <p v-if="suscripcion.error" role="alert">{{ suscripcion.error }}</p>
      <q-btn
        v-if="suscripcion.error && autenticacion.usuario"
        flat
        no-caps
        label="Reintentar"
        @click="suscripcion.cargar(autenticacion.usuario.id)"
      />
      <p v-if="mensaje" role="status">{{ mensaje }}</p>
    </template>
  </section>
</template>
