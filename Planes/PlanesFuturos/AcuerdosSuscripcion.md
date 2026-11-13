# Acuerdos sobre la suscripción

Documento de conversación para reunir las decisiones comerciales. No es un plan de implementación.

## Planes y prueba

- **Plan Gratis:** permite usar las funciones básicas, conservar los datos, sincronizarlos y gestionar copias de seguridad. Los presupuestos se visualizan con la marca «VERSIÓN DE PRUEBA»; descargar, enviar e imprimir presupuestos están bloqueados.
- **Plan Pro:** incluye las funciones del plan Gratis y permite descargar, enviar e imprimir presupuestos sin la marca de prueba.
- **Publicidad:** el plan Gratis muestra anuncios en Android. Tanto durante la prueba Pro como con Pro de pago, no hay anuncios. Al finalizar la prueba sin suscripción, la cuenta pasa al plan Gratis y muestra anuncios.
- **Prueba Pro:** dura 10 días desde el registro, ofrece las funciones Pro y no exige ingresar una tarjeta. Al finalizar, la cuenta pasa al plan Gratis si no se suscribe.
- Las cuentas creadas antes de activar la suscripción recibirán 10 días completos de prueba Pro desde su primera entrada posterior a la activación. Al entrar verán un aviso que explique la prueba y el paso al plan Gratis si no se suscriben.
- Después de la prueba, el acceso Pro requiere una suscripción pagada, con las excepciones confirmadas de Pablo y Leo.
- **Pablo:** la cuenta `el_mallic@hotmail.com` tendrá acceso Pro gratuito de por vida y sin anuncios. La excepción aún no está implementada.
- **Cuenta de pruebas de Leo:** la cuenta identificada como «Yo Mat 03» tendrá acceso Pro gratuito de por vida y sin anuncios, sin necesidad de suscripción. Su identidad está confirmada; al implementar la excepción se deberá identificar la cuenta de forma segura.
- **Pruebas repetidas:** por ahora se acepta que una persona pueda crear otra cuenta y migrar sus datos para obtener otra prueba. Se podrá revisar en el futuro si aparecen patrones de abuso en Firebase y cómo abordarlos.
- Los datos se conservan cuando finaliza la prueba o la persona pasa al plan Gratis.
- Por ahora no se establecen límites de cantidad para clientes, materiales ni presupuestos. Más adelante se podrá evaluar un límite, por ejemplo de 20 para cada uno, sin borrar datos existentes.

## Cobro

