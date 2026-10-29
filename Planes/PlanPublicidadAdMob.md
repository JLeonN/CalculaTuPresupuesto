# Plan de publicidad AdMob para visitantes en Android

## Descripción del plan

Integrar un único banner nativo de AdMob en la aplicación Android de Calcula tu presupuesto. Mientras sea elegible y esté visible, permanecerá fijo en el borde inferior y centrado horizontalmente, también durante el desplazamiento y en tabletas. La navegación móvil quedará por encima, separada por una franja no interactiva. Mostrarlo al visitante sin sesión; ocultarlo cuando inicia sesión y volver a solicitarlo cuando cierra sesión. La SPA web no solicita anuncios. Un booleano en un archivo de configuración versionado controla el modo de prueba de todos los formatos AdMob, tanto el banner actual como cualquier formato que se agregue después. La configuración de `app-ads.txt` y las declaraciones de Google Play se completarán antes de publicar una versión con anuncios reales.

## Objetivo principal

- Mostrar el banner estándar más pequeño verificado para Android, de 320 × 50 dp, siempre pegado al borde inferior y centrado mientras se muestre, sin cubrir navegación, acciones ni contenido.
- No inicializar ni solicitar anuncios para usuarios autenticados, incluso cuando se recupera una sesión al abrir la app.
- Alternar anuncios de prueba y reales de cualquier formato actual o futuro cambiando solamente `PUBLICIDAD_DE_PRUEBA` antes de generar la APK o AAB.
- Conservar en este plan los identificadores de AdMob confirmados por Leo.

## Contexto técnico verificado

