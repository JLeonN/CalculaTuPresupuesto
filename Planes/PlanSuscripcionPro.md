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

| Archivo o recurso                                                                | Acción            | Símbolos principales                                 | Propósito                                    |
| -------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------- | -------------------------------------------- |
| `firestore.rules`, `firebase.json`                                               | Modificar         | reglas de permisos, funciones                        | Aislar estado de suscripción y servidor      |
| `functions/`                                                                     | Crear             | servicios y funciones de suscripción                 | Verificar compras y mantener permisos        |
| `src/dominio/suscripcion.ts`                                                     | Crear             | tipos y reglas de acceso                             | Centralizar estados y decisiones             |
| `src/stores/suscripcion.ts`                                                      | Crear             | `useSuscripcionStore`                                | Exponer estado reactivo por cuenta           |
| `src/servicios/suscripcion/`                                                     | Crear             | compra, lectura y tiempo confiable                   | Integrar plataformas y servidor              |
| `src/stores/autenticacion.ts`                                                    | Modificar         | `actualizarUsuario`, `puedeGenerarSalidaPresupuesto` | Coordinar sesión y permisos                  |
| `src/layouts/MainLayout.vue`, `src/pages/ConfiguracionPage.vue`                  | Modificar         | publicidad y privacidad                              | Mostrar anuncios solo cuando corresponda     |
| `src/pages/NuevoPresupuestoPage.vue`, `src/pages/VistaPreviaPresupuestoPage.vue` | Modificar         | acciones y `modo-prueba`                             | Aplicar límites y marca coherentes           |
| `src/servicios/documentos/accionesPresupuesto.ts`                                | Modificar         | `permitirSalida`                                     | Mantener defensa común en acciones de salida |
| `src/components/` y `src/css/Variables.css`                                      | Modificar o crear | interfaz de suscripción                              | Mostrar estado, compra y condiciones         |
| `src-capacitor/`                                                                 | Modificar         | integración Billing y reloj Android                  | Comprar y medir tiempo transcurrido          |
| `README.md`, pruebas existentes y nuevas                                         | Modificar         | operación y verificaciones                           | Documentar entornos y validación             |

## FASE 1: Preparar infraestructura y pagos

### Objetivo

Definir la integración verificada y preparar entornos separados sin afectar a usuarios existentes.

### Pasos de ejecución

- [ ] Comprobar el MCP de Firebase, la cuenta activa, ambos proyectos, la ubicación de Firestore y el estado de facturación. Usar el MCP si está disponible; registrar solo resultados no sensibles. No activar Blaze ni crear recursos de pago hasta revisar alcance, costos y autorización necesaria.
  - [x] Comprobar la cuenta de desarrollo y confirmar en las consolas que pruebas y producción están en Spark.
  - [x] Verificar que Firestore de ambos proyectos está en `southamerica-east1`.
  - [ ] Completar la revisión de facturación antes de activar servicios pagos.
- [ ] Comprobar el perfil de pagos de Play Console, la información requerida para recibir ingresos, la declaración de comerciante y los impuestos aplicables. Leo completa datos bancarios, verificaciones, PIN y consentimientos; no registrar datos sensibles en el repositorio.
- [ ] Identificar una integración de Play Billing compatible con las versiones del proyecto y las exigencias vigentes de Google; comparar documentación y mantenimiento, validar la necesidad antes de instalar cualquier dependencia y fijar su versión. No inventar APIs de un plugin aún no seleccionado.
- [ ] Diseñar `functions/` con TypeScript estricto y la configuración de `firebase.json`, scripts y despliegue por entorno explícito. Definir cuentas de servicio con permisos mínimos, API de Google Play, Pub/Sub y notificaciones RTDN; no incluir claves privadas ni secretos en código o logs.
  - [x] Preparar la estructura local de Functions, las dependencias fijadas y la configuración inicial de Firebase.
  - [ ] Completar el despliegue por entorno y definir cuentas, permisos, API y notificaciones.
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
  - [x] Implementar y probar en el emulador el inicio único y concurrente de la prueba para cuentas nuevas y anteriores.
  - [ ] Integrar el estado de compra verificado y configurar la activación y las exenciones por entorno.
- [ ] Mantener el inicio de los 10 días desde el registro incluso si el usuario demora en verificar su correo; no ampliar la prueba por esa demora. Leo decidió dejar cualquier cambio de esta política para el futuro.
- [ ] Identificar las cuentas de Pablo y Leo mediante UID y verificación segura obtenidos en el entorno correspondiente; no dar Pro por un correo editable desde el cliente ni guardar datos personales nuevos en archivos versionados. Registrar asignaciones únicamente desde servidor administrativo y mantenerlas separadas por entorno.
  - [x] Registrar y comprobar las exenciones de Pablo y de la cuenta designada de Leo en producción, y la cuenta designada de Leo en pruebas, usando sus UID de cada proyecto.
  - [ ] Si Pablo participa en el entorno de pruebas, identificar allí su cuenta y registrar su exención de forma separada.
