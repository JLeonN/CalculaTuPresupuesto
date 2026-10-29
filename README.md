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

## Copias de seguridad

En **Configuración > Seguridad**, una sesión iniciada permite descargar o importar una copia JSON. Incluye todos los clientes, materiales, presupuestos y la configuración que se haya guardado, con sus identificadores y datos anidados. No incluye la sesión, las credenciales de acceso ni preferencias de interfaz.

La importación compara identificadores y agrega solamente registros faltantes. Si un cliente, material o presupuesto ya existe, conserva el registro local completo, aunque la copia tenga otra versión de sus datos. Tampoco borra los registros locales que no aparecen en el archivo. Antes de importar muestra un resumen y pide confirmación. Una importación interrumpida se puede repetir con el mismo archivo para completar lo pendiente.

En Android se debe elegir un destino externo desde la hoja de compartir, por ejemplo Archivos o una unidad propia. Una copia que solo permanezca dentro de la aplicación puede perderse al desinstalarla. El JSON contiene teléfonos y puede contener datos bancarios: guardarlo en un lugar privado. El formato de respaldo tiene versión propia y no depende de las claves locales; el futuro plan de Firebase deberá leerlo bajo el `uid` autenticado y con reglas de acceso, sin instalar Firebase en este módulo.

## Publicidad AdMob en Android

El banner inferior se solicita únicamente para visitantes de Android, después de consultar el consentimiento. La SPA web y las sesiones iniciadas no solicitan anuncios. El ID de aplicación Android (`ca-app-pub-7620083100302566~7742704663`) está en el manifiesto mediante `admob_app_id`; la unidad del banner (`ca-app-pub-7620083100302566/2220669269`) y la unidad oficial de prueba están en `src/configuracion/configuracionPublicidad.ts`. El ID de editor es `pub-7620083100302566`.

`PUBLICIDAD_DE_PRUEBA = true` debe mantenerse para las APK de prueba. Antes de generar un AAB de publicación, Leo debe cambiarlo a `false` y recompilar. Toda unidad futura, incluidos los formatos de video, debe aportar sus IDs real y de demostración a `obtenerConfiguracionSolicitudPublicidad`; este booleano seguirá siendo el único interruptor global.

El plugin `@capacitor-community/admob` está instalado en los paquetes raíz y `src-capacitor`. Antes de compilar Android, queda pendiente ejecutar `npx cap sync android` desde `src-capacitor` para registrar el plugin nativo.

`app-ads.txt` sigue pendiente por decisión de Leo. Cuando defina el sitio del desarrollador en Play, deberá publicar en su raíz un archivo con esta línea y pulsar «Verificar si hay actualizaciones» en AdMob:

```text
google.com, pub-7620083100302566, DIRECT, f08c47fec0942fa0
```

Antes de subir una versión con publicidad, Leo debe revisar en Play Console «Seguridad de los datos», los mensajes de privacidad y la política de privacidad. La declaración anterior de «No se recopilan datos» podría dejar de ser correcta.

Para probar el banner también es necesario configurar y publicar al menos un formulario de consentimiento para esta aplicación en AdMob. Sin él, `requestConsentInfo()` devuelve `Publisher misconfiguration` y la app no solicita el anuncio, incluso en modo de prueba.