- `AGENTS.md` exige Quasar, Vue 3, TypeScript estricto, nombres en español, tokens visuales en `src/css/Variables.css`, aprobación antes de implementar y no ejecutar app, pruebas, compilaciones ni linters sin pedido explícito de Leo.
- La app Android usa `com.calculatupresupuesto.app`, Capacitor 8.5.0 instalado en `src-capacitor`, `minSdkVersion = 24` y una SPA que comparte `src/layouts/MainLayout.vue` con Android. La web se publica en GitHub Pages bajo `/CalculaTuPresupuesto/`.
- `src/boot/autenticacion.ts` espera `inicializarSesion()` antes de montar la interfaz. `useAutenticacionStore().estaAutenticado` refleja la sesión provisional actual y debe seguir siendo el criterio cuando se cambie a Firebase.
- `MainLayout.vue` contiene el `q-footer` con cuatro botones en pantallas menores que `md`. La altura y el área segura están definidas en `.navegacion-movil__contenido`; Quasar reserva en la página la altura del `q-footer`.
- `src/components/configuracion/FormularioConfiguracion.vue` tiene acciones adhesivas cuya regla móvil en `src/css/app.css` depende de `--altura-navegacion-movil` y `env(safe-area-inset-bottom)`.
- El plugin comunitario `@capacitor-community/admob` versión 8.2.x es compatible con Capacitor 8.5. Expone `requestConsentInfo`, `showConsentForm`, `initialize`, `showBanner`, `removeBanner`, `showPrivacyOptionsForm` y el evento `BannerAdPluginEvents.SizeChanged`. Su banner nativo se dibuja sobre el WebView; el espacio HTML debe reservarse explícitamente. `BannerAdSize.BANNER` es 320 × 50 dp y `BannerAdPosition.BOTTOM_CENTER` fija su posición, sin moverla por desplazamiento de la página. Referencias: [instalación y API](https://github.com/capacitor-community/admob/blob/main/README.md), [banner y altura](https://docs.rdlabo.dev/projects/capacitor-admob/docs/banner), [tamaño fijo](https://developers.google.com/admob/android/banner/fixed-size), [consentimiento](https://docs.rdlabo.dev/projects/capacitor-admob/docs/consent), [pruebas](https://docs.rdlabo.dev/projects/capacitor-admob/docs/testing).
- [AdMob recomienda](https://support.google.com/admob/answer/6275335?hl=en-GB) reservar el espacio del banner antes de su aparición y separarlo de controles interactivos para evitar desplazamientos y toques accidentales. El tamaño publicitario sigue siendo 320 × 50 dp; la separación visual mínima usa `--espaciado-pequeno`, ya existente.
- ID de aplicación Android de AdMob: `ca-app-pub-7620083100302566~7742704663`.
- ID de la unidad `Banner inferior visitantes`: `ca-app-pub-7620083100302566/2220669269`.
- ID de editor para `app-ads.txt`: `pub-7620083100302566`. Estos identificadores son públicos y no son credenciales.

## Alcance

### Incluye

- SDK nativo de AdMob, configuración Android, banner inferior, consentimiento requerido por Google y opción de privacidad cuando corresponda.
- Modo de anuncios de prueba global mediante un único booleano y una función de selección de unidades que debe usar también cualquier formato AdMob incorporado en el futuro; este plan solo muestra el banner.
- Ajuste responsivo y dinámico del espacio inferior según la altura real del anuncio.
- Lista manual de tareas externas que Leo hará antes de distribuir la versión con publicidad.

### No incluye

- Intersticiales, anuncios recompensados, publicidad en la SPA web, Firebase, cambios en autenticación o publicación en Google Play.
- Crear o publicar `app-ads.txt` ahora; Leo decidió posponerlo.
- Crear AAB, ejecutar pruebas o modificar Play Console durante la implementación de este plan, salvo pedido posterior de Leo.

## Mapa de cambios

| Archivo                                                         | Acción    | Símbolos principales                                                                                                                                                                    | Propósito                                                                                                        |
| --------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `package.json`, `package-lock.json`                             | Modificar | dependencia `@capacitor-community/admob`                                                                                                                                                | Habilitar la API TypeScript en `src/`                                                                            |
| `src-capacitor/package.json`, `src-capacitor/package-lock.json` | Modificar | dependencia `@capacitor-community/admob`                                                                                                                                                | Registrar el plugin nativo en el proyecto Android                                                                |
| `src-capacitor/android/app/src/main/AndroidManifest.xml`        | Modificar | `com.google.android.gms.ads.APPLICATION_ID`                                                                                                                                             | Declarar el ID de aplicación de AdMob                                                                            |
| `src-capacitor/android/app/src/main/res/values/strings.xml`     | Modificar | `admob_app_id`                                                                                                                                                                          | Mantener el ID de aplicación como recurso Android                                                                |
| `src/configuracion/configuracionPublicidad.ts`                  | Crear     | `PUBLICIDAD_DE_PRUEBA`, `ID_APLICACION_ADMOB_ANDROID`, `ID_BANNER_ADMOB_ANDROID`, `ID_BANNER_PRUEBA_ANDROID`, `obtenerConfiguracionSolicitudPublicidad`                                 | Reunir el interruptor global, los identificadores públicos y la selección común para formatos actuales o futuros |
| `src/composables/usePublicidad.ts`                              | Crear     | `usePublicidad`, `altoBanner`, `mostrarOpcionesPrivacidad`, `iniciarPublicidad`, `detenerPublicidad`                                                                                    | Encapsular consentimiento, ciclo de vida, visibilidad y altura del banner                                        |
| `src/layouts/MainLayout.vue`                                    | Modificar | `usePublicidad`, `q-footer`                                                                                                                                                             | Conectar sesión, plataforma y reserva inferior                                                                   |
| `src/pages/ConfiguracionPage.vue`                               | Modificar | acción de privacidad                                                                                                                                                                    | Dar acceso a las opciones de privacidad si Google lo exige                                                       |
| `src/css/Variables.css`, `src/css/app.css`                      | Modificar | `--alto-banner-publicidad`, `--separacion-banner-publicidad`, `--alto-reserva-publicidad`, `.navegacion-movil`, `.separacion-publicidad`, `.reserva-publicidad`, `.acciones-formulario` | Reservar el banner y separar físicamente sus clics de los botones                                                |
| `README.md`                                                     | Modificar | sección AdMob                                                                                                                                                                           | Explicar IDs, interruptor y pasos manuales previos a publicar                                                    |

## FASE 1: Preparar AdMob y el modo de prueba

### Objetivo

Instalar el plugin compatible y dejar dos configuraciones verificables: prueba segura y producción.

### Pasos de ejecución

- [x] Agregar `@capacitor-community/admob@8.2.1` a los dos paquetes donde se usa Capacitor: el paquete raíz, desde donde compila TypeScript, y `src-capacitor`, desde donde se sincroniza el plugin nativo. La versión 8.2.1 existe en npm y está documentada para Capacitor 8.5. Declarar también `@capacitor/core@^8.5.0` como dependencia directa en el paquete raíz, porque el nuevo composable importará `Capacitor` desde allí; ahora solo está disponible transitivamente. Actualizar ambos archivos lock con npm, que ya usa el proyecto; no incorporar otro plugin ni SDK manual duplicado.
  - Comprobar antes de instalar que la versión elegida sigue declarando compatibilidad con `@capacitor/core` 8.5 y Android API 24.
  - Registrar la necesidad de `npx cap sync android` desde `src-capacitor` para aplicar el plugin nativo. Al ser una sincronización del proyecto Android, ejecutarla solo si Leo solicita ese comando; en caso contrario, entregarlo como paso pendiente antes de compilar.
- [x] Crear `src/configuracion/configuracionPublicidad.ts`, siguiendo los nombres de archivo de `src/configuracion/`, sin efectos secundarios ni acceso a Capacitor, con cuatro constantes y una función exportadas:
  - `PUBLICIDAD_DE_PRUEBA: boolean = true` como **único interruptor global** que Leo cambia antes de generar la APK/AAB. `true` elige unidades de demostración e indica `isTesting: true` cuando el formato lo soporte; `false` elige las unidades reales e indica `isTesting: false`. Su valor queda incorporado al binario y exige recompilar. Ningún consumidor puede introducir otro booleano local para decidir prueba/producción.
  - `ID_APLICACION_ADMOB_ANDROID = 'ca-app-pub-7620083100302566~7742704663'`, como referencia para cotejar el recurso nativo.
  - `ID_BANNER_ADMOB_ANDROID = 'ca-app-pub-7620083100302566/2220669269'`.
  - `ID_BANNER_PRUEBA_ANDROID = 'ca-app-pub-3940256099942544/6300978111'`, unidad de demostración oficial para banner fijo Android. No usar anuncios reales en las pruebas de Leo; nunca usar `initializeForTesting: true` en una compilación de producción.
  - `obtenerConfiguracionSolicitudPublicidad(unidades: { produccion: string; prueba: string }): { adId: string; isTesting: boolean }`: devolver `adId` de `prueba` cuando `PUBLICIDAD_DE_PRUEBA` sea `true`, o `produccion` cuando sea `false`, y devolver ese mismo booleano como `isTesting`. Validar que ambas unidades recibidas sean cadenas no vacías y producir un error descriptivo si falta la correspondiente; no iniciar una solicitud real como alternativa silenciosa. El banner actual debe usar esta función con sus dos IDs. Al agregar intersticiales, videos recompensados u otro formato, sus IDs propios se pasan a la misma función, sin cambiar ni duplicar el interruptor. Si un formato no admite `isTesting`, usar su `adId` resultante y omitir esa propiedad.
- [x] Agregar `<string name="admob_app_id">ca-app-pub-7620083100302566~7742704663</string>` a `strings.xml` y el `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />` dentro de `<application>` en `AndroidManifest.xml`.
  - Mantener intactos `applicationId`, `namespace` y `appId` (`com.calculatupresupuesto.app`). No confundir el ID de aplicación, que contiene `~`, con el ID de unidad, que contiene `/`.
  - Criterio: el manifiesto apunta al mismo ID de aplicación anotado en la configuración.

## FASE 2: Consentimiento y ciclo de vida del banner

### Objetivo

Solicitar anuncios solo cuando Android, sesión y consentimiento lo permitan; reservar el lugar antes de mostrarlo y retirar la reserva al fallar u ocultarse.

### Pasos de ejecución

- [x] Crear `src/composables/usePublicidad.ts` con `usePublicidad()` como API para `MainLayout.vue` y `ConfiguracionPage.vue`. Mantener un único estado compartido en el módulo para evitar dos inicializaciones o banners simultáneos; los consumidores reciben las mismas referencias reactivas.
  - Exponer `altoBanner` como `Ref<number>` inicializada en `0` y expresada en píxeles lógicos; `mostrarOpcionesPrivacidad` como `Ref<boolean>` inicializada en `false`; `iniciarPublicidad(): Promise<void>`; `detenerPublicidad(): Promise<void>`; `abrirOpcionesPrivacidad(): Promise<void>`. El composable administra las referencias; `MainLayout` es propietario del inicio, retirada y listeners, mientras `ConfiguracionPage` solo lee el estado y abre opciones de privacidad.
  - El composable no decide si hay sesión: su consumidor observa `useAutenticacionStore().estaAutenticado`. Antes de acceder al plugin, exigir `Capacitor.getPlatform() === 'android'`. Para SPA web, todas las operaciones deben terminar sin llamar a AdMob y `altoBanner` debe permanecer `0`.
  - `iniciarPublicidad` debe impedir llamadas concurrentes, registrar `SizeChanged`, `Loaded` y `FailedToLoad` antes de `showBanner`, obtener información de consentimiento con `requestConsentInfo` en cada arranque elegible, mostrar el formulario si `status === REQUIRED` y está disponible, y continuar solo si `canRequestAds === true`. Actualizar `mostrarOpcionesPrivacidad` al comparar `privacyOptionsRequirementStatus` con `PrivacyOptionsRequirementStatus.REQUIRED`; ponerlo en `false` si se cierra sesión, no se requiere o falla la consulta.
  - Después del consentimiento, inicializar AdMob una sola vez. Obtener `adId` e `isTesting` con `obtenerConfiguracionSolicitudPublicidad({ produccion: ID_BANNER_ADMOB_ANDROID, prueba: ID_BANNER_PRUEBA_ANDROID })`; mostrar `BannerAdSize.BANNER` (320 × 50 dp), `BannerAdPosition.BOTTOM_CENTER` y margen inferior `0`. No usar tamaño adaptable ni posiciones dependientes del scroll. Antes de solicitarlo, comprobar que `window.innerWidth >= 320` en píxeles CSS (ancho lógico del WebView); si es menor, no mostrar ni reservar un banner que se recortaría. Escuchar `resize` mientras vive `MainLayout` para volver a evaluar la elegibilidad al rotar o redimensionar; retirar el listener al desmontar.
  - Justo antes de `showBanner`, reservar `altoBanner = 50` (píxeles lógicos) para evitar que los botones salten al cargarse el anuncio. El evento `SizeChanged` confirma o corrige esa altura; el banner no puede quedar visible sin la reserva. Si `showBanner` falla, llega `FailedToLoad` o `SizeChanged` informa `0`, restaurar `altoBanner = 0` y retirar el banner cuando corresponda. Una espera de carga puede mostrar temporalmente una reserva vacía; es preferible a que una publicidad tardía desplace un botón bajo el dedo.
  - Mantener una generación monotónica de solicitud y comprobarla después de cada `await` (consentimiento, inicialización, listeners y `showBanner`). `detenerPublicidad` incrementa la generación, espera o encadena la operación nativa en curso, llama `removeBanner()` si existe y limpia `altoBanner`; una solicitud antigua no puede reaparecer luego de iniciar sesión. Quitar los listeners al detener o desmontar el layout, y evitar duplicados al volver a cerrar sesión. Tratar rechazos de consentimiento, inicialización o carga sin bloquear la app.
  - `abrirOpcionesPrivacidad` solo debe abrir el formulario de Google en Android cuando `mostrarOpcionesPrivacidad` sea `true`; los errores se comunican con el patrón de notificaciones de Quasar.
- [x] En `src/layouts/MainLayout.vue`, importar `usePublicidad` y observar inmediatamente los cambios de `autenticacionStore.estaAutenticado` tras la inicialización del boot:
  - Sin sesión en Android: llamar `iniciarPublicidad()` una sola vez; con sesión: llamar `detenerPublicidad()`.
  - Al desmontar el layout, retirar banner y listeners. El inicio o cierre de sesión debe actuar sin requerir navegación o reinicio; si el inicio de sesión ocurre mientras el consentimiento nativo está abierto, al cerrarse ese formulario no se podrá solicitar ni mostrar anuncio.
  - Mantener la clase existente `aplicacion-presupuestos--modo-prueba`, que controla la marca de agua, sin mezclarla con `PUBLICIDAD_DE_PRUEBA`.
- [x] En `src/pages/ConfiguracionPage.vue`, agregar una acción visible de «Opciones de privacidad de anuncios» únicamente cuando Android, visitante y `mostrarOpcionesPrivacidad` indiquen que Google la exige; conectarla con `abrirOpcionesPrivacidad()`. No persistir esta preferencia en los datos de empresa ni en las copias JSON.
  - En AdMob, antes de solicitar anuncios reales, Leo deberá configurar y publicar los mensajes de privacidad que correspondan a los territorios de distribución. Si no hay consentimiento utilizable, no mostrar anuncio.

## FASE 3: Reservar el espacio inferior y documentar publicación

### Objetivo

Colocar la barra de botones inmediatamente encima del banner y conservar todas las acciones accesibles.

### Pasos de ejecución

- [x] En `MainLayout.vue`, conservar el `q-footer` móvil actual y añadir debajo de su `<nav>` una reserva visual para `altoBanner` más una franja no interactiva de `--espaciado-pequeno` cuando el banner esté solicitado o visible. El `q-footer` debe existir en Android de escritorio/tableta cuando `altoBanner > 0`, aunque no haya navegación móvil, para que Quasar reserve el espacio de la página. Con altura `0`, recuperar exactamente la distribución actual.
  - No dibujar un anuncio HTML: el plugin pinta el banner nativo encima del WebView, fijo en `BOTTOM_CENTER` y centrado por el plugin. La reserva es exclusivamente espacio de diseño y se extiende en el ancho del `q-footer` para permitir que Quasar mida su altura. La franja separadora va **encima** de los 50 dp reservados para el anuncio, por lo que no desplaza el anuncio del borde inferior. Mantener el área segura actual de la navegación móvil.
  - Evitar que la reserva capture clics o reciba foco. Comprobar que la página puede desplazarse hasta sus últimos controles.
- [x] Definir en `src/css/Variables.css` `--alto-banner-publicidad: 0px`, `--separacion-banner-publicidad: 0px` y `--alto-reserva-publicidad: calc(var(--alto-banner-publicidad) + var(--separacion-banner-publicidad))`. En `MainLayout.vue`, establecer por estilo del `q-layout` el primer token desde `altoBanner` y el segundo como `var(--espaciado-pequeno)` solo si `altoBanner > 0`; de lo contrario `0px`. Declarar en `src/css/app.css` únicamente clases semánticas y reutilizar los tokens existentes.
  - Debajo del `<nav>` móvil, usar un elemento `aria-hidden="true"` no interactivo para la franja con altura `var(--separacion-banner-publicidad)` y otro para la reserva nativa con altura `var(--alto-banner-publicidad)`; en escritorio Android, el `q-footer` contiene ambos sin `<nav>`. Los cuatro enlaces quedan arriba del banner y de la franja, sin reducir su altura táctil actual. Separar visualmente el anuncio de los botones con el borde/fondo existentes. No agregar margen al `BannerAdOptions` nativo: tiene que permanecer abajo del todo y centrado.
  - Ajustar `.formulario-configuracion .acciones-formulario`: en escritorio Android, `bottom: var(--alto-reserva-publicidad)`; dentro de la regla móvil existente, `bottom: calc(var(--altura-navegacion-movil) + env(safe-area-inset-bottom) + var(--alto-reserva-publicidad))`. Así la franja y el banner se consideran una sola vez. Revisar otras acciones fijas o adhesivas afectadas por el pie.
  - Si el banner falla o se oculta por sesión, restaurar `0px` y quitar la reserva y franja. No dejar un hueco permanente en web ni para usuarios autenticados. Evitar que el pie o la página impongan un ancho distinto del centro de pantalla al banner nativo.
- [x] Añadir al `README.md` una sección breve de operación:
  - Diferenciar ID de aplicación, ID de unidad y editor; indicar la ruta del interruptor y que `true` debe usarse para APK de prueba y `false` para AAB de publicación. Toda unidad futura de video u otro formato deberá aportar sus IDs real y de demostración a `obtenerConfiguracionSolicitudPublicidad`; el único cambio global para volver a modo de prueba seguirá siendo `PUBLICIDAD_DE_PRUEBA = true`.
  - Recordar que `app-ads.txt` sigue pendiente por decisión de Leo: el sitio del desarrollador en Play debe exponer en la raíz un archivo con la línea `google.com, pub-7620083100302566, DIRECT, f08c47fec0942fa0`; después, volver a pulsar «Verificar si hay actualizaciones» en AdMob. No incluir una URL de dominio todavía porque no está definida.
  - Antes de subir la versión con publicidad, revisar la declaración «Seguridad de los datos», los mensajes de privacidad y la política de privacidad en Play Console. Leo hará esos cambios cuando tenga el AAB listo; no asumir que la declaración actual de «No se recopilan datos» seguirá siendo correcta.

## FASE TESTING

### Objetivo

Validar que los anuncios sean seguros durante pruebas, visibles solo para visitantes y que nunca tapen la interfaz. Según `AGENTS.md`, CH no ejecutará estos comandos ni pruebas sin pedido explícito de Leo.

### Pruebas automatizadas y revisión técnica

- [x] Si Leo lo solicita, ejecutar `npm run typecheck` y `npm run lint:check` desde la raíz; corregir errores relevantes. No ejecutar `npm run lint`, pues modifica archivos.
- [x] Si Leo lo solicita, compilar y sincronizar Android mediante `npm run build:android` y verificar que el plugin aparezca en el proyecto nativo. No modificar versiones ni crear AAB de publicación sin pedido de Leo.
- [x] Revisar el resultado del paquete: manifiesto con el ID `~7742704663`; `obtenerConfiguracionSolicitudPublicidad` debe devolver la unidad de Google y `isTesting: true` cuando `PUBLICIDAD_DE_PRUEBA === true`, y `/2220669269` con `isTesting: false` cuando sea `false`. Confirmar que el modo real no se activa por error en una APK de prueba y que los dos estados dependen del mismo booleano. Una futura unidad de video debe consumir este contrato, no crear otro interruptor.

Resultado del 28 de octubre de 2026: `typecheck`, `lint:check`, compilaciones SPA y Android y APK debug pasaron. La APK se instaló por USB. La navegación principal abrió Inicio, Presupuestos, Clientes, Más y Configuración. La sesión se conservó al reabrir la app sin consultar AdMob; al cerrar sesión se consultó nuevamente. La validación visual del banner sigue pendiente: AdMob devolvió `Publisher misconfiguration` porque no hay formularios de consentimiento configurados para el ID de aplicación. La app no mostró anuncio ni dejó espacio vacío.

### Pruebas manuales en el celular

- [ ] Con `PUBLICIDAD_DE_PRUEBA = true` y sin sesión, abrir la APK: el banner de prueba debe quedar abajo del todo y centrado, debajo de la franja no interactiva y de los cuatro botones. Durante la carga puede verse la reserva de 50 dp para evitar desplazamientos; ante fallo o falta de consentimiento la reserva desaparece.
- [ ] Iniciar sesión con el banner visible: debe desaparecer el anuncio y el espacio inferior. Cerrar sesión: debe volver a mostrarse según consentimiento y conexión. Reabrir la app con sesión persistida: no debe solicitar ni mostrar anuncios.
- [ ] Denegar o no completar el consentimiento cuando corresponda: no debe haber solicitud de anuncio ni espacio reservado. Si Google exige una entrada para cambiar preferencias, comprobar que aparece en Configuración y abre el formulario.
- [ ] Simular falta de red o error de carga: navegación, formularios y datos deben seguir funcionando; el pie debe quitar la reserva al confirmarse el fallo. Repetir tras girar el teléfono y al volver de segundo plano: el anuncio sigue centrado y anclado al borde inferior cuando se muestra.
- [ ] Recorrer Inicio, Presupuestos, Clientes, Materiales, Configuración y vista previa; verificar los últimos controles al desplazarse y especialmente las acciones adhesivas de Configuración.

### Casos responsivos

- [ ] En Android, revisar teléfono angosto, teléfono en horizontal y tableta/ancho `md` o mayor: banner centrado respecto de **toda la pantalla** y anclado al borde inferior, no centrado en el espacio a la derecha del menú lateral; navegación móvil o menú lateral según corresponda, sin solapar controles ni la barra del sistema. En una ventana más estrecha que 320 dp, no mostrar ni recortar el banner; si vuelve a ensancharse, solicitarlo de nuevo sin duplicarlo.
- [ ] En SPA web, revisar móvil y escritorio con y sin sesión: no debe haber anuncios, inicialización del SDK ni espacio adicional.

## Progreso del plan

- [x] Fase 1: Preparar AdMob y el modo de prueba
- [x] Fase 2: Consentimiento y ciclo de vida del banner
- [x] Fase 3: Reservar el espacio inferior y documentar publicación
- [ ] Fase Testing

Fecha de creación: 27 de octubre de 2026
Fecha de última actualización: 28 de octubre de 2026
Estado: IMPLEMENTADO, PENDIENTE DE FORMULARIO ADMOB Y VALIDACIÓN DEL BANNER
