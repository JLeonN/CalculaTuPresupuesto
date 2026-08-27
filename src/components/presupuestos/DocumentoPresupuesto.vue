<script setup lang="ts">
import { computed, ref } from 'vue';
import { LOGO_PREDETERMINADO, NOMBRE_APLICACION } from '@/configuracion/identidadAplicacion';
import { formatearImporte, formatearNumero } from '@/dominio/monedas';
import {
  calcularSubtotalLinea,
  calcularTotalManoObraYTraslado,
  calcularTotalMateriales,
  calcularTotalPresupuesto,
  lineaTieneMonedaCompatible,
  type ConfiguracionDocumentoPresupuesto,
  type DatosPresupuesto,
} from '@/dominio/presupuestos';

const props = withDefaults(
  defineProps<{
    datos: DatosPresupuesto;
    configuracion: ConfiguracionDocumentoPresupuesto;
    oculto?: boolean;
    modoPrueba?: boolean;
  }>(),
  {
    oculto: false,
    modoPrueba: false,
  },
);

const elementoDocumento = ref<HTMLElement | null>(null);
const nombreEmpresa = computed(() => props.configuracion.nombreEmpresa.trim() || NOMBRE_APLICACION);
const logoEmpresa = computed(() => props.configuracion.logo?.datosUrl || LOGO_PREDETERMINADO);
const lineasMateriales = computed(() =>
  props.datos.lineas.filter((linea) => linea.tipo === 'material'),
);
const totalManoObraYTraslado = computed(() =>
  calcularTotalManoObraYTraslado(props.datos.lineas, props.datos.moneda),
);
const totalMateriales = computed(() =>
  calcularTotalMateriales(props.datos.lineas, props.datos.moneda),
);
const total = computed(() => calcularTotalPresupuesto(props.datos.lineas, props.datos.moneda));
const cantidadMonedasIncompatibles = computed(
  () =>
    props.datos.lineas.filter((linea) => !lineaTieneMonedaCompatible(linea, props.datos.moneda))
      .length,
);

function obtenerElemento(): HTMLElement | null {
  return elementoDocumento.value;
}

function crearEnlaceRedSocial(red: string, usuarioOEnlace: string): string {
  const valor = usuarioOEnlace.trim();

  if (/^https?:\/\//i.test(valor)) {
    return valor;
  }

  const usuario = valor.replace(/^@/, '');
  const nombreRed = red.trim().toLowerCase();

  if (nombreRed.includes('instagram')) return `https://www.instagram.com/${usuario}`;
  if (nombreRed.includes('facebook')) return `https://www.facebook.com/${usuario}`;
  if (nombreRed.includes('tiktok')) return `https://www.tiktok.com/@${usuario}`;
  if (nombreRed === 'x' || nombreRed.includes('twitter')) return `https://x.com/${usuario}`;
  if (nombreRed.includes('youtube')) return `https://www.youtube.com/@${usuario}`;
  if (nombreRed.includes('linkedin')) return `https://www.linkedin.com/in/${usuario}`;

  return `https://${valor}`;
}

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;
}

function formatearCantidad(cantidad: number | null): string {
  return formatearNumero(cantidad ?? 0);
}

defineExpose({ obtenerElemento });
</script>

