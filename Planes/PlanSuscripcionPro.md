# Plan de suscripción Pro

## Descripción del plan

Incorporar una suscripción mensual mediante Google Play Billing, con acceso compartido entre Android y web, respetando los acuerdos de `Planes/PlanesFuturos/AcuerdosSuscripcion.md`. Este documento es un plan, no autoriza por sí solo su ejecución, pruebas, compilación ni publicación.

## Objetivo principal

- Diferenciar Gratis, prueba Pro y Pro, conservar siempre los datos y asignar permisos según el estado verificado.
- Ofrecer la suscripción en todos los países admitidos, con precio base de USD 4,99 mensuales y sin precios personalizados por país.
- Permitir que Leo pruebe el flujo completo antes de publicar.

## Contexto técnico verificado

- Vue 3, Quasar, TypeScript, Pinia, Firebase Authentication y Firestore; Android usa Capacitor y `com.calculatupresupuesto.app`.
- `src/stores/autenticacion.ts` calcula actualmente `puedeGenerarSalidaPresupuesto` únicamente según la sesión. La publicidad de `src/layouts/MainLayout.vue` y la marca de los documentos dependen también de la sesión; deben pasar a depender del permiso real.
- Firestore conserva los datos bajo `usuarios/{uid}`; `firestore.rules` restringe su acceso al propietario con correo verificado. Android usa caché persistente y la web caché en memoria; no asumir persistencia web entre reinicios.
- Existen proyectos Firebase separados de pruebas y producción. `Planes/PlanFirebaseProduccion.md` contiene trabajo anterior aún abierto; no modificarlo ni asumir que sus verificaciones pendientes están completas.
- Leo indicó que Pablo es el único usuario actual, participa como tester y ya tiene sus datos guardados. Pablo también podría probar una APK de pruebas; coordinarlo con él sin dar por hecho que debe desinstalar su app.
- El MCP oficial de Firebase figura configurado, pero sus herramientas no estaban disponibles en la sesión de planificación. Al comenzar, descubrir sus capacidades y priorizarlo cuando sea adecuado; si no está disponible, informar y usar una alternativa apropiada. Confirmar siempre cuenta, proyecto y entorno; no exponer credenciales.
- No ejecutar aplicación, pruebas, compilaciones ni linters sin solicitud explícita de Leo. No crear commits, hacer push, publicar ni instalar dependencias sin la autorización o validación correspondiente.

## Alcance

### Incluye

- Prueba Pro de 10 días, suscripción mensual, cuentas exentas de Pablo y Leo, anuncios y permisos de salida.
- Verificación en servidor, sincronización de estados de Google Play y acceso a la misma cuenta en Android y web.
- Manejo del tiempo sin conexión, recuperación de cuenta original, mensajes y pruebas para revisión de Leo.

### No incluye

- Pagos web, Mercado Pago, plan anual, transferencia de suscripción entre cuentas y bloqueo de pruebas repetidas creando cuentas nuevas.
- Borrado de datos al finalizar la prueba o la suscripción.

## Mapa de cambios

| Archivo o recurso | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `firestore.rules`, `firebase.json` | Modificar | reglas de permisos, funciones | Aislar estado de suscripción y servidor |
| `functions/` | Crear | servicios y funciones de suscripción | Verificar compras y mantener permisos |
| `src/dominio/suscripcion.ts` | Crear | tipos y reglas de acceso | Centralizar estados y decisiones |
| `src/stores/suscripcion.ts` | Crear | `useSuscripcionStore` | Exponer estado reactivo por cuenta |
| `src/servicios/suscripcion/` | Crear | compra, lectura y tiempo confiable | Integrar plataformas y servidor |
| `src/stores/autenticacion.ts` | Modificar | `actualizarUsuario`, `puedeGenerarSalidaPresupuesto` | Coordinar sesión y permisos |
| `src/layouts/MainLayout.vue`, `src/pages/ConfiguracionPage.vue` | Modificar | publicidad y privacidad | Mostrar anuncios solo cuando corresponda |
| `src/pages/NuevoPresupuestoPage.vue`, `src/pages/VistaPreviaPresupuestoPage.vue` | Modificar | acciones y `modo-prueba` | Aplicar límites y marca coherentes |
| `src/servicios/documentos/accionesPresupuesto.ts` | Modificar | `permitirSalida` | Mantener defensa común en acciones de salida |
| `src/components/` y `src/css/Variables.css` | Modificar o crear | interfaz de suscripción | Mostrar estado, compra y condiciones |
| `src-capacitor/` | Modificar | integración Billing y reloj Android | Comprar y medir tiempo transcurrido |
| `README.md`, pruebas existentes y nuevas | Modificar | operación y verificaciones | Documentar entornos y validación |