- [ ] En `firestore.rules`, permitir leer el propio estado al dueño autenticado y prohibir toda escritura cliente de prueba, exención, compra y vencimiento. Mantener acceso existente a datos y respaldos; probar aislamiento y falsificación cuando Leo autorice pruebas.
  - [x] Agregar las reglas locales y comprobar en el emulador la lectura propia, el aislamiento y el rechazo de escrituras cliente.
  - [ ] Desplegar las reglas cuando corresponda y verificar la integración completa con los respaldos y permisos.
- [ ] Crear `src/stores/suscripcion.ts` con `useSuscripcionStore`, inicialización, carga, error, estado por UID y limpieza al cerrar sesión o cambiar de cuenta. El estado inicial desconocido no concede Pro y no debe mostrar anuncios prematuramente mientras se verifica una cuenta potencialmente Pro.
  - [x] Preparar el store y el cliente de consulta, con limpieza y descarte de respuestas tardías.
  - [ ] Conectar y comprobar el store con la sesión y los permisos de la aplicación.
- [ ] Integrar la inicialización y limpieza con `actualizarUsuario` de `src/stores/autenticacion.ts`; descartar respuestas tardías de otra cuenta. Mantener autenticación separada de suscripción y exponer un permiso único a todos los consumidores.

## FASE 3: Compras y estados de Google Play

### Objetivo

Vincular una compra válida con una sola cuenta y reflejarla en Android y web.

### Pasos de ejecución

- [ ] Crear `src/servicios/suscripcion/servicioComprasAndroid.ts` como adaptador del plugin validado: consultar producto y precio mostrado por Play, iniciar compra con identificador de cuenta ofuscado, consultar compras recuperables y entregar el token al servidor. No enviar correos en texto claro como identificadores.
  - [x] Preparar el adaptador con `@capgo/native-purchases` 8.9.6 y desactivar la confirmación automática; consulta precio y compras, y envía el token al servidor.
  - [x] Sincronizar el plugin en el proyecto nativo y compilar una APK de depuración.
  - [x] Revisar la licencia MPL-2.0 del paquete, identificar la revisión declarada de su código fuente y documentar los pasos de distribución pendientes.
  - [x] Comprobar en el código del plugin y en la configuración Android generada que `autoFinishTransactions` está desactivado globalmente; la compra también desactiva su confirmación automática individual.
  - [x] Preparar en «Más» un aviso con enlaces a la licencia y al código fuente identificado del plugin.
  - [x] Comprobar en la web local que el aviso se despliega y presenta ambos enlaces.
  - [ ] Comprobar la presentación y apertura de los enlaces del aviso en la compilación definitiva y revisar cualquier modificación al plugin antes de distribuir.
  - [ ] Probar compras, recuperación y eventos reales con Play, incluida la confirmación a cargo del servidor.
- [ ] En `functions/`, verificar tokens y producto mediante Google Play Developer API, asociarlos transaccionalmente a un UID y rechazar asociaciones con otra cuenta. Atender compras pendientes sin conceder acceso prematuro; confirmar la compra válida dentro del plazo exigido por Google.
  - [x] Preparar la consulta a Play, la comparación de identidad y la reserva transaccional de titularidad; probar la exclusividad con datos sintéticos.
  - [x] Preparar la comprobación de producto, identidad y entorno, el cifrado autenticado del token y la llamada de confirmación a Play; probar cifrado, aislamiento y reserva con datos sintéticos.
  - [x] Preparar una función autenticada que coordina verificación, asignación y confirmación, y probar el procesamiento simulado y la protección ante respuestas antiguas.
  - [x] Admitir una recompra sin enlace cuando la compra anterior ya finalizó, con control transaccional y prueba sintética de avisos tardíos.
  - [x] Distinguir en la compra y recuperación las respuestas pendientes de las verificadas, y rechazar respuestas contradictorias.
  - [x] Preparar la recuperación del token pendiente del plugin, asociarlo sin dar acceso y comprobar con simulaciones el aviso posterior.
  - [x] Preparar la recuperación programada de compras pendientes sin aviso, con pruebas simuladas de errores, concurrencia y cancelación.
  - [ ] Comprobar la recuperación programada y el comportamiento real del plugin en Android, incluidos avisos perdidos.
  - [ ] Integrar y verificar el flujo completo, incluidos la confirmación, el almacenamiento seguro y las compras pendientes.
- [ ] Procesar RTDN mediante Pub/Sub de forma idempotente: consultar el estado completo a Google, manejar renovaciones, cancelación con acceso hasta vencimiento, reembolsos, revocación y recuperación de pagos. Atender duplicados, orden no garantizado y errores con reintentos; no confiar exclusivamente en el evento ni en datos enviados por el cliente.
  - [x] Preparar el consumidor, reconsulta y registro de reembolsos por orden; probar un aviso anterior al registro y una renovación posterior con datos sintéticos.
  - [ ] Comprobar entrega real, permisos, reintentos, duplicados y enrutamiento por entorno antes de activarlo.
