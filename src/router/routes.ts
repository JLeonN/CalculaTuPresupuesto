import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'inicio',
        component: () => import('@/pages/IndexPage.vue'),
      },
      {
        path: 'presupuestos',
        name: 'presupuestos',
        component: () => import('@/pages/PresupuestosPage.vue'),
      },
      {
        path: 'presupuestos/nuevo',
        name: 'nuevo-presupuesto',
        component: () => import('@/pages/NuevoPresupuestoPage.vue'),
      },
      {
        path: 'presupuestos/nuevo/vista-previa',
        name: 'vista-previa-nuevo-presupuesto',
        component: () => import('@/pages/VistaPreviaPresupuestoPage.vue'),
      },
      {
        path: 'presupuestos/:idPresupuesto/vista-previa',
        name: 'vista-previa-presupuesto',
        component: () => import('@/pages/VistaPreviaPresupuestoPage.vue'),
      },
      {
        path: 'presupuestos/:idPresupuesto/editar',
        name: 'editar-presupuesto',
        component: () => import('@/pages/NuevoPresupuestoPage.vue'),
      },
      {
        path: 'presupuestos/:idPresupuesto',
        name: 'detalle-presupuesto',
        component: () => import('@/pages/NuevoPresupuestoPage.vue'),
      },
      {
        path: 'clientes',
        name: 'clientes',
        component: () => import('@/pages/ClientesPage.vue'),
      },
      {
        path: 'clientes/nuevo',
        name: 'nuevo-cliente',
        component: () => import('@/pages/ClienteFormularioPage.vue'),
      },
      {
        path: 'clientes/:idCliente/editar',
        name: 'editar-cliente',
        component: () => import('@/pages/ClienteFormularioPage.vue'),
      },
      {
        path: 'clientes/:idCliente',
        name: 'detalle-cliente',
        component: () => import('@/pages/ClienteDetallePage.vue'),
      },
      {
        path: 'materiales',
        name: 'materiales',
        component: () => import('@/pages/MaterialesPage.vue'),
      },
      {
        path: 'materiales/nuevo',
        name: 'nuevo-material',
        component: () => import('@/pages/MaterialFormularioPage.vue'),
      },
      {
        path: 'materiales/:idMaterial/editar',
        name: 'editar-material',
        component: () => import('@/pages/MaterialFormularioPage.vue'),
      },
      {
        path: 'materiales/:idMaterial',
        name: 'detalle-material',
        component: () => import('@/pages/MaterialDetallePage.vue'),
      },
      {
        path: 'configuracion',
        name: 'configuracion',
        component: () => import('@/pages/ConfiguracionPage.vue'),
      },
      {
        path: 'mas',
        name: 'mas',
        component: () => import('@/pages/MasPage.vue'),
      },
    ],
  },

  { path: '/:catchAll(.*)*', redirect: '/' },
];

export default routes;