- Objetivo: que la aplicación pueda utilizarse internacionalmente. La disponibilidad de la suscripción dependerá de los países y medios de pago admitidos por Google Play.
- Comenzar con una suscripción Pro **mensual**. La opción anual se podrá evaluar más adelante.
- Precio base acordado: **USD 4,99 al mes para todos los países**, sin buscar ni ajustar importes específicos por país. Se acepta el importe que resulte en cada país según la conversión, los impuestos y los ajustes de Google Play. [Configuración de precios de suscripciones](https://support.google.com/googleplay/android-developer/answer/140504?hl=es).
- La suscripción representa tiempo de uso Pro. Si se cancela, se conservan los beneficios hasta el fin del período pagado; después pasa al plan Gratis. Explicar claramente la renovación y la cancelación al usuario.
- **Sin conexión:** conservar Pro hasta el último vencimiento confirmado y, si aún no se puede comprobar la renovación, durante cinco días adicionales de confianza. Después pasa a Gratis hasta que pueda verificarse el estado; los datos se conservan. Durante esos cinco días no se sabe si el cobro se concretó. Cuando sea posible consultar el estado actualizado, aplicar lo que informe Google. Proteger la fecha y contemplar cambios del reloj del dispositivo al implementar.
- **Pagos rechazados:** Google puede conceder un período de gracia durante el cual se mantiene Pro; si la suscripción entra en suspensión por falta de pago, corresponde quitar Pro. Mientras no sea posible verificar el estado, se aplica el margen sin conexión acordado, sin confundirlo con el período de gracia de Google. Revisar los plazos y la configuración en Play Console. [Suscripciones y pagos rechazados](https://developer.android.com/google/play/billing/subscriptions#handle-payment-declines) y [ciclo de vida de suscripciones](https://developer.android.com/google/play/billing/lifecycle/subscriptions).
- Firebase ofrece persistencia local y sincronización al recuperar la conexión, si se configura según la plataforma; la regla de los cinco días debe implementarla la app. [Datos sin conexión en Firestore](https://firebase.google.com/docs/firestore/manage-data/enable-offline).
- **Protección del tiempo en Android:** al disponer de conexión, tomar como referencia la fecha del servidor y el vencimiento confirmado por Google. Sin conexión, evaluar el tiempo transcurrido con el reloj monotónico de Android, que no depende de cambios manuales de fecha e incluye el reposo. Tras un reinicio sin conexión, si no es posible determinar de forma confiable el tiempo transcurrido, pedir conexión para volver a comprobar Pro, con un aviso claro y conservando los datos. Esto puede suspender temporalmente Pro a un usuario legítimo. [Relojes de Android: SystemClock](https://developer.android.com/reference/android/os/SystemClock).
- **Web:** estudiar una solución específica para el tiempo sin conexión; el reloj monotónico de Android no está disponible allí.
- Usar **Google Play Billing** para el cobro inicial. Mercado Pago queda descartado por el momento.
- Google Play gestiona el cobro, las renovaciones, los medios de pago, la cancelación y el estado de la suscripción. Al cancelar, el usuario conserva Pro hasta el final del período pagado. [Gestión de suscripciones y compras](https://developer.android.com/google/play/billing/manage-purchases).
- La app y su servidor deberán integrar los avisos de cambios de Google Play, consultar el estado actualizado y ajustar el permiso Pro de la cuenta, también para la web. Los avisos indican que hubo un cambio; la API proporciona el estado completo. [Configuración de la API y notificaciones](https://developer.android.com/google/play/billing/getting-ready) y [ciclo de vida de las suscripciones](https://developer.android.com/google/play/billing/lifecycle/subscriptions).
- La integración sigue mecanismos documentados por Google; queda pendiente revisar sus períodos de recuperación de pagos rechazados y determinar cuándo corresponde retirar el acceso Pro.
- En la web, orientar a quien quiera suscribirse a instalar la aplicación Android y pagar mediante Google Play. La cuenta y sus permisos deberán funcionar también en la web.
- Cada suscripción se vinculará a una sola cuenta de la app. Al iniciar la compra se podrá proporcionar a Google un identificador protegido de esa cuenta; el servidor verificará la compra y asociará el acceso Pro con ella. La persona podrá usar Pro en Android y en la web iniciando sesión con la misma cuenta de la app, aunque pague con otra cuenta de Google Play. [Integración de Google Play Billing](https://developer.android.com/google/play/billing/integrate) y [ciclo de vida de las suscripciones](https://developer.android.com/google/play/billing/lifecycle/subscriptions).
- **Recuperación de acceso:** si una persona pierde el acceso, intentar primero recuperar su cuenta original mediante el método de acceso correspondiente. Al entrar nuevamente en esa cuenta recuperará su acceso Pro si corresponde. Firebase permite enviar correos de recuperación de contraseña; para una cuenta de Google se puede recurrir a su proceso de recuperación. Si no se puede recuperar la cuenta, estudiar como caso excepcional una transferencia segura de la suscripción, verificando la compra y evitando que quede activa en dos cuentas. Transferir Pro no implica recuperar los datos anteriores. [Gestión de usuarios de Firebase](https://firebase.google.com/docs/auth/web/manage-users) y [recuperación de cuentas de Google](https://support.google.com/accounts/answer/7682439).
- Revisión del 12 de noviembre de 2026: Play Console solicita crear un perfil de pagos para monetizar; todavía no figura configurado. La app está en producción. La consola también solicita declarar el estado de comerciante antes del 1 de febrero de 2027.
- **Costos revisados el 13 de noviembre de 2026:** Google Play publica para Uruguay una comisión del 15 % en suscripciones de renovación automática. Como ejemplo orientativo, aplicar ese porcentaje a USD 4,99 deja aproximadamente USD 4,24 antes de otros costos e impuestos; la base real y el importe final dependen de las condiciones e impuestos aplicables. [Comisiones de Google Play](https://support.google.com/googleplay/android-developer/answer/112622?hl=es).
- La integración del servidor y las notificaciones probablemente requiera el plan Blaze de Firebase. Es de pago por consumo e incluye cuotas gratuitas; pueden existir cargos al superarlas o al utilizar determinados servicios. Firestore ofrece, entre otras cuotas, 50.000 lecturas y 20.000 escrituras diarias para una base elegible. Las funciones y Pub/Sub también tienen cuotas gratuitas. Estimar el costo con la arquitectura y el uso reales, revisar la facturación y configurar alertas de presupuesto antes de activar Blaze. Consultar los impuestos aplicables en Uruguay. [Planes de Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [precios de Firestore](https://firebase.google.com/docs/firestore/pricing), [precios de Firebase](https://firebase.google.com/pricing) y [precios de Pub/Sub](https://cloud.google.com/pubsub/pricing).

## Pendiente de conversar

- Definir cómo implementar de forma segura el acceso especial de Pablo y Leo.
- Incluir en el futuro plan de suscripción la gestión y configuración del perfil de pagos de Google Play, incluida la verificación de los datos necesarios para recibir ingresos.
- Revisar otros detalles que diferencien los planes.
- Revisar los plazos de recuperación de pagos rechazados de Google Play y los detalles técnicos del uso sin conexión.
- Revisar aspectos comerciales y fiscales.

La lista de pendientes se irá completando a medida que avance la conversación.

## Aspectos por definir o confirmar para la implementación

- Estudiar un procedimiento excepcional y seguro para transferir la suscripción si no se puede recuperar la cuenta original.
- Comprobar el flujo completo con compras de prueba, incluidas renovaciones, cancelaciones y fallos, antes de publicar.
- Revisar el perfil de pagos, las comisiones de Google, los costos de Firebase y los impuestos aplicables antes de comercializar.
- Revisar la disponibilidad por país y explicar al usuario la renovación, la cancelación y las condiciones de la prueba.
