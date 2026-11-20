import { createApp, h, defineComponent, type Component } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import { Quasar, Notify, Dialog } from 'quasar';
import * as elementosQuasar from 'quasar';
import 'quasar/dist/quasar.css';
import '@quasar/extras/material-icons/material-icons.css';
import '../../src/css/Variables.css';
import '../../src/css/app.css';
import App from '../../src/App.vue';
import routes from '../../src/router/routes';
import { useAutenticacionStore } from '../../src/stores/autenticacion';
import { useSuscripcionStore } from '../../src/stores/suscripcion';
import { panelAislado } from 'virtual:panel-suscripcion-aislado';
import type { EstadoSuscripcion } from '../../src/dominio/suscripcion';

if (!panelAislado) throw new Error('La vista requiere el servidor de prueba aislado.');
const pinia = createPinia();
const router = createRouter({ history: createWebHashHistory(), routes });
const ventana = window as typeof window & { __estadoFicticio: EstadoSuscripcion };
const aplicacion = createApp(
  defineComponent({
    setup() {
      const autenticacion = useAutenticacionStore(pinia);
      const suscripcion = useSuscripcionStore(pinia);
      autenticacion.inicializada = true;
      async function seleccionar(tipo: 'gratis' | 'prueba' | 'pro' | 'exento') {
        autenticacion.usuario = {
          id: 'cuenta-ficticia',
          nombre: 'Prueba',
          correo: null,
          correoVerificado: true,
          proveedores: [],
          proveedor: 'firebase',
        };
        ventana.__estadoFicticio =
          tipo === 'pro' || tipo === 'prueba'
            ? { tipo, vencimiento: Date.now() + 86400000 }
            : { tipo };
        await suscripcion.cargar('cuenta-ficticia');
      }
      void seleccionar('gratis');
      return () =>
        h('div', [
          h(
            'nav',
            {
              'aria-label': 'Prueba de estados',
              style: 'position:fixed;top:0;right:0;z-index:10000;background:white',
            },
            (['gratis', 'prueba', 'pro', 'exento'] as const).map((tipo) =>
              h(
                'button',
                { type: 'button', onClick: () => void seleccionar(tipo) },
                `Simular ${tipo}`,
              ),
            ),
          ),
          h(App),
        ]);
    },
  }),
);
const componentes = Object.fromEntries(
  Object.entries(elementosQuasar).filter(
    ([nombre, valor]) => /^Q[A-Z]/.test(nombre) && typeof valor === 'object',
  ),
);
for (const [nombre, componente] of Object.entries(componentes))
  aplicacion.component(nombre, componente as Component);
aplicacion
  .use(pinia)
  .use(router)
  .use(Quasar, { config: { dark: true }, plugins: { Notify, Dialog } });
aplicacion.mount('#app');
