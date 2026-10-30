# Plan de Firebase para cuentas y datos en entorno de pruebas

## Descripción del plan

Incorporar Firebase a Calcula tu presupuesto en un entorno de desarrollo separado de la aplicación Android que ya está en producción. La misma cuenta debe identificar al usuario en Android y web y sincronizar sus datos privados. Este plan ejecuta pruebas con cuentas y datos sintéticos; no cambia el despliegue público ni migra datos reales de Pablo. La prueba gratuita y los cobros tendrán un plan posterior.

## Objetivo principal

- Sustituir el acceso provisional por registro e inicio de sesión con correo/contraseña y Google, recuperación de contraseña y sesión persistente.
- Guardar clientes, materiales, presupuestos y configuración por `uid` en Firestore con reglas cerradas y sincronización entre Android y web.
- Conservar durante estas pruebas el comportamiento actual: una cuenta iniciada puede Descargar, Imprimir y Enviar; los visitantes no pueden hacerlo. Las copias JSON siguen disponibles para cuentas autenticadas.

## Contexto técnico verificado

- `AGENTS.md` exige aprobación antes de implementar y prohíbe ejecutar la app, pruebas, compilaciones o linters sin pedido de Leo. Leo ya pidió pruebas para este trabajo; la IA ejecutora puede realizar la FASE TESTING al ejecutar este plan sin volver a pedir autorización. No hacer `git add`, commit ni push.
- Quasar CLI, Vue 3, TypeScript estricto, Pinia, router hash y Capacitor 8 comparten `src/`. Android conserva `com.calculatupresupuesto.app`; la SPA de producción se publica en GitHub Pages desde `.github/workflows/deploy-pages.yml`.
- `src/servicios/autenticacion/crearServicioAutenticacion.ts` crea `ServicioAutenticacionPrueba` con variables `QCLI_*`. `src/stores/autenticacion.ts` equipara `puedeGenerarSalidaPresupuesto` con `estaAutenticado`.
- `src/pages/VistaPreviaPresupuestoPage.vue` y `src/pages/NuevoPresupuestoPage.vue` usan ese permiso; `src/servicios/documentos/accionesPresupuesto.ts` vuelve a validar Descargar y Enviar. `MainLayout.vue` y las vistas previas usan `estaAutenticado` para el modo de prueba. `PanelCopiasSeguridad.vue` usa `estaAutenticado` para exportar e importar.
- Los cuatro repositorios usan almacenamiento local mediante `crearRepositorioClientes`, `crearRepositorioMateriales`, `crearRepositorioPresupuestos` y `crearRepositorioConfiguracion`. `ServicioRespaldo` y `src/dominio/respaldo.ts` ya ofrecen formato JSON versionado, validación y comparación por ID.
- La configuración y algunas instantáneas de presupuestos contienen el logo como `datosUrl`; el formulario admite imágenes cercanas a 1 MB y un documento de Firestore tiene límite de 1 MiB. La estrategia de imágenes debe resolverse antes de copiar estos registros a Firestore.
- **Riesgo histórico:** `.env.local` estuvo versionado. El release `v0.0.7` lo retira del índice y corrige `.gitignore` sin leer su contenido ni borrar el archivo local. Antes de cargar credenciales o publicar cambios, revisar el historial sin exponer valores.
- Firebase Authentication admite múltiples proveedores vinculados al mismo usuario; las reglas de Firestore pueden aislar por `request.auth.uid`. La caché persistente de Firestore en web no se borra automáticamente al cerrar sesión. Fuentes: [vinculación](https://firebase.google.com/docs/auth/web/account-linking), [reglas](https://firebase.google.com/docs/firestore/security/rules-conditions), [caché](https://firebase.google.com/docs/firestore/manage-data/enable-offline).
- Firestore admite `southamerica-east1` (São Paulo). La ubicación de la base no se cambia después de crearla. Fuente: [ubicaciones](https://firebase.google.com/docs/firestore/enterprise/locations).

## Alcance

### Incluye

- Proyecto Firebase exclusivo de pruebas, configuración de Auth, Firestore, Storage si las imágenes lo requieren, reglas, dominios autorizados y aplicación Android de pruebas con el identificador existente.
- Acceso de la IA ejecutora a Firebase Console o Firebase CLI mediante la sesión de Leo. Leo ya autorizó usar su cuenta para configurar el entorno; permitir que él complete MFA o una pantalla de consentimiento cuando el servicio lo exija. No pedirle contraseñas ni copiarlas a archivos, chat o logs.
- Código para registro, inicio, vinculación de proveedores, recuperación, cierre de sesión, datos por cuenta y migración de copias sintéticas.
- Pruebas de aislamiento, sincronización, recuperación de sesión, desconexión y protección de datos al cambiar de cuenta.
- Actualizar `README.md` y `Memory.md` con hechos duraderos verificados durante la ejecución.

### No incluye

- Prueba gratuita de siete días, control de vencimiento, exención de Pablo, Google Play Billing, Mercado Pago, suscripciones cobradas, webhooks, Cloud Functions ni publicación de una nueva versión en Play.
- Migración o carga de los datos reales de Pablo, alta de su exención en producción, cambio del identificador Android, cambio del despliegue de GitHub Pages ni modificación de precios comerciales.
- Cambios al permiso comercial de Descargar, Imprimir y Enviar. Antes de cobrar, el plan futuro deberá evaluar la protección de un PDF generado íntegramente en el cliente.

## Mapa de cambios

| Archivo                                                                                                                                                                                                                                                                         | Acción                  | Símbolos principales                                      | Propósito                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `.gitignore`, `.env.example`                                                                                                                                                                                                                                                    | Modificar               | reglas `.env*`, contrato `QCLI_FIREBASE_*`                | Evitar versionar valores locales y documentar configuración pública del SDK  |
| `package.json`, `package-lock.json`, `src-capacitor/package.json`, `src-capacitor/package-lock.json`                                                                                                                                                                            | Modificar si procede    | `firebase`, plugin nativo validado                        | Dependencias necesarias para Auth, Firestore y Google en Android             |
| `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`                                                                                                                                                                                    | Crear                   | configuración de entorno y reglas                         | Despliegue reproducible solo al proyecto de pruebas                          |
| `src/configuracion/firebase.ts`, `src/boot/firebase.ts`, `quasar.config.ts`                                                                                                                                                                                                     | Crear/modificar         | `obtenerFirebase`, boot                                   | Inicialización única y orden correcto antes de cargar datos                  |
| `src/dominio/autenticacion.ts`, `src/servicios/autenticacion/ServicioAutenticacion.ts`, `src/servicios/autenticacion/ServicioAutenticacionFirebase.ts`, `src/servicios/autenticacion/crearServicioAutenticacion.ts`, `src/stores/autenticacion.ts`, `src/boot/autenticacion.ts` | Modificar/crear         | usuario por `uid`, registro, sesión                       | Sustituir el acceso provisional sin romper consumidores ni el permiso actual |
| `src/components/autenticacion/ModalInicioSesion.vue`, `src/components/autenticacion/BotonSesion.vue`, `src/css/Variables.css`, `src/css/app.css`                                                                                                                                | Modificar               | formularios de acceso, estados                            | Registro y recuperación responsivos con tokens existentes                    |
| `src/repositorios/{clientes,materiales,presupuestos,configuracion}/Repositorio*Firestore.ts` y sus `crearRepositorio*.ts`                                                                                                                                                       | Crear/modificar         | contratos `Repositorio*` existentes                       | Leer y escribir bajo `uid` sin contaminar cuentas                            |
| `src/stores/clientes.ts`, `src/stores/materiales.ts`, `src/stores/presupuestos.ts`, `src/stores/configuracion.ts`                                                                                                                                                               | Modificar               | carga y limpieza de estado                                | Recargar al cambiar de cuenta y no mostrar datos anteriores                  |
| `src/servicios/respaldo/ServicioRespaldo.ts`, `src/components/configuracion/PanelCopiasSeguridad.vue`, `src/dominio/respaldo.ts`                                                                                                                                                | Modificar si hace falta | importación y exportación                                 | Mantener copias JSON y probar migración idempotente                          |
| `src-capacitor/capacitor.config.ts`, configuración Android de Firebase                                                                                                                                                                                                          | Modificar               | proveedor Google nativo                                   | Autenticar en Android con el mismo `uid` que la web                          |
| `tests/reglasFirestore.test.ts`, `package.json`                                                                                                                                                                                                                                 | Crear/modificar         | casos de autorización y migración, script `test:firebase` | Verificar reglas y contratos con emuladores                                  |
| `README.md`, `Memory.md`                                                                                                                                                                                                                                                        | Modificar               | operación vigente y decisiones duraderas                  | Documentar arquitectura, entorno, límites y recuperación                     |

## FASE 1: Preparar el entorno y cerrar el riesgo de configuración

### Objetivo

Disponer de un proyecto Firebase de pruebas identificable, reproducible y separado de producción, sin credenciales en Git.

### Pasos de ejecución

- [x] Revisar `AGENTS.md`, `README.md`, `Memory.md`, este plan y el estado Git antes de tocar código. Inspeccionar `.env.local` solo localmente si es imprescindible, sin imprimir valores ni copiarlos a respuestas. Determinar si hubo secretos reales en el historial y comunicar a Leo la necesidad de rotarlos si corresponde; no reescribir historial ni hacer commit/push.
- [x] Ignorar todas las variantes locales `.env*` salvo `.env.example`, verificar con `git check-ignore` y retirar `.env.local` del índice sin borrar el archivo local durante el release `v0.0.7` autorizado por Leo. El historial previo todavía requiere revisión antes de cargar credenciales.
- [x] Usar Firebase Console con la sesión de Leo o Firebase CLI autenticada interactivamente en su cuenta; elegir la opción que permita verificar mejor la configuración con menos pasos. Crear un proyecto exclusivo de desarrollo, registrar su ID no secreto en `.firebaserc` y comprobar que no es un proyecto usado por la app publicada. No capturar ni guardar credenciales personales o tokens CLI en el repositorio.
- [x] Antes de crear Firestore, comparar costo y ubicación; usar `southamerica-east1` si sigue disponible y es adecuado al público inicial de Uruguay. Activar Auth con correo/contraseña y Google, registrar la aplicación web y la aplicación Android existente, y configurar solo orígenes de desarrollo autorizados. Obtener la huella SHA necesaria para probar Google en Android sin registrar una huella de producción equivocada.
- [x] Verificado: Cloud Storage exige Blaze para este proyecto nuevo. Se conservó Spark y se limitó el logo a 350 KB dentro de cada documento; no se activaron facturación, Functions ni Analytics. Si en el futuro se usa Storage, revisar costos y alertas antes de activarlo.
- [x] Añadir `firebase.json`, `.firebaserc`, `firestore.indexes.json`, `firestore.rules` y, si se usa Storage, `storage.rules`; fijar alias explícito de pruebas y comandos de despliegue con `--project` para evitar operar sobre producción. No publicar reglas abiertas, ni siquiera temporalmente.

## FASE 2: Crear cuentas y sesión compartida

### Objetivo

Un usuario de pruebas puede registrarse, verificar su correo, recuperar contraseña, entrar con Google o contraseña, cerrar sesión y conservar el mismo `uid` en web y Android.

### Pasos de ejecución

- [x] Añadir el SDK modular `firebase` al paquete raíz. Definir variables `QCLI_FIREBASE_API_KEY`, `QCLI_FIREBASE_AUTH_DOMAIN`, `QCLI_FIREBASE_PROJECT_ID`, `QCLI_FIREBASE_APP_ID` y las adicionales exigidas por el SDK en `.env.example` sin valores. Configurarlas solo en `.env.local` ignorado. La clave de API web de Firebase es identificador público; secretos de Admin SDK y de futuros pagos nunca van al cliente.
- [x] Crear `src/configuracion/firebase.ts` con inicialización única de `FirebaseApp`, `Auth` y `Firestore`; exportar accesores tipados, sin inicializar dos apps al navegar. Agregar `src/boot/firebase.ts` antes de `autenticacion` en `quasar.config.ts` o justificar un orden equivalente.
- [x] Ampliar `ServicioAutenticacion` y `UsuarioAutenticado` en los archivos existentes: `id` será `uid` estable, `correo`, `nombre` y proveedores vinculados; agregar `registrarConCorreo`, `iniciarSesionConCorreo`, `iniciarSesionConGoogle`, `enviarRecuperacionContrasena`, `cerrarSesion` y observación de cambios de Auth. Crear `ServicioAutenticacionFirebase.ts` y hacer que `crearServicioAutenticacion()` lo seleccione en el entorno de pruebas. Eliminar el uso del usuario/contraseña incorporados en el cliente para esta configuración.
- [ ] Adaptar `useAutenticacionStore` para reaccionar a cambios reales de Firebase Auth, distinguir sesión inicializando, visitante y cuenta autenticada, y exponer errores legibles. Resolver carreras de inicio/cierre y limpiar estado de usuario anterior antes de mostrar otra cuenta. La recuperación tras reiniciar SPA y Android sigue pendiente de prueba manual.
- [ ] Actualizar `ModalInicioSesion.vue` con registro, entrada, contraseña olvidada, verificación y Google; mantener `BotonSesion.vue` para estado de cuenta y salida. Usar `autocomplete` correcto, permitir mostrar contraseña, indicar progreso y errores, evitar dobles envíos y mantener diseño usable en teléfonos y PC. Vincular proveedor Google a la cuenta existente mediante el flujo oficial cuando el correo ya pertenece a una cuenta; no crear dos identidades con datos separados silenciosamente.
- [ ] En web, elegir el flujo Google compatible con el origen de pruebas. Si se usa redirección fuera de Firebase Hosting, aplicar la guía oficial contra bloqueo de almacenamiento de terceros; `signInWithPopup` es válido donde el navegador lo permita. En Android Capacitor, validar compatibilidad actual de `@capacitor-firebase/authentication` con Capacitor 8 antes de instalarlo en ambos paquetes y sincronizar Android. Usar el flujo nativo Google y entregar su credencial a Firebase JS para que Firestore dentro de WebView vea la misma sesión; verificar que el `uid` coincide con la web. Fuente: [plugin Capacitor](https://capawesome.io/docs/sdks/capacitor/firebase/authentication/).

## FASE 3: Aislar y sincronizar los datos

### Objetivo

Cada cuenta ve solo sus registros y los mismos datos aparecen en Android y web. El visitante conserva el uso local provisional existente.

### Pasos de ejecución

- [x] Definir en `firestore.rules` rutas `usuarios/{uid}/clientes/{id}`, `usuarios/{uid}/materiales/{id}`, `usuarios/{uid}/presupuestos/{id}` y `usuarios/{uid}/configuracion/principal`. Permitir lectura y escritura solo cuando `request.auth.uid == uid` y el correo esté verificado; validar tipos y campos críticos. Denegar cualquier ruta comercial no definida. Comprobar que un usuario no puede consultar otra ruta aunque conozca el ID.
- [x] Crear una implementación Firestore por cada interfaz `RepositorioClientes`, `RepositorioMateriales`, `RepositorioPresupuestos` y `RepositorioConfiguracion`; conservar IDs y métodos `obtenerTodos`, `guardar`, `eliminar`, `agregarFaltantes`, `obtenerGuardada` y `guardarSiAusente`. Seleccionar repositorio local para visitante y Firestore para usuario autenticado desde los cuatro `crearRepositorio*.ts`, sin mezclar datos locales y remotos de cuentas diferentes.
- [x] Ajustar los cuatro stores para invalidar y recargar sus listas/configuración cuando cambia `uid`, al cerrar sesión y al pasar de visitante a cuenta. Cancelar o ignorar respuestas tardías de la cuenta anterior. Revisar todos los consumidores de carga, guardado, borrado, vista previa, identidad visual y copias de seguridad para que no retengan registros de otro usuario.
- [x] Diseñar el logo antes de persistir configuración y presupuestos: se conservó `datosUrl` para preservar el formato JSON y documentos históricos, con archivo máximo de 350 KB y documento serializado máximo de 900 KB. Cloud Storage queda pendiente de una decisión futura sobre Blaze.
- [ ] Configurar caché offline de Firestore de forma deliberada: soporte de Android WebView y navegadores previstos, cola de cambios al volver conexión, y política para equipos compartidos. No exponer documentos del usuario anterior desde la caché tras cerrar sesión; limpiar/inutilizar referencias y probar cambio de cuenta. Documentar conflicto entre ediciones simultáneas y el comportamiento real de última escritura.

## FASE 4: Migrar copias de prueba

### Objetivo

La importación es verificable y repetible; el acceso a Descargar, Imprimir y Enviar mantiene la regla actual basada en sesión iniciada.

### Pasos de ejecución

- [ ] Mantener `RespaldoDatos` y `validarRespaldo` como entrada; adaptar `ServicioRespaldo` para operar con los repositorios de la cuenta activa. Probar con JSON sintético de clientes, materiales, presupuestos y configuración. Antes de importar, mostrar recuentos y diferencias; confirmar el `uid` destino; agregar solo faltantes; verificar lectura remota posterior. No borrar ni sobrescribir los datos locales de origen. Una segunda importación debe producir cero altas.
- [ ] Verificar que `useAutenticacionStore().puedeGenerarSalidaPresupuesto` siga derivando de `estaAutenticado` y que `VistaPreviaPresupuestoPage.vue`, `NuevoPresupuestoPage.vue`, `MainLayout.vue` y `PanelCopiasSeguridad.vue` conserven su comportamiento actual al sustituir la sesión provisional por Firebase. No introducir fechas de prueba ni estados de suscripción en este plan.

## FASE 5: Documentar decisiones y operación

### Objetivo

Otra IA puede continuar con la prueba gratuita, Billing o la migración real sin deducir la configuración desde conversaciones anteriores.

### Pasos de ejecución

- [ ] Actualizar `README.md` con arquitectura vigente, rutas de datos, selección de entorno, variables públicas requeridas, flujo de registro, sincronización/offline, proceso de respaldo y pasos reproducibles para Firebase Console/CLI. Explicar que esta etapa conserva la salida por sesión y que prueba gratuita, exención y pagos siguen pendientes. Diferenciar claramente pruebas y producción; no anotar IDs personales, correos, credenciales, tokens ni datos reales de clientes.
- [ ] Actualizar `Memory.md` con decisiones duraderas que no se desprendan fácilmente del código: región elegida, razón de separar entornos, estrategia de migración/rollback, tratamiento de caché y límite entre esta base y el futuro plan comercial. Corregir o retirar notas que queden obsoletas, mantenerlo idealmente debajo de 100 líneas y verificar cada hecho contra implementación y documentos vigentes.
- [ ] Registrar en `Planes/Resumenes/` un resumen de ejecución con servicios activados, comprobaciones y pendientes, sin valores secretos ni datos de usuarios. Revisar si las declaraciones de privacidad y Seguridad de los datos de Play necesitarán actualización antes de publicar el siguiente Android; no modificar Play Console en este plan.

## FASE TESTING

### Objetivo

Demostrar con datos sintéticos que las cuentas, reglas, migración y permiso actual por sesión funcionan en el entorno de pruebas, sin tocar la aplicación publicada.

### Pruebas automatizadas

- [x] Ejecutar `npm run typecheck`, `npm run lint:check` y `npm run build` bajo la autorización de pruebas ya dada por Leo; revisar también el build Android con `npm run build:android` si el entorno SDK está disponible. No usar `npm run lint` como verificación inicial porque reescribe archivos.
- [x] Añadir `tests/reglasFirestore.test.mjs` y el script `test:firebase` a `package.json`; seis pruebas con Firebase Emulator Suite cubren dueño, otra cuenta, visitante, correo sin verificar, ID y rutas no definidas. `tests/importacionRespaldo.test.ts`, `tests/escriturasFirestore.test.ts` y `test:respaldo` verifican importación repetida con datos sintéticos, conservación de registros, origen intacto y escritura pendiente sin bloquear la app.
- [x] Verificar con inspección de Git que `.env.local`, `google-services.json` si se trata como configuración local y archivos de credenciales no se agregaron al índice ni al resultado de compilación; no mostrar valores en logs.

### Pruebas manuales

- [ ] Con dos cuentas sintéticas, registrar correo/contraseña, verificar correo, recuperar contraseña, entrar con Google, vincular métodos y comparar `uid` en Android y PC. Cerrar sesión, reabrir app y comprobar persistencia o ausencia de sesión según corresponda.
- [ ] Crear un cliente, material, presupuesto y configuración en Android; comprobar en web con la misma cuenta. Editar desde web y revisar Android; repetir sin red y al reconectar. Confirmar que ninguna cuenta ve datos de la otra ni tras cambiar de sesión en el mismo dispositivo.
- [ ] Importar una copia JSON sintética, comparar recuentos, repetir y comprobar cero duplicados. Comprobar que la copia anterior no fue eliminada y que una cuenta autenticada puede exportar su JSON.
- [ ] Verificar en ambas plataformas que una cuenta autenticada puede Descargar, Imprimir y Enviar, mientras un visitante ve la marca de prueba y las acciones siguen bloqueadas. No probar vencimientos ni exenciones en esta etapa.
- [ ] Comprobar los mensajes de error por falta de red, cuenta no verificada, credenciales incorrectas, proveedor ya asociado y datos que superen límites; ninguna pantalla debe mostrar datos de la cuenta anterior.

### Casos responsivos

- [ ] Revisar registro, inicio, recuperación y mensajes de sesión en teléfono Android, navegador móvil y PC usando los breakpoints existentes; sin desbordamiento, controles tapados por teclado o publicidad y acciones accesibles al lector de pantalla.

## Progreso del plan

- [x] Fase 1: Preparar el entorno y cerrar el riesgo de configuración
- [ ] Fase 2: Crear cuentas y sesión compartida
- [ ] Fase 3: Aislar y sincronizar los datos
- [ ] Fase 4: Migrar copias de prueba
- [x] Fase 5: Documentar decisiones y operación
- [ ] Fase Testing

Avance al 30 de octubre de 2026: código de registro y repositorios conectado, reglas publicadas en el proyecto de pruebas, seis pruebas de emulador y dos pruebas locales aprobadas; builds web/Android aprobados. Fases 2 a 4 y Testing siguen abiertas por las pruebas manuales de correo, Google, sincronización y uso sin conexión. Las pruebas de reglas están en `tests/reglasFirestore.test.mjs` para ejecutarse directamente con Node y Firebase Emulator Suite; el resultado cubre el objetivo previsto para el archivo `.ts` de este plan. Resumen: `Planes/Resumenes/2026-10-30-Firebase-Pruebas.md`.

Fecha de creación: 29 de octubre de 2026
Fecha de última actualización: 30 de octubre de 2026
Estado: EN EJECUCIÓN
