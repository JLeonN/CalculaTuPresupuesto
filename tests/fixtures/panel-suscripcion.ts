import { createApp, defineComponent, h, ref } from 'vue';
import { createPinia } from 'pinia';
import {
  Notify,
  QBanner,
  QBtn,
  QCard,
  QCardActions,
  QCardSection,
  QDialog,
  QIcon,
  Quasar,
} from 'quasar';
import 'quasar/dist/quasar.css';
import '@quasar/extras/material-icons/material-icons.css';
import '../../src/css/Variables.css';
import '../../src/css/app.css';
import PanelSuscripcion from '../../src/components/suscripcion/PanelSuscripcion.vue';
import PanelCopiasSeguridad from '../../src/components/configuracion/PanelCopiasSeguridad.vue';
import { useAutenticacionStore } from '../../src/stores/autenticacion';
import { useSuscripcionStore } from '../../src/stores/suscripcion';
import type { EstadoSuscripcion } from '../../src/dominio/suscripcion';
import { panelAislado } from 'virtual:panel-suscripcion-aislado';

if (!panelAislado) throw new Error('La vista requiere el servidor de prueba aislado.');

const ESTADOS: {
  nombre: string;
  estado: EstadoSuscripcion;
  visitante?: boolean;
  error?: string;
}[] = [
  { nombre: 'Visitante', estado: { tipo: 'pendiente' }, visitante: true },
  { nombre: 'Gratis', estado: { tipo: 'gratis' } },
  { nombre: 'Prueba', estado: { tipo: 'prueba', vencimiento: Date.UTC(2030, 0, 2) } },
  { nombre: 'Pro', estado: { tipo: 'pro', vencimiento: Date.UTC(2030, 0, 2) } },
  { nombre: 'Exento', estado: { tipo: 'exento' } },
  { nombre: 'Pendiente', estado: { tipo: 'pendiente' } },
  {
    nombre: 'Sin conexión',
    estado: { tipo: 'pendiente' },
    error: 'No se pudo verificar la suscripción. Comprobá la conexión e intentá nuevamente.',
  },
];

const pinia = createPinia();
const aplicacion = createApp(
  defineComponent({
    setup() {
      const autenticacion = useAutenticacionStore();
      const suscripcion = useSuscripcionStore();
      autenticacion.inicializada = true;
      const seleccionado = ref('');
      function seleccionar(opcion: (typeof ESTADOS)[number]): void {
        seleccionado.value = opcion.nombre;
        autenticacion.usuario = opcion.visitante
          ? null
          : {
              id: 'usuario-sintetico',
              nombre: 'Cuenta de prueba',
              correo: null,
              correoVerificado: true,
              proveedores: [],
              proveedor: 'firebase',
            };
        suscripcion.estado = opcion.estado;
        suscripcion.error = opcion.error ?? null;
      }
      seleccionar(ESTADOS[0]!);
      return () =>
        h('main', { class: 'q-pa-md' }, [
          h('h1', { class: 'text-h5' }, 'Vista aislada de suscripción'),
          h('p', 'Datos ficticios; sin conexión a Firebase ni compras.'),
          h(
            'nav',
            { class: 'row q-gutter-sm', 'aria-label': 'Estados simulados' },
            ESTADOS.map((opcion) =>
              h(
                'button',
                {
                  type: 'button',
                  'aria-pressed': seleccionado.value === opcion.nombre,
                  onClick: () => seleccionar(opcion),
                },
                opcion.nombre,
              ),
            ),
          ),
          h('div', { class: 'q-mt-lg' }, [h(PanelSuscripcion)]),
          h('div', { class: 'q-mt-lg' }, [
            h(PanelCopiasSeguridad, {
              cambiosPendientes: false,
              actualizarDatos: async () => {},
            }),
          ]),
        ]);
    },
  }),
);
aplicacion.use(pinia);
aplicacion.use(Quasar, {
  components: { QBanner, QBtn, QCard, QCardActions, QCardSection, QDialog, QIcon },
  plugins: { Notify },
});
aplicacion.mount('#app');