<template>
  <article
    ref="elementoDocumento"
    class="documento-presupuesto"
    :class="{
      'documento-presupuesto--oculto': oculto,
      'documento-presupuesto--modo-prueba': modoPrueba,
    }"
    :aria-hidden="oculto || undefined"
    :inert="oculto || undefined"
    :aria-label="oculto ? undefined : 'Presupuesto listo para imprimir'"
  >
    <span v-if="modoPrueba" class="documento-presupuesto__marca-prueba" aria-hidden="true">
      VERSIÓN DE PRUEBA
    </span>

    <header class="documento-presupuesto__encabezado">
      <div class="documento-presupuesto__marca">
        <img :src="logoEmpresa" :alt="`Logo de ${nombreEmpresa}`" />
        <dl class="documento-presupuesto__datos-empresa">
          <div>
            <dt>Empresa</dt>
            <dd>{{ nombreEmpresa }}</dd>
          </div>
          <div v-if="configuracion.nombreResponsable">
            <dt>Nombre</dt>
            <dd>{{ configuracion.nombreResponsable }}</dd>
          </div>
          <div v-if="configuracion.telefono">
            <dt>Teléfono</dt>
            <dd>{{ configuracion.telefono }}</dd>
          </div>
          <div v-if="configuracion.correo">
            <dt>Email</dt>
            <dd>{{ configuracion.correo }}</dd>
          </div>
          <div v-if="configuracion.direccion">
            <dt>Dirección</dt>
            <dd>{{ configuracion.direccion }}</dd>
          </div>
          <div v-if="configuracion.rut">
            <dt>RUT</dt>
            <dd>{{ configuracion.rut }}</dd>
          </div>
        </dl>
      </div>

      <div class="documento-presupuesto__identificacion">
        <span>Presupuesto</span>
        <strong>{{ formatearFecha(datos.fechaPresupuesto) }}</strong>
        <small>Moneda: {{ datos.moneda }}</small>
      </div>
    </header>

    <section class="documento-presupuesto__seccion documento-presupuesto__cliente">
      <p class="documento-presupuesto__etiqueta">Cliente</p>
      <div>
        <strong>{{ datos.destinatario.nombre || 'Cliente' }}</strong>
        <span v-if="datos.destinatario.telefono">{{ datos.destinatario.telefono }}</span>
      </div>
    </section>

    <section class="documento-presupuesto__seccion">
      <p class="documento-presupuesto__etiqueta">Detalle del presupuesto</p>
      <div class="documento-presupuesto__tabla-contenedor">
        <table class="documento-presupuesto__tabla">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="linea in lineasMateriales"
              :key="linea.id"
              :class="{
                'documento-presupuesto__linea--incompatible': !lineaTieneMonedaCompatible(
                  linea,
                  datos.moneda,
                ),
              }"
            >
              <td>{{ linea.nombre || 'Sin descripción' }}</td>
              <td>{{ formatearCantidad(linea.cantidad) }} {{ linea.unidad }}</td>
              <td>{{ formatearImporte(linea.precioUnitario ?? 0, linea.moneda) }}</td>
              <td>{{ formatearImporte(calcularSubtotalLinea(linea), linea.moneda) }}</td>
            </tr>
            <tr>
              <td>Mano de obra</td>
              <td aria-label="Sin cantidad"></td>
              <td aria-label="Sin precio unitario"></td>
              <td>{{ formatearImporte(totalManoObraYTraslado, datos.moneda) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="cantidadMonedasIncompatibles" class="documento-presupuesto__advertencia">
        {{ cantidadMonedasIncompatibles }} concepto(s) en otra moneda no se incluyen en los totales.
      </p>
    </section>

    <section class="documento-presupuesto__totales" aria-label="Totales del presupuesto">
      <div>
        <span>Mano de obra</span>
        <strong>{{ formatearImporte(totalManoObraYTraslado, datos.moneda) }}</strong>
      </div>
      <div>
        <span>Materiales</span>
        <strong>{{ formatearImporte(totalMateriales, datos.moneda) }}</strong>
      </div>
      <div class="documento-presupuesto__total-final">
        <span>Total</span>
        <strong>{{ formatearImporte(total, datos.moneda) }}</strong>
      </div>
    </section>

    <section v-if="configuracion.metodosPago.length" class="documento-presupuesto__seccion">
      <p class="documento-presupuesto__etiqueta">Métodos de pago</p>
      <div class="documento-presupuesto__metodos-pago">
        <div v-for="metodo in configuracion.metodosPago" :key="metodo.id">
          <strong>{{ metodo.nombre || 'Forma de pago' }}</strong>
          <span v-if="metodo.numeroCuenta">{{ metodo.numeroCuenta }}</span>
        </div>
      </div>
    </section>

    <section v-if="configuracion.mensajeFinal" class="documento-presupuesto__mensaje-final">
      <p>{{ configuracion.mensajeFinal }}</p>
    </section>

    <footer v-if="configuracion.redesSociales.length" class="documento-presupuesto__redes">
      <a
        v-for="redSocial in configuracion.redesSociales"
        :key="redSocial.id"
        :href="crearEnlaceRedSocial(redSocial.red, redSocial.usuarioOEnlace)"
        target="_blank"
        rel="noopener noreferrer"
      >
        <strong>{{ redSocial.red }}</strong>
        <span>{{ redSocial.usuarioOEnlace }}</span>
      </a>
    </footer>
  </article>
</template>
