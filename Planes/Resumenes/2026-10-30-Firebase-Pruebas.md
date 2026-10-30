# Firebase: avance del entorno de pruebas (30 de octubre de 2026)

## Configuración aplicada

- Cuenta de trabajo: la de desarrollo indicada en `Memory.md`. Proyecto `calculatupresupuesto-pru-b2e9a`, separado de la app publicada, plan Spark.
- Cloud Firestore Standard en `southamerica-east1`; reglas publicadas por CLI. Solo el `uid` dueño con correo verificado puede acceder a clientes, materiales, presupuestos y configuración. Rutas no declaradas permanecen cerradas.
- Firebase Authentication con correo/contraseña y Google. `localhost` está autorizado para pruebas web. Se registraron app web y app Android `com.calculatupresupuesto.app`; solo las huellas SHA de depuración.
- Configuración web en `.env.local` y configuración Android en `google-services.json`, ambos ignorados por Git. Se comprobó que este último corresponde al proyecto y paquete correctos.
- No se activaron Blaze, Storage, Analytics ni Functions. El logo se limita a 350 KB en documento; cualquier registro mayor a 900 KB se rechaza.

## Código y pruebas

- Se eliminó el usuario/contraseña provisional del código y del entorno local. La cuenta Firebase registra, verifica, recupera contraseña, inicia sesión con Google y permite vincular Google a una cuenta existente.
- Los cuatro repositorios seleccionan almacenamiento local para visitantes y Firestore por `uid` para cuentas autenticadas. Los stores se limpian al cambiar de cuenta, se remontan las páginas y se ignoran lecturas tardías. Las escrituras que aún no reciben confirmación del servidor quedan en la cola local y muestran su estado. Las copias JSON se importan bajo la cuenta activa y se abortan si cambia durante la operación.
- Pasaron `npm run typecheck`, `npm run lint:check`, `npm run build`, `npm run build:android`, seis pruebas de reglas con emulador y dos pruebas locales (importación repetida y escritura pendiente). La compilación Android fue local; no se instaló sobre el teléfono ni se publicó. El registro web se revisó visualmente a 390 px sin desbordamiento ni errores de consola.

## Pendientes antes de considerar cerrada la prueba

- Probar con cuentas sintéticas los flujos completos de correo, Google y cambio de cuenta en navegador y Android; comprobar que el mismo `uid` muestra los mismos datos en ambos.
- Registrar la huella SHA de la firma de Play antes de publicar Android. Solo están registradas las de depuración; la compilación local no verifica Google Login en una versión firmada para producción.
- Comprobar edición sin red y al reconectar. El SDK tiene caché persistente en Android y caché en memoria en web, pero la experiencia de guardado sin red todavía no está validada.
- Probar manualmente una importación JSON en Firestore y Descargar, Imprimir y Enviar con cuenta y como visitante. La repetición idempotente ya pasó en repositorios locales con datos sintéticos.
- Revisar privacidad y Seguridad de los datos de Play antes de publicar. Configurar variables web en el entorno de despliegue cuando se decida publicar la SPA.
- Revisar la contraseña provisional que quedó en el historial Git antes de `v0.0.7`; si se reutilizó fuera de esta app, cambiarla allí.