## FASE 1: Preparar infraestructura y pagos

### Objetivo

Definir la integración verificada y preparar entornos separados sin afectar a usuarios existentes.

### Pasos de ejecución

- [ ] Comprobar el MCP de Firebase, la cuenta activa, ambos proyectos, la ubicación de Firestore y el estado de facturación. Usar el MCP si está disponible; registrar solo resultados no sensibles. No activar Blaze ni crear recursos de pago hasta revisar alcance, costos y autorización necesaria.
- [ ] Comprobar el perfil de pagos de Play Console, la información requerida para recibir ingresos, la declaración de comerciante y los impuestos aplicables. Leo completa datos bancarios, verificaciones, PIN y consentimientos; no registrar datos sensibles en el repositorio.
- [ ] Identificar una integración de Play Billing compatible con las versiones del proyecto y las exigencias vigentes de Google; comparar documentación y mantenimiento, validar la necesidad antes de instalar cualquier dependencia y fijar su versión. No inventar APIs de un plugin aún no seleccionado.
- [ ] Diseñar `functions/` con TypeScript estricto y la configuración de `firebase.json`, scripts y despliegue por entorno explícito. Definir cuentas de servicio con permisos mínimos, API de Google Play, Pub/Sub y notificaciones RTDN; no incluir claves privadas ni secretos en código o logs.
- [ ] Configurar en Play Console una suscripción mensual y su plan base de USD 4,99 para todos los países admitidos, sin activar ni publicar hasta que corresponda. La prueba de 10 días es de la app, no una oferta gratuita adicional de Google Play.
- [ ] Preparar cuentas de licencia y Play Billing Lab para probar compras, renovaciones y fallos antes de publicar. Evaluar una APK para Pablo como prueba opcional; comprobar firma, paquete y conservación de datos antes de instalarla o reemplazar su app. [Pruebas de Google Play Billing](https://developer.android.com/google/play/billing/test).
- [ ] Mantener aislados Firestore, funciones, cuentas de servicio y destinos de notificaciones por entorno. Para pruebas reales de Play con el mismo paquete, definir y verificar explícitamente cómo se dirigen las notificaciones al entorno de pruebas; Google Play no queda separado automáticamente por cambiar de proyecto Firebase. Identificar las compras de prueba con la respuesta oficial de Play y rechazar en producción cualquier compra de prueba; no duplicar ni registrar tokens en texto claro. Documentar y comprobar el enrutamiento antes de probar compras.
- [ ] Preparar alertas de presupuesto, sin presentarlas como límite automático de gasto, y documentar costos variables, entorno y recursos en `README.md`.

## FASE 2: Modelo de acceso y prueba

### Objetivo

Establecer una única fuente de verdad para los permisos de cada cuenta.

### Pasos de ejecución

- [x] Crear `src/dominio/suscripcion.ts`: tipos explícitos para Gratis, prueba, Pro pagado, Pro exento y estado pendiente de verificación; exponer una función pura `resolverAccesoSuscripcion` que reciba estado confiable y fecha evaluada y devuelva `puedeGenerarSalida`, `mostrarMarca` y `mostrarPublicidad`.
- [ ] Crear en `functions/` un servicio transaccional por UID con fecha de inicio y vencimiento de prueba fijadas por servidor, permisos exentos y estado de compra verificado. La prueba es única por cuenta: cuentas nuevas empiezan desde el registro y cuentas anteriores a la activación reciben 10 días desde la primera entrada posterior. Registrar una fecha de activación confiable; evitar que inicios simultáneos reinicien la prueba.
- [ ] Mantener el inicio de los 10 días desde el registro incluso si el usuario demora en verificar su correo; no ampliar la prueba por esa demora. Leo decidió dejar cualquier cambio de esta política para el futuro.
- [ ] Identificar las cuentas de Pablo y Leo mediante UID y verificación segura obtenidos en el entorno correspondiente; no dar Pro por un correo editable desde el cliente ni guardar datos personales nuevos en archivos versionados. Registrar asignaciones únicamente desde servidor administrativo y mantenerlas separadas por entorno.
- [ ] En `firestore.rules`, permitir leer el propio estado al dueño autenticado y prohibir toda escritura cliente de prueba, exención, compra y vencimiento. Mantener acceso existente a datos y respaldos; probar aislamiento y falsificación cuando Leo autorice pruebas.
- [ ] Crear `src/stores/suscripcion.ts` con `useSuscripcionStore`, inicialización, carga, error, estado por UID y limpieza al cerrar sesión o cambiar de cuenta. El estado inicial desconocido no concede Pro y no debe mostrar anuncios prematuramente mientras se verifica una cuenta potencialmente Pro.
- [ ] Integrar la inicialización y limpieza con `actualizarUsuario` de `src/stores/autenticacion.ts`; descartar respuestas tardías de otra cuenta. Mantener autenticación separada de suscripción y exponer un permiso único a todos los consumidores.

## FASE 3: Compras y estados de Google Play

### Objetivo

Vincular una compra válida con una sola cuenta y reflejarla en Android y web.

### Pasos de ejecución

- [ ] Crear `src/servicios/suscripcion/servicioComprasAndroid.ts` como adaptador del plugin validado: consultar producto y precio mostrado por Play, iniciar compra con identificador de cuenta ofuscado, consultar compras recuperables y entregar el token al servidor. No enviar correos en texto claro como identificadores.
- [ ] En `functions/`, verificar tokens y producto mediante Google Play Developer API, asociarlos transaccionalmente a un UID y rechazar asociaciones con otra cuenta. Atender compras pendientes sin conceder acceso prematuro; confirmar la compra válida dentro del plazo exigido por Google.
- [ ] Procesar RTDN mediante Pub/Sub de forma idempotente: consultar el estado completo a Google, manejar renovaciones, cancelación con acceso hasta vencimiento, reembolsos, revocación y recuperación de pagos. Atender duplicados, orden no garantizado y errores con reintentos; no confiar exclusivamente en el evento ni en datos enviados por el cliente.
- [ ] Al iniciar sesión, volver al primer plano y recuperar conexión, solicitar al servidor una reconciliación limitada por tiempo para evitar consultas repetidas. El servidor vuelve a consultar Google para compras asociadas cuando corresponda; también reintenta errores y revisa estados próximos a vencimiento para recuperarse de avisos demorados o perdidos. Guardar el último estado confirmado y la fecha de verificación; no interpretar un error de red como cancelación. Si no se puede verificar, mostrar un aviso con opción de reintento y aplicar la política sin conexión acordada. Las notificaciones visuales no sustituyen la actualización segura del permiso.
- [ ] Mantener Pro durante el período de gracia de Google y quitarlo cuando Google confirme suspensión o vencimiento, salvo el margen sin conexión acordado cuando el dispositivo no puede consultar el estado. Gestionar tokens enlazados y restauración para la misma cuenta sin transferir compras.
- [ ] Documentar en `README.md` la configuración de productos, identidad de entorno, notificaciones y verificación de recepción. La web lee el permiso de la cuenta y dirige a Android para contratar; no implementa cobro propio.

## FASE 4: Interfaz, documentos y publicidad

### Objetivo

Aplicar los beneficios de cada plan de forma coherente en todos los puntos de la app.

### Pasos de ejecución

- [ ] Sustituir en `src/layouts/MainLayout.vue` y `src/pages/ConfiguracionPage.vue` los criterios basados solo en `estaAutenticado` por el estado central: Gratis muestra anuncios en Android sujeto al consentimiento; prueba, Pro y exenciones no los muestran. Conservar limpieza del banner y opciones de privacidad.
- [ ] Actualizar `src/pages/NuevoPresupuestoPage.vue` y `src/pages/VistaPreviaPresupuestoPage.vue` para usar el permiso central en botones, acciones, impresión y `modo-prueba`. Revisar todos los consumidores de `puedeGenerarSalidaPresupuesto`, incluida `src/servicios/documentos/accionesPresupuesto.ts`, y evitar rutas alternativas que habiliten una salida Gratis por error.
- [ ] Mantener en Gratis las funciones básicas, sincronización y descarga e importación de copias JSON de `PanelCopiasSeguridad.vue`; bloquear solo salida de presupuestos y mantener su marca. No imponer límites de cantidad ni borrar datos.
- [ ] Crear componentes pequeños en `src/components/suscripcion/` para mostrar estado, fecha, prueba, compra y gestión; indicar el precio devuelto por Google, renovación automática, cancelación y ausencia de tarjeta durante la prueba. En web explicar cómo contratar desde Android. Mostrar aviso de 10 días a cuentas existentes al activarse.
- [ ] Reutilizar componentes Quasar y tokens de `src/css/Variables.css`, con diseño apto para teléfono y escritorio. Evitar que pantallas, modales o banners tapen acciones y asegurar estados de carga, error y reintento.

## FASE 5: Uso sin conexión

### Objetivo

Aplicar el vencimiento confirmado y cinco días adicionales sin confiar solo en el reloj editable.

### Pasos de ejecución

- [ ] Crear en `src/servicios/suscripcion/` un contrato para registrar hora confiable del servidor, vencimiento y estado del UID, protegidos contra modificación accidental y asociados al entorno y cuenta. No afirmar que el cliente puede impedir toda manipulación.
- [ ] Implementar un adaptador Android compatible con Capacitor que use `SystemClock.elapsedRealtime()` desde la última referencia confiable; incluye reposo y no cambia al ajustar la fecha. Calcular el plazo hasta vencimiento más cinco días cuando no pueda verificarse la renovación.
- [ ] Detectar reinicio o referencia temporal no verificable y pedir conexión para comprobar Pro, con aviso claro y datos intactos. No asumir que el contador conserva el tiempo apagado; una reinstalación o almacenamiento borrado también requiere nueva verificación.
- [ ] Guardar junto con la hora del servidor el valor de `SystemClock.elapsedRealtime()` y `Settings.Global.BOOT_COUNT`; al reabrir la app comparar el contador de arranques y calcular el tiempo transcurrido solo si ambos valores son coherentes. `BOOT_COUNT` existe desde API 24: verificar compatibilidad y comportamiento en los Android admitidos. Si cambió, falta, es incoherente o no resulta confiable, pedir conexión. [Contador de arranques de Android](https://developer.android.com/reference/android/provider/Settings.Global#BOOT_COUNT).
- [ ] En la web no crear un sistema especial para abrir la app sin conexión ni persistencia adicional. Si ya estaba abierta al cortarse la conexión, permitir lo que esté disponible; cuando una acción no pueda completarse, mostrar un aviso claro de falta de conexión. Al reconectar, verificar nuevamente Pro. Mantener los datos y la caché en memoria existente. Los cinco días de confianza y la protección del reloj se aplican en Android.
- [ ] Al recuperar conexión, consultar el estado más reciente, aplicar suspensión o acceso confirmado y sustituir la referencia temporal. Evitar que un cambio de cuenta herede el permiso anterior.

## FASE TESTING

### Objetivo

Preparar validaciones para que Leo pruebe antes de publicar. Ejecutar comandos, aplicación, compilaciones o pruebas solo cuando Leo lo solicite expresamente.

### Pruebas automatizadas

- [ ] Con solicitud explícita, ejecutar `npm run typecheck`, `npm run lint:check`, `npm run test:firebase` y `npm run test:respaldo`, además de los comandos nuevos realmente incorporados; informar fallos sin ocultarlos.
- [ ] Cubrir reglas Firestore contra escritura de permisos y acceso entre cuentas; probar concurrencia, inicio único de prueba, eventos duplicados y asociación exclusiva de compras con datos sintéticos.
- [ ] Cubrir con reloj simulado vencimiento, cinco días, reinicio, cambio de hora, cambio de cuenta y cambios de estado de Play; comprobar que los respaldos siguen disponibles en Gratis.

### Pruebas manuales de Leo

- [ ] Probar cuenta nueva y anterior a la activación, prueba de 10 días, exenciones, paso a Gratis, datos conservados y diferencias de publicidad y documentos.
- [ ] Con compras de prueba de Google Play, comprobar compra, restauración en la misma cuenta, renovación, cancelación, pago rechazado, recuperación y revocación; verificar que otra cuenta no obtiene la compra.
- [ ] Verificar que compras de prueba y notificaciones llegan únicamente al entorno previsto y que producción rechaza compras de prueba; simular eventos perdidos, duplicados y fuera de orden y comprobar la reconciliación al volver la conexión.
- [ ] Comprobar en Android cambios de fecha, reinicio, expiración de cinco días y regreso de la conexión. En la web abierta, comprobar el aviso ante acciones que necesiten conexión y la verificación de Pro al reconectar; evaluar pantallas en móvil y escritorio.
- [ ] Revisar mensajes, precios mostrados por Play, condiciones y acceso para revisión de Google. Registrar resultados y pendientes; no publicar hasta que Leo lo indique.

## Progreso del plan

Avance parcial del 16 de noviembre de 2026: se prepararon el modelo puro de acceso, la regla local de lectura del estado propio sin escritura cliente y el puente Android para `elapsedRealtime` y `BOOT_COUNT`, junto con el cálculo de referencia y margen. No están conectados al permiso actual ni desplegados; falta probarlos. El mínimo Android configurado es API 24. Las casillas que incluyen integración o comprobaciones permanecen abiertas.

El MCP oficial figuró disponible en el inventario inicial, pero desapareció antes de poder consultar cuenta y proyectos. La CLI local no está instalada. No se verificaron facturación, Play Console, recursos ni identidades; no se activó ningún servicio. La comparación preliminar identifica `@capgo/native-purchases` y Capawesome Purchases como candidatos con identificador de cuenta ofuscado; falta verificar versiones, mantenimiento, API completa y compatibilidad antes de elegir o instalar. Google documenta Billing Library 9.1.0; no se debe deducir compatibilidad de un plugin solo por su descripción.

Continuación del 16 de noviembre de 2026: se preparó `functions/` con dependencias y versiones fijadas, una función autenticada que inicia la prueba transaccionalmente, una consulta aislada a `subscriptionsv2.get` y una comparación del identificador ofuscado de cuenta y entorno. Ninguna se conectó ni desplegó; falta comprobarlas. La compra aún no se vincula con una cuenta ni concede permisos, no se confirma, y no existen RTDN ni reconciliación. El servidor requiere completar y revisar esos mecanismos antes de su uso. En la versión 8.9.6 de `@capgo/native-purchases` se verificaron la declaración de Capacitor 8, Billing 9.1.0, consulta de compras y control de confirmación; queda pendiente verificar integración completa, licencia MPL-2.0 y comportamiento antes de instalarlo o seleccionarlo definitivamente. El MCP oficial no estuvo disponible en esta continuación.

- [ ] Fase 1: Preparar infraestructura y pagos
- [ ] Fase 2: Modelo de acceso y prueba
- [ ] Fase 3: Compras y estados de Google Play
- [ ] Fase 4: Interfaz, documentos y publicidad
- [ ] Fase 5: Uso sin conexión
- [ ] Fase Testing

Fecha de creación: 16 de noviembre de 2026  
Fecha de última actualización: 16 de noviembre de 2026  
Estado: EN CURSO — implementación parcial, sin pruebas ni despliegue