- [ ] Al iniciar sesión, volver al primer plano y recuperar conexión, solicitar al servidor una reconciliación limitada por tiempo para evitar consultas repetidas. El servidor vuelve a consultar Google para compras asociadas cuando corresponda; también reintenta errores y revisa estados próximos a vencimiento para recuperarse de avisos demorados o perdidos. Guardar el último estado confirmado y la fecha de verificación; no interpretar un error de red como cancelación. Si no se puede verificar, mostrar un aviso con opción de reintento y aplicar la política sin conexión acordada. Las notificaciones visuales no sustituyen la actualización segura del permiso.
  - [x] Preparar la reconciliación limitada, la revisión programada y las llamadas al iniciar, reconectar y volver al primer plano; probar el límite y un error de red con datos sintéticos.
  - [ ] Comprobar la programación, los costos y el ciclo completo en los entornos reales.
- [ ] Mantener Pro durante el período de gracia de Google y quitarlo cuando Google confirme suspensión o vencimiento, salvo el margen sin conexión acordado cuando el dispositivo no puede consultar el estado. Gestionar tokens enlazados y restauración para la misma cuenta sin transferir compras.
  - [x] Diferenciar una renovación esperada de una cancelación confirmada para que esta última termine al vencimiento, incluso sin conexión; comprobarlo con datos sintéticos.
- [ ] Documentar en `README.md` la configuración de productos, identidad de entorno, notificaciones y verificación de recepción. La web lee el permiso de la cuenta y dirige a Android para contratar; no implementa cobro propio.
  - [x] Documentar los documentos, el secreto y el tema previstos para cada entorno, sin crear recursos ni publicar cambios.
  - [ ] Comprobar y documentar la configuración real y la recepción de avisos una vez preparados los servicios.

## FASE 4: Interfaz, documentos y publicidad

### Objetivo

Aplicar los beneficios de cada plan de forma coherente en todos los puntos de la app.

### Pasos de ejecución

- [ ] Sustituir en `src/layouts/MainLayout.vue` y `src/pages/ConfiguracionPage.vue` los criterios basados solo en `estaAutenticado` por el estado central: Gratis muestra anuncios en Android sujeto al consentimiento; prueba, Pro y exenciones no los muestran. Conservar limpieza del banner y opciones de privacidad.
  - [x] Comprobar con servicios simulados los permisos centrales de salida, marca y publicidad para Gratis, prueba, Pro, exención y estado pendiente.
- [ ] Actualizar `src/pages/NuevoPresupuestoPage.vue` y `src/pages/VistaPreviaPresupuestoPage.vue` para usar el permiso central en botones, acciones, impresión y `modo-prueba`. Revisar todos los consumidores de `puedeGenerarSalidaPresupuesto`, incluida `src/servicios/documentos/accionesPresupuesto.ts`, y evitar rutas alternativas que habiliten una salida Gratis por error.
  - [x] Comprobar que las acciones comunes de descarga y envío rechazan la salida restringida antes de preparar el documento.
- [ ] Mantener en Gratis las funciones básicas, sincronización y descarga e importación de copias JSON de `PanelCopiasSeguridad.vue`; bloquear solo salida de presupuestos y mantener su marca. No imponer límites de cantidad ni borrar datos.
  - [x] Comprobar en la web aislada con Gratis simulado la descarga, la importación de una copia ficticia y la protección frente a duplicados.
  - [x] Comprobar en Android con una cuenta del entorno de pruebas la generación de un JSON válido y la previsualización de la misma copia sin duplicados, con la suscripción desactivada.
  - [x] Comprobar que un cliente ficticio creado desde Android con sesión iniciada llega a Firestore del entorno de pruebas; verificar también su eliminación posterior.
  - [x] Guardar un cliente ficticio sin conexión en Android y comprobar que llega a Firestore de pruebas al recuperar el Wi-Fi; retirar el registro de prueba.
  - [x] Importar en Android una copia ficticia con un cliente faltante, verificar su llegada a Firestore y comprobar que una segunda importación no propone duplicarlo; retirar el registro ficticio.
  - [ ] Comprobar las copias y sincronización con una cuenta real del entorno de pruebas.
- [ ] Crear componentes pequeños en `src/components/suscripcion/` para mostrar estado, fecha, prueba, compra y gestión; indicar el precio devuelto por Google, renovación automática, cancelación y ausencia de tarjeta durante la prueba. En web explicar cómo contratar desde Android. Mostrar aviso de 10 días a cuentas existentes al activarse.
  - [x] Preparar el panel y el aviso de prueba, y conectarlos detrás del interruptor de suscripción desactivado.
  - [x] Comprobar los textos del panel web para visitante, Gratis, prueba, Pro y exento mediante renderizado aislado, sin conectar Firebase.
  - [x] Revisar en navegador el panel aislado con estados simulados, en tamaño de escritorio y móvil, incluido el aviso de conexión y la opción de reintentar.
  - [ ] Verificar presentación, textos, compra y aviso en Android y web antes de activar el interruptor.
- [ ] Reutilizar componentes Quasar y tokens de `src/css/Variables.css`, con diseño apto para teléfono y escritorio. Evitar que pantallas, modales o banners tapen acciones y asegurar estados de carga, error y reintento.

