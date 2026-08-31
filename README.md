# Calcula tu presupuesto

Aplicación responsive para crear, calcular, guardar y compartir presupuestos profesionales desde navegador y Android. El nombre y el logo de cada empresa se configuran dentro de la aplicación.

## Stack

- Quasar CLI y Vite.
- Vue 3 con Composition API y `<script setup>`.
- TypeScript estricto.
- Vue Router en modo hash y Pinia.
- Capacitor 8 para Android.
- Modo oscuro permanente.

## Rutas importantes

- `src/css/Variables.css`: fuente única de decisiones visuales reutilizables.
- `src/pages/IndexPage.vue`: pantalla inicial mínima.
- `src-capacitor/`: proyecto nativo; el identificador Android es `com.calculatupresupuesto.app`.
- `.github/workflows/deploy-pages.yml`: compilación y despliegue de `dist/spa` en GitHub Pages.
- `Planes/`: planes ejecutables y registro de evolución del proyecto.
- `C:/Z-Programacion/SolucionesAMedida/Clientes/MallicTesla`: contexto comercial, separado del código.

`src/assets/LogoCalculaTuPresupuesto.png` es el logo predeterminado del producto. `src/assets/LogoMallicTeslaOriginal.jpg` se conserva únicamente como referencia histórica y no forma parte de la identidad visible.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npm run dev:android
npm run build:android
```

`npm run build` genera la SPA en `dist/spa` con ruta pública `/CalculaTuPresupuesto/`. Desarrollo y Capacitor mantienen `/` como ruta pública.

## GitHub Pages

El workflow se ejecutará al publicar cambios en `main`. En GitHub se debe seleccionar **Settings > Pages > Build and deployment > GitHub Actions** si la configuración no se activa automáticamente.

El repositorio definitivo es `https://github.com/JLeonN/CalculaTuPresupuesto`. CH no crea commits ni ejecuta push; Leo decide cuándo versionar y publicar los cambios.

## Arquitectura futura aprobada

Firebase se incorporará únicamente en su propio plan. La arquitectura prevista incluye Google Login con Firebase Authentication, Cloud Firestore compartido entre Android y web, persistencia offline, sincronización al recuperar conexión y aislamiento de los datos por cuenta autenticada. Firebase todavía no está instalado.

La identidad visual reutilizable se mantiene centralizada en `src/css/Variables.css`.

## Acceso provisional de pruebas

Durante la etapa de pruebas, toda persona puede usar los módulos y guardar datos localmente. La descarga, impresión y entrega de presupuestos requieren iniciar sesión. Sin sesión, la vista previa muestra la marca `VERSIÓN DE PRUEBA`.

Leo debe crear manualmente el archivo local `C:/Z-Programacion/Quasar/CalculaTuPresupuesto/.env.local` con este contrato:

```env
QCLI_USUARIO_PRUEBA=
QCLI_CONTRASENA_PRUEBA=
```

Los valores no deben escribirse en `.env.example` ni en otro archivo versionado. Después de modificarlos es necesario reiniciar el servidor de desarrollo o recompilar la SPA y Android.

Este acceso es provisional: Quasar incorpora las variables al código cliente, por lo que no constituyen secretos ni seguridad apta para producción. La futura integración con Firebase sustituirá `ServicioAutenticacionPrueba` desde `crearServicioAutenticacion()` y conservará el store y la interfaz actuales. Firebase deberá resolver cuentas, revocación, aislamiento por `uid` y reglas remotas antes de comercializar la aplicación.

## Evolución funcional

Cada módulo tendrá un plan ejecutable propio y no debe implementarse
improvisadamente desde el plan maestro. Orden recomendado:

1. Base visual y navegación.
2. Clientes y catálogo de materiales.
3. Creación y cálculo de presupuestos.
4. PDF configurable y envío por WhatsApp.
5. Adicionales y aceptación del cliente.
6. Persistencia, sincronización, Google Login y seguridad con Firebase.

Ya existen implementaciones locales de clientes, materiales, presupuestos, configuración, PDF y envío por WhatsApp. Los módulos restantes deben continuar mediante planes independientes.

## Identidad técnica y almacenamiento

El paquete npm usa `calcula-tu-presupuesto`, la ruta pública es `/CalculaTuPresupuesto/` y Android usa `com.calculatupresupuesto.app`.

Los repositorios locales escriben bajo claves `calcula-tu-presupuesto:*`. Durante la lectura, un adaptador privado reconoce las claves históricas `mallic-tesla:*`, copia su contenido exacto, verifica la copia y solo entonces elimina la clave anterior.