## FASE 5: Uso sin conexión

### Objetivo

Aplicar el vencimiento confirmado y cinco días adicionales sin confiar solo en el reloj editable.

### Pasos de ejecución

- [ ] Crear en `src/servicios/suscripcion/` un contrato para registrar hora confiable del servidor, vencimiento y estado del UID, protegidos contra modificación accidental y asociados al entorno y cuenta. No afirmar que el cliente puede impedir toda manipulación.
  - [x] Preparar lectura y escritura local de la referencia temporal con validación y asociación a cuenta y entorno.
  - [x] Guardar el estado verificado y conectar la referencia al ciclo de la aplicación detrás del interruptor desactivado.
  - [x] Comprobar con Android simulado que una escritura local demorada no reemplaza la referencia de otra cuenta.
  - [x] Comprobar en el POCO el store real y una referencia ficticia con Preferences y reloj nativos, usando un servidor simulado y almacenamiento aislado.
  - [ ] Comprobar la referencia y el ciclo en Android.
- [ ] Implementar un adaptador Android compatible con Capacitor que use `SystemClock.elapsedRealtime()` desde la última referencia confiable; incluye reposo y no cambia al ajustar la fecha. Calcular el plazo hasta vencimiento más cinco días cuando no pueda verificarse la renovación.
  - [x] Preparar el puente Android para leer el reloj monotónico y el contador de arranques, y el cálculo aislado del margen.
  - [x] Ejecutar en el POCO una comprobación de depuración del método nativo: sus dos lecturas coinciden con el reloj monotónico y el contador de arranques de Android.
  - [x] Comprobar en el POCO que JavaScript puede llamar al plugin mediante el puente de Capacitor y recibe valores coherentes con Android.
  - [x] Ejecutar en el POCO el adaptador TypeScript real mediante una actividad de depuración y comprobar su respuesta frente al reloj Android.
  - [x] Comprobar que el manifiesto generado para release no incluye la actividad ni la instrumentación del reloj usadas para depuración.
  - [x] Comprobar en el POCO que adelantar o atrasar un año la fecha con Wi-Fi apagado no modifica el acceso vigente de una referencia ficticia.
  - [x] Comprobar tras reiniciar el POCO que el store rechaza la referencia anterior y pide conexión cuando falla la consulta simulada; verificar luego respuestas ficticias Gratis y Pro.
  - [x] Comprobar en el POCO, con vencimientos ficticios y reloj nativo, acceso dentro del margen de cinco días y denegación después del margen.
  - [ ] Conectarlo al estado real y comprobarlo en Android, incluidos cambios de hora y reinicios.
  - [x] Conectar la lectura de la referencia y el cálculo al store detrás del interruptor desactivado.
- [ ] Detectar reinicio o referencia temporal no verificable y pedir conexión para comprobar Pro, con aviso claro y datos intactos. No asumir que el contador conserva el tiempo apagado; una reinstalación o almacenamiento borrado también requiere nueva verificación.
- [ ] Guardar junto con la hora del servidor el valor de `SystemClock.elapsedRealtime()` y `Settings.Global.BOOT_COUNT`; al reabrir la app comparar el contador de arranques y calcular el tiempo transcurrido solo si ambos valores son coherentes. `BOOT_COUNT` existe desde API 24: verificar compatibilidad y comportamiento en los Android admitidos. Si cambió, falta, es incoherente o no resulta confiable, pedir conexión. [Contador de arranques de Android](https://developer.android.com/reference/android/provider/Settings.Global#BOOT_COUNT).
- [ ] En la web no crear un sistema especial para abrir la app sin conexión ni persistencia adicional. Si ya estaba abierta al cortarse la conexión, permitir lo que esté disponible; cuando una acción no pueda completarse, mostrar un aviso claro de falta de conexión. Al reconectar, verificar nuevamente Pro. Mantener los datos y la caché en memoria existente. Los cinco días de confianza y la protección del reloj se aplican en Android.
  - [x] Conservar en memoria el último estado confirmado de la misma cuenta si falla una nueva consulta, respetando su vencimiento; comprobarlo con servicios simulados.
  - [ ] Probar la desconexión y reconexión reales de la aplicación web abierta.
- [ ] Al recuperar conexión, consultar el estado más reciente, aplicar suspensión o acceso confirmado y sustituir la referencia temporal. Evitar que un cambio de cuenta herede el permiso anterior.

## FASE TESTING

### Objetivo

Preparar validaciones para que Leo pruebe antes de publicar. Ejecutar comandos, aplicación, compilaciones o pruebas solo cuando Leo lo solicite expresamente.

### Pruebas automatizadas

- [ ] Con solicitud explícita, ejecutar `npm run typecheck`, `npm run lint:check`, `npm run test:firebase` y `npm run test:respaldo`, además de los comandos nuevos realmente incorporados; informar fallos sin ocultarlos.
  - [x] Ejecutar las pruebas de Firestore, respaldo y suscripción con datos sintéticos: 18 de Firestore, 9 de suscripción y 2 de respaldo aprobadas.
  - [x] Ejecutar typecheck del cliente y servidor, y lint del proyecto, con autorización de Leo.
  - [x] Repetir las pruebas locales de Firestore, respaldo, suscripción y panel tras los cambios posteriores; comprobar typecheck y lint del cliente.
  - [ ] Completar las pruebas de integración reales y repetir las verificaciones cuando haya nuevos cambios que lo requieran.
- [x] Cubrir reglas Firestore contra escritura de permisos y acceso entre cuentas; probar concurrencia, inicio único de prueba, eventos duplicados y asociación exclusiva de compras con datos sintéticos.
- [ ] Cubrir con reloj simulado vencimiento, cinco días, reinicio, cambio de hora, cambio de cuenta y cambios de estado de Play; comprobar que los respaldos siguen disponibles en Gratis.
  - [x] Comprobar con un reloj simulado que adelantar o atrasar la hora editable no extiende el margen de acceso una vez vencido.
  - [x] Comprobar con el plugin simulado que el adaptador TypeScript acepta referencias válidas, rechaza valores inválidos y evita la llamada nativa en la web.

### Pruebas manuales de Leo

- [ ] Probar cuenta nueva y anterior a la activación, prueba de 10 días, exenciones, paso a Gratis, datos conservados y diferencias de publicidad y documentos.
- [ ] Con compras de prueba de Google Play, comprobar compra, restauración en la misma cuenta, renovación, cancelación, pago rechazado, recuperación y revocación; verificar que otra cuenta no obtiene la compra.
- [ ] Verificar que compras de prueba y notificaciones llegan únicamente al entorno previsto y que producción rechaza compras de prueba; simular eventos perdidos, duplicados y fuera de orden y comprobar la reconciliación al volver la conexión.
- [ ] Comprobar en Android cambios de fecha, reinicio, expiración de cinco días y regreso de la conexión. En la web abierta, comprobar el aviso ante acciones que necesiten conexión y la verificación de Pro al reconectar; evaluar pantallas en móvil y escritorio.
- [ ] Revisar mensajes, precios mostrados por Play, condiciones y acceso para revisión de Google. Registrar resultados y pendientes; no publicar hasta que Leo lo indique.

## Progreso del plan

Continuación del 19 de noviembre de 2026: se añadió una actividad exclusiva de depuración para ejecutar el store real con reloj y Preferences nativos, servidor ficticio y clave de almacenamiento separada. En el POCO se confirmó Pro ficticio, se apagó el Wi-Fi y se mantuvo el acceso al recargar y al adelantar o atrasar un año la fecha. Tras restaurar la hora automática y reiniciar, el contador cambió y, ante una consulta simulada fallida, el store pidió conexión y negó el acceso. El Wi-Fi apareció activado después del reinicio: esa parte verifica la falla simulada, no una desconexión física sostenida. Las respuestas ficticias posteriores Gratis y Pro se aplicaron correctamente. Con vencimientos ficticios de cuatro y seis días y Wi-Fi apagado se comprobó, respectivamente, el acceso dentro del margen y su denegación después de cinco días; no transcurrieron cinco días reales. El manifiesto release generado no declara la nueva actividad de prueba. Falta probar el ciclo con servidor real y la interfaz completa; el resultado no verifica compras. Se restauraron la hora automática y el Wi-Fi.

Continuación del 19 de noviembre de 2026: se ordenaron las escrituras, eliminaciones y lecturas de la referencia Android ante cargas concurrentes, para evitar que una operación anterior sustituya la referencia de la cuenta actual. Se comprobó con servicios y reloj simulados una escritura demorada durante el cambio de cuenta. Falta verificar el ciclo completo en Android real, incluidos cambios de hora, reinicio y reconexión.

Avance parcial del 16 de noviembre de 2026: se prepararon el modelo puro de acceso, la regla local de lectura del estado propio sin escritura cliente y el puente Android para `elapsedRealtime` y `BOOT_COUNT`, junto con el cálculo de referencia y margen. No están conectados al permiso actual ni desplegados; falta probarlos. El mínimo Android configurado es API 24. Las casillas que incluyen integración o comprobaciones permanecen abiertas.

El MCP oficial figuró disponible en el inventario inicial, pero desapareció antes de poder consultar cuenta y proyectos. La CLI local no está instalada. No se verificaron facturación, Play Console, recursos ni identidades; no se activó ningún servicio. La comparación preliminar identifica `@capgo/native-purchases` y Capawesome Purchases como candidatos con identificador de cuenta ofuscado; falta verificar versiones, mantenimiento, API completa y compatibilidad antes de elegir o instalar. Google documenta Billing Library 9.1.0; no se debe deducir compatibilidad de un plugin solo por su descripción.

Continuación del 16 de noviembre de 2026: se preparó `functions/` con dependencias y versiones fijadas, una función autenticada que inicia la prueba transaccionalmente, una consulta aislada a `subscriptionsv2.get` y una comparación del identificador ofuscado de cuenta y entorno. Ninguna se conectó ni desplegó; falta comprobarlas. La compra aún no se vincula con una cuenta ni concede permisos, no se confirma, y no existen RTDN ni reconciliación. El servidor requiere completar y revisar esos mecanismos antes de su uso. En la versión 8.9.6 de `@capgo/native-purchases` se verificaron la declaración de Capacitor 8, Billing 9.1.0, consulta de compras y control de confirmación; queda pendiente verificar integración completa, licencia MPL-2.0 y comportamiento antes de instalarlo o seleccionarlo definitivamente. El MCP oficial no estuvo disponible en esta continuación.

Nueva revisión del 16 de noviembre de 2026: se confirmó en las consolas la cuenta de desarrollo y que los proyectos de pruebas y producción están en Spark. Play Console exige configurar una cuenta de comerciante antes de acceder a Suscripciones; Leo debe completar datos y consentimientos. No se activaron servicios ni se cambió la facturación. El MCP sigue sin aparecer en esta sesión; se amplió su tiempo de inicio en la configuración local de Codex y falta comprobarlo en una sesión nueva. La CLI 15.36.0 sí está disponible en la caché local. Se preparó una reserva transaccional de titularidad mediante hashes de tokens, todavía sin conexión al flujo y sin validación; la reconciliación requiere resolver el almacenamiento seguro del token, la concurrencia y los eventos enlazados antes de usarla.

Pruebas autorizadas por Leo: pasaron 4 pruebas sintéticas de acceso, reloj e interpretación de Play, 11 de reglas y transacciones en el emulador Firestore y 2 de respaldo y escrituras. Se verificaron la exclusividad ante solicitudes simultáneas, los tokens enlazados, el inicio único de la prueba y el registro con verificación demorada. Se separó el servicio de prueba transaccional y se prepararon un cliente y store aislados que descartan respuestas de cuentas anteriores; no están conectados a la aplicación. Siguen pendientes la integración completa de compras, RTDN, reconciliación, tiempo confiable conectado, interfaz y pruebas reales. No se desplegaron cambios ni se activaron servicios pagos.

Continuación: se prepararon la validación de compra por producto, cuenta y entorno, el cifrado autenticado de tokens y la llamada de confirmación a Play. La reserva transaccional guarda el token cifrado sin duplicarlo en texto claro. Pasaron 6 pruebas sintéticas de suscripción y 11 de reglas y transacciones; falta integrar estas piezas, gestionar la clave en Secret Manager por entorno y probar con Play. No se crearon secretos ni servicios pagos.

Continuación posterior: se incorporó una operación autenticada de compra, control de revisiones para descartar respuestas antiguas, un adaptador Android con Billing 9.1.0, lectura de notificaciones y persistencia temporal local. Pasaron 9 pruebas sintéticas de suscripción y 14 de Firestore con Play simulado. Aún no están conectadas la interfaz, las notificaciones RTDN, los reembolsos y la reconciliación; tampoco se comprobaron compras ni el adaptador en un dispositivo. La operación no está desplegada y requiere configuración y pruebas antes de usarse.

Continuación actual: se prepararon el consumidor RTDN, registro de reembolsos, reconciliación limitada y revisión programada. El permiso central, la referencia Android y el panel están conectados localmente mediante `SUSCRIPCION_HABILITADA = false`; no cambian el comportamiento vigente. Pasaron 9 pruebas sintéticas de suscripción y 17 en el emulador Firestore. Una ejecución anterior falló y una repetición pasó; no se identificó la causa de esa intermitencia. Quedan pendientes verificación real, revisión de costos, despliegue, comprobaciones nativas y pruebas del ciclo de interfaz completo. No activar el interruptor antes de completarlas.

Última revisión: se probó el margen sin conexión para cancelación y renovación, y la recompra sin token enlazado después de finalizar la compra anterior. Pasaron 9 pruebas de suscripción y 18 en Firestore; la ejecución mostró una advertencia de búsqueda de metadatos, pero terminó correctamente. La recompra y el ciclo completo aún deben comprobarse con Google Play real.

Decisión posterior de Leo: mantener los proyectos en Spark y priorizar el costo cero mientras se evalúa el crecimiento. Continuar con preparación y pruebas locales gratuitas; el despliegue de Cloud Functions y la activación de la suscripción requieren revisar con Leo el paso a Blaze y sus costos antes de realizarlos.

Prueba web como visitante: se comprobó el cálculo de mano de obra y su vista previa con marca de prueba, la solicitud de acceso al descargar el presupuesto o una copia de seguridad, y la validación de campos obligatorios de cliente y material. La instancia abierta estaba conectada a producción; no se guardaron registros de prueba. Dos intentos con cuentas de prueba no iniciaron sesión en ese entorno, por lo que siguen pendientes los flujos autenticados, las copias efectivas y las pruebas de suscripción habilitada.

En una etapa anterior se pospusieron las pruebas en teléfono; posteriormente Leo autorizó instalar y probar la app en el POCO. El comportamiento web no verifica por sí solo la integración Android, las compras ni el reloj nativo.

Prueba web con sesión iniciada en producción: se comprobó una vista previa sin guardar datos, el cálculo de mano de obra, la vista resumida y la confirmación de descarga del PDF. La copia de seguridad informó que inició la descarga, pero no se comprobó el archivo ni su importación. La suscripción permanecía deshabilitada, por lo que estas pruebas no verifican los permisos de los planes. Para probar escrituras sin afectar producción, seleccionar el entorno de pruebas y reiniciar Quasar antes de continuar.

Continuación local: se corrigió la prioridad de una exención sobre un estado Pro anterior y se evitó presentar como confirmada una compra pendiente. El emulador Firestore aprobó 20 pruebas, incluidas la exención y el ciclo simulado de cancelación, suspensión y recuperación; 10 pruebas de suscripción también pasaron. La interfaz de suscripción y las integraciones reales siguen pendientes de comprobación.

Panel web y compra pendiente: se agregó una prueba de renderizado aislado con Firebase deshabilitado que cubre los textos de visitante, Gratis, prueba, Pro y exento, y una prueba del cliente con el plugin Android y el servidor simulados. Firestore aprobó 21 pruebas, incluida la asociación de una compra pendiente y su aviso posterior. No se han comprobado interacción visual, diseño responsive, publicidad ni compras reales; sigue pendiente la recuperación automática cuando se pierde un aviso de compra pendiente.

Recuperación posterior: se preparó un reintento programado para compras registradas cuyo aviso se pierda o cuya verificación falle. Conserva la compra anterior, reintenta errores de consulta o confirmación y detiene la revisión de compras pendientes canceladas. Pasaron 24 pruebas en el emulador, incluidas concurrencia y fallos simulados. La programación sigue sin desplegar y falta verificarla con Play y la interfaz reales; su frecuencia, capacidad y costos deben revisarse antes de activarla.

Revisión visual web aislada: se comprobaron los estados de visitante, Gratis, prueba, Pro, exento, pendiente y error de conexión con datos ficticios, sin conectar Firebase. Se corrigió el panel para no ofrecer contratar Pro a cuentas Pro o exentas. Se revisó el componente en escritorio y ancho móvil; siguen pendientes la pantalla completa, el funcionamiento real de compra y las comprobaciones Android.

Permisos centrales: con la suscripción simulada como habilitada y servicios aislados se comprobaron salida, marca y publicidad para los distintos estados, incluidos vencimiento y visitante. También se verificó que descarga y envío rechazan la salida restringida antes de generar el documento. Siguen pendientes las pruebas reales de impresión, anuncios y copias en cada plan.

Continuación sin conexión: se corrigió la recuperación de la web abierta para conservar el último estado confirmado ante una consulta fallida, sin compartirlo entre cuentas ni extender el vencimiento. Se verificó con servicios simulados; queda pendiente comprobar el corte y regreso de la red en la interfaz completa.

Copias en Gratis: en la vista web aislada, sin Firebase, se importó una copia ficticia, se comprobó que repetirla no duplica el cliente y se verificó que la descarga contiene el cliente de prueba. Esta comprobación no se realizó en el POCO con la suscripción habilitada.

Prueba Android posterior: se compiló e instaló en el POCO dedicado una APK de depuración 0.0.8, con Firebase y publicidad de prueba, conservando los datos existentes. La app abrió y mostró un anuncio de prueba como visitante. La suscripción permanecía desactivada: aún no se comprobaron sus permisos, el reloj nativo ni compras reales. Antes de reutilizar los archivos generados para otra compilación hay que reconstruirlos para el entorno y la publicidad correspondientes.

Continuación en el POCO: se inició sesión con una cuenta de prueba y se abrió Configuración, donde se cargaron los datos de la cuenta. También abrieron Clientes y Presupuestos sin un mensaje visible de error y mostraron la opción de crear registros; no se guardaron datos nuevos. Se preparó una prueba instrumentada de la referencia nativa del reloj, pero no se ejecutó: Android rechazó dos intentos de instalación de su APK auxiliar. La guía de USB documenta el control de pantalla mediante `uinput` y la instalación mediante ADB; no documenta una alternativa para esa restricción. No se comprobó el puente JavaScript ni el comportamiento ante reinicios o cambios de hora.

Nueva comprobación Android: tras reconectar el POCO se intentó una vez más instalar la APK auxiliar, pero Android volvió a rechazarla. Con la cuenta de pruebas y la suscripción desactivada se abrió Copias de seguridad y se solicitó descargar una copia: Android mostró el panel para compartir un archivo JSON de respaldo. Se canceló el panel sin compartir; no se comprobó el contenido ni la restauración del archivo. Esta comprobación no verifica el plan Gratis con la suscripción habilitada.

Continuación de copias Android: se verificó en memoria que el JSON generado tiene las secciones esperadas y se seleccionó una copia temporal idéntica para importarla. La previsualización reconoció los registros existentes y mostró que no había faltantes; no se agregaron datos. La copia temporal se retiró de Descargas. La transferencia inicial quedó vacía y, después de corregirla, fue necesario actualizar el índice multimedia de Android para que el selector leyera el archivo completo; esto no demuestra un fallo de la aplicación. Siguen pendientes guardar externamente, restaurar registros faltantes y probar con la suscripción habilitada.

Sincronización Android: con la cuenta y el proyecto Firebase de pruebas se creó un cliente ficticio, se comprobó que seguía visible al reabrir la app y se verificó su llegada a Firestore. Después se eliminó únicamente ese cliente de prueba y se confirmó que ya no estaba en el servidor. La suscripción estaba desactivada; esta comprobación no valida los permisos de Gratis ni la sincronización entre dos dispositivos.

Importación Android: una copia completamente ficticia presentó un cliente faltante; se confirmó la importación y se verificó el cliente en Firestore de pruebas. Al volver a seleccionar la copia, la app informó que el registro ya existía y no había faltantes. Se eliminó el cliente ficticio del servidor con una precondición de versión y se retiró la copia temporal del teléfono. Siguen pendientes la comprobación con la suscripción habilitada y el guardado externo mediante un destino elegido en Android.

Revisión del plugin Android: el paquete instalado y el registro npm declaran MPL-2.0 y una revisión concreta del repositorio; se documentaron en el README la fuente y las condiciones de distribución que deben atenderse. Se preparó en «Más» un aviso para usuarios; su presentación y enlaces siguen pendientes de comprobación en la compilación definitiva. El código del plugin confirma que la opción individual de compra no cubre por sí sola todos los eventos; la configuración global ya existente la desactiva y también figura en los recursos Android generados. Es una revisión estática: aún falta probar compras y eventos reales.

Nueva ejecución local: aprobaron 24 pruebas de Firestore en el emulador, 11 de suscripción, 5 del panel y permisos y 2 de respaldos. El emulador mostró una advertencia de consulta de metadatos; terminó correctamente. También pasaron typecheck y lint del cliente. Las simulaciones no sustituyen las pruebas reales de Play, de los servicios desplegados ni del reloj nativo.

Comprobaciones posteriores: en la web local se abrió el aviso de licencias de «Más» y se comprobó que muestra ambos enlaces; no se verificó su apertura ni la compilación definitiva. En el POCO se volvió a intentar la APK auxiliar del reloj y Android la rechazó. Con la cuenta de pruebas y la suscripción desactivada, se apagó temporalmente el Wi-Fi, se guardó un cliente ficticio y se observó el aviso de sincronización pendiente. Después de reactivar el Wi-Fi, se confirmó su llegada a Firestore de pruebas y se retiró ese registro. Esta prueba no verifica el acceso Pro sin conexión.

Reloj Android sin APK auxiliar: se añadió una instrumentación incluida únicamente en la APK de depuración del paquete principal. En el POCO se instaló esa APK con Firebase y publicidad de prueba y se ejecutó la comprobación: el método nativo devolvió dos valores monotónicos dentro del intervalo medido y el contador de arranques esperado. La configuración Android activa se restauró después de compilar. Un intento separado de iniciar la interfaz desde la instrumentación para comprobar el puente quedó bloqueado; se retiró esa ampliación y se reinstaló la versión que sí pasa. La comprobación exitosa llama al método Java directamente: no verifica el puente JavaScript, cambios de hora, reinicios ni el ciclo de acceso sin conexión.

Cambio de hora simulado: se añadieron casos que alteran la hora editable manteniendo el reloj monotónico y el vencimiento; el margen vencido no se prolongó. Pasaron las 12 pruebas locales de suscripción. Sigue pendiente repetir el escenario con un cambio de hora real en Android.

Puente Android: se creó una actividad exclusiva de depuración para abrir la app normalmente y llamar al plugin del reloj desde JavaScript. En el POCO, la llamada por Capacitor devolvió una lectura monotónica y un contador de arranques coherentes con Android. La prueba llama al plugin desde JavaScript, pero no recorre el adaptador TypeScript ni el ciclo completo de acceso, cambios de hora o reinicios.

Adaptador de reloj: pasaron dos pruebas locales con el plugin simulado para valores válidos e inválidos y uso desde la web. Estas pruebas no ejecutan el adaptador en el teléfono ni verifican el ciclo de acceso completo.

Adaptador real en Android: se generó un módulo de prueba desde el archivo TypeScript de la aplicación y se incorporó solo a la APK de depuración. En el POCO, el adaptador llamó al plugin por Capacitor y devolvió un contador de arranques y un tiempo coherentes con Android. El módulo generado no se versiona y debe regenerarse antes de repetir la comprobación. Siguen pendientes los cambios de hora y reinicios reales y el ciclo de acceso completo.

Separación de pruebas: se generó el manifiesto de release y se comprobó que no declara la actividad ni la instrumentación de depuración del reloj. No se compiló ni publicó una versión release completa.

- [ ] Fase 1: Preparar infraestructura y pagos
- [ ] Fase 2: Modelo de acceso y prueba
- [ ] Fase 3: Compras y estados de Google Play
- [ ] Fase 4: Interfaz, documentos y publicidad
- [ ] Fase 5: Uso sin conexión
- [ ] Fase Testing

Fecha de creación: 16 de noviembre de 2026  
Fecha de última actualización: 16 de noviembre de 2026  
Estado: EN CURSO — implementación y pruebas parciales, sin despliegue
