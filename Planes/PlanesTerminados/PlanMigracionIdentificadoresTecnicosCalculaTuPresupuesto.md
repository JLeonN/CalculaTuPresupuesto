# PLAN MIGRACIÓN DE IDENTIFICADORES TÉCNICOS DE CALCULA TU PRESUPUESTO

## Descripción del plan

Eliminar los identificadores técnicos heredados de Mallic Tesla antes de publicar la aplicación en Play Store. La migración abarcará almacenamiento local, paquete npm, ruta pública web, repositorio GitHub, carpeta local y proyecto Android.

La aplicación no fue instalada ni publicada en Android, por lo que el cambio de `appId` se realizará como una sustitución limpia. Los datos usados desde el navegador se conservarán mediante una migración automática de claves que copiará y verificará cada valor antes de eliminar su clave anterior.

## Objetivo principal

- Usar `calcula-tu-presupuesto` como identificador técnico general del proyecto.
- Usar `com.calculatupresupuesto.app` como identificador definitivo de Android.
- Publicar la SPA desde el repositorio `JLeonN/CalculaTuPresupuesto` bajo la ruta `/CalculaTuPresupuesto/`.
- Conservar los datos del navegador al migrar las claves `mallic-tesla:*` a `calcula-tu-presupuesto:*`.
- Renombrar la carpeta local a `C:/Z-Programacion/Quasar/CalculaTuPresupuesto`.

## Reglas del plan

- No modificar la estructura ni el contenido JSON de configuración, clientes, materiales o presupuestos durante la migración de claves.
- Mantener la versión `v1` de cada clave porque el esquema de sus datos no cambia.
- No eliminar una clave anterior hasta confirmar que el mismo valor fue escrito y puede recuperarse desde la clave nueva.
- Considerar la clave nueva como fuente autoritativa cuando existan ambas claves.
- No mantener una redirección para la URL antigua de GitHub Pages; la aplicación pasará a usar únicamente `/CalculaTuPresupuesto/`.
- Conservar las referencias históricas en planes terminados, el logo anterior sin uso, el mensaje exacto de migración y la ruta del contexto comercial `C:/Z-Programacion/SolucionesAMedida/Clientes/MallicTesla`.
- No renombrar ni modificar la carpeta comercial externa.
- No instalar dependencias nuevas para ejecutar esta migración.
- No ejecutar `git add`, commit ni push sin una solicitud explícita de Leo.
- Renombrar el repositorio remoto únicamente después de validar el código local y contar con un estado Git adecuado para la operación.
- Renombrar la carpeta local como último cambio de ubicación y reabrir el repositorio desde la ruta nueva antes de continuar.

## FASE 1: Centralizar identificadores y claves

### Objetivo

Definir una única fuente para los identificadores nuevos y para la relación temporal con las claves anteriores.

- [x] Crear `src/configuracion/clavesAlmacenamiento.ts` con las claves nuevas y sus equivalencias anteriores.
- [x] Definir `calcula-tu-presupuesto:configuracion:v1` como clave nueva de Configuración.
- [x] Definir `calcula-tu-presupuesto:clientes:v1` como clave nueva de Clientes.
- [x] Definir `calcula-tu-presupuesto:materiales:v1` como clave nueva de Materiales.
- [x] Definir `calcula-tu-presupuesto:presupuestos:v1` como clave nueva de Presupuestos.
- [x] Mantener las cuatro claves `mallic-tesla:*` únicamente como constantes privadas de compatibilidad para la migración.
- [x] Sustituir las constantes de claves duplicadas en los cuatro repositorios locales por importaciones desde la configuración central.
- [x] Confirmar que ningún repositorio cambie sus validaciones, normalización ni formato de serialización actual.

## FASE 2: Implementar la migración segura del almacenamiento

### Objetivo

Conservar los datos existentes del navegador y permitir que la misma estrategia funcione con Capacitor Preferences sin perder información ante una operación incompleta.

- [x] Agregar `eliminar(clave)` al contrato `AlmacenamientoClaveValor`.
- [x] Implementar `eliminar()` mediante `window.localStorage.removeItem()` en `AlmacenamientoLocalNavegador`.
- [x] Implementar `eliminar()` mediante `Preferences.remove()` en `AlmacenamientoPreferenciasCapacitor`.
- [x] Crear un adaptador de almacenamiento responsable de migrar claves anteriores a sus equivalentes nuevas.
- [x] Leer primero la clave nueva y usarla como fuente autoritativa cuando ya contenga un valor.
- [x] Si existen la clave nueva y la anterior, devolver la nueva e intentar limpiar la anterior sin impedir el funcionamiento si la eliminación falla.
- [x] Si solo existe la clave anterior, copiar su texto exacto a la nueva sin deserializar ni modificar el contenido.
- [x] Leer nuevamente la clave nueva y comparar el valor exacto antes de eliminar la anterior.
- [x] Si la escritura o verificación falla, conservar y devolver el valor anterior para que la aplicación continúe funcionando y reintente la migración en una carga posterior.
- [x] Si la eliminación falla después de una copia válida, usar la clave nueva y volver a intentar la limpieza en cargas posteriores.
- [x] Crear una fábrica común para seleccionar Local Storage o Capacitor Preferences y envolverlo con el adaptador de migración.
- [x] Reutilizar la fábrica común en Configuración, Clientes, Materiales y Presupuestos para retirar la selección de plataforma duplicada.
- [x] Confirmar que guardar, editar o eliminar registros escriba exclusivamente en las claves nuevas después de la primera carga.

## FASE 3: Migrar identificadores web y del proyecto

### Objetivo

Alinear los metadatos técnicos y la compilación SPA con el nombre definitivo del repositorio.

- [x] Cambiar `package.json.name` de `mallic-tesla` a `calcula-tu-presupuesto`.
- [x] Regenerar o actualizar `package-lock.json` mediante npm para que el nombre raíz coincida sin alterar versiones de dependencias.
- [x] Cambiar el `publicPath` productivo de Quasar a `/CalculaTuPresupuesto/` y mantener `/` en desarrollo y Capacitor.
- [x] Cambiar el identificador Electron residual de `mallic-tesla` a `com.calculatupresupuesto.app`, aunque Electron no forme parte de la publicación actual.
- [x] Confirmar que el workflow de GitHub Pages siga compilando `dist/spa` y no contenga rutas antiguas codificadas.
- [x] Verificar en la compilación SPA que scripts, estilos, imágenes y favicon usen el prefijo `/CalculaTuPresupuesto/`.
- [x] Confirmar que Vue Router conserve el modo hash y que las rutas internas no dependan del nombre anterior.

## FASE 4: Migrar el identificador Android

### Objetivo

Generar una aplicación Android limpia con `com.calculatupresupuesto.app` antes de su primera instalación o publicación.

- [x] Cambiar `appId` en `src-capacitor/capacitor.config.ts` a `com.calculatupresupuesto.app`.
- [x] Cambiar `namespace` y `applicationId` en `src-capacitor/android/app/build.gradle` a `com.calculatupresupuesto.app`.
- [x] Mover `MainActivity.java` desde `java/com/mallictesla/presupuestos/` a `java/com/calculatupresupuesto/app/`.
- [x] Cambiar la declaración `package` de `MainActivity.java` a `com.calculatupresupuesto.app`.
- [x] Cambiar `package_name` y `custom_url_scheme` en `strings.xml` a `com.calculatupresupuesto.app`.
- [x] Buscar el identificador anterior en todo `src-capacitor` y actualizar cualquier referencia nativa adicional que aparezca.
- [x] Eliminar únicamente los directorios Java anteriores que queden vacíos después de mover `MainActivity.java`.
- [x] Ejecutar una compilación Android limpia para evitar que recursos generados o cachés conserven el paquete anterior.
- [x] Inspeccionar el APK con `aapt dump badging` y confirmar el paquete `com.calculatupresupuesto.app` y la etiqueta `Calcula tu presupuesto`.
- [ ] Confirmar que íconos, splash, FileProvider y navegación sigan funcionando con el nuevo `applicationId`.

## FASE 5: Actualizar documentación y clasificar referencias restantes

### Objetivo

Dejar las instrucciones del repositorio coherentes sin borrar el historial comercial necesario.

- [x] Cambiar el título técnico de `AGENTS.md` a `Calcula tu presupuesto`.
- [x] Reemplazar en `AGENTS.md` la restricción antigua del `appId` por `com.calculatupresupuesto.app` y documentar que no debe cambiarse después de publicar.
- [x] Mantener en `AGENTS.md` la ruta comercial externa de Mallic Tesla como referencia histórica autorizada.
- [x] Actualizar `README.md` con el paquete npm, ruta pública, repositorio y `appId` definitivos.
- [x] Retirar de `README.md` la sección que presenta estos identificadores como una migración pendiente.
- [x] Documentar brevemente la migración automática de las claves locales para futuras tareas de mantenimiento.
- [x] Buscar `mallic-tesla`, `MallicTesla`, `com.mallictesla` y variantes de mayúsculas en todos los archivos de ejecución y documentación activa.
- [x] Clasificar cada coincidencia restante como clave privada de migración, mensaje exacto de migración, recurso histórico, plan histórico o ruta comercial autorizada.
- [x] Confirmar que ningún identificador anterior pueda convertirse en el nombre de un paquete, ruta compilada, namespace o aplicación nueva.

## FASE 6: Renombrar GitHub y la carpeta local

### Objetivo

Completar el cambio de ubicación remota y local sin perder el historial Git ni dejar procesos apuntando a rutas anteriores.

- [x] Confirmar que el repositorio remoto actual sea `JLeonN/MallicTesla` y que la rama principal sea `main`.
- [ ] Verificar que el nombre `JLeonN/CalculaTuPresupuesto` esté disponible antes de modificar el repositorio remoto.
- [ ] Renombrar el repositorio desde la configuración web de GitHub a `CalculaTuPresupuesto`, ya que GitHub CLI no está instalado.
- [ ] Actualizar `origin` a `https://github.com/JLeonN/CalculaTuPresupuesto.git` y verificar fetch y push URL.
- [x] No depender de una redirección de `/MallicTesla/`, porque GitHub no redirige las URLs de sitios Pages de proyecto después de renombrar el repositorio.
- [ ] Ejecutar el push únicamente cuando Leo lo solicite de forma explícita.
- [ ] Después del push autorizado, verificar que GitHub Actions finalice correctamente y obtener la URL publicada desde el resultado del deployment.
- [ ] Abrir la nueva URL de Pages y confirmar que responde desde `/CalculaTuPresupuesto/` con todos sus recursos.
- [ ] Detener servidores de desarrollo, compilaciones y procesos que estén usando la carpeta local.
- [ ] Verificar que `C:/Z-Programacion/Quasar/MallicTesla` sea el origen exacto y que `C:/Z-Programacion/Quasar/CalculaTuPresupuesto` no exista antes de renombrar.
- [ ] Renombrar la carpeta desde `C:/Z-Programacion/Quasar` sin mover ni eliminar otros proyectos.
- [ ] Reabrir el repositorio desde `C:/Z-Programacion/Quasar/CalculaTuPresupuesto` y confirmar que `git status`, `origin` y la rama `main` sean correctos.

## FASE 7: Cerrar la tarea pendiente

### Objetivo

Actualizar el seguimiento solamente cuando la migración técnica y sus pruebas hayan terminado.

- [ ] Confirmar que todas las fases y checks de testing estén completos.
- [ ] Eliminar de `Planes/PlanesFuturos/TareasPendientes.md` la tarea `Migración de identificadores técnicos de Mallic Tesla` mediante la skill `tareas-pendientes`.
- [ ] Mantener este plan como registro de por qué las constantes privadas y referencias históricas anteriores todavía pueden aparecer en búsquedas.
- [ ] Cambiar el estado del plan a `COMPLETADO` y actualizar la fecha de última actualización.

## FASE TESTING

### Objetivo

Validar la conservación de los datos web, la nueva identidad técnica, las compilaciones y las ubicaciones definitivas.

- [ ] Preparar en Local Storage datos válidos bajo las cuatro claves `mallic-tesla:*` y confirmar que las claves nuevas todavía no existan.
- [ ] Iniciar la aplicación y comprobar que Configuración, Clientes, Materiales y Presupuestos recuperen exactamente los datos anteriores.
- [ ] Confirmar que las cuatro claves `calcula-tu-presupuesto:*` contengan el mismo texto que tenían las claves anteriores.
- [ ] Confirmar que cada clave anterior se elimine únicamente después de verificar su copia nueva.
- [x] Preparar simultáneamente una clave nueva y una anterior con valores diferentes y comprobar que prevalezca la nueva.
- [x] Simular un fallo de escritura o eliminación con un almacenamiento controlado y comprobar que nunca se pierda el valor anterior.
- [x] Recargar la aplicación y confirmar que la migración sea idempotente y no duplique ni restablezca datos.
- [ ] Crear, editar y eliminar datos después de la migración y comprobar que solo cambien las claves nuevas.
- [x] Ejecutar `npm run lint:check`.
- [x] Ejecutar `npm run typecheck`.
- [x] Ejecutar `npm run build`.
- [x] Revisar `dist/spa/index.html` y los recursos compilados para confirmar `/CalculaTuPresupuesto/` y la ausencia de `/MallicTesla/`.
- [x] Ejecutar `npm run build:android` desde una compilación nativa limpia.
- [x] Confirmar mediante `aapt` que el APK use `com.calculatupresupuesto.app` y no contenga `com.mallictesla.presupuestos`.
- [ ] Instalar el APK en un dispositivo de prueba y comprobar apertura, splash, ícono, navegación y persistencia nueva.
- [ ] Verificar que la nueva página de GitHub Pages cargue directamente y al recargar rutas con hash.
- [ ] Ejecutar la búsqueda final de identificadores anteriores y documentar todas las excepciones permitidas.
- [ ] Confirmar que la carpeta anterior ya no exista y que la carpeta nueva conserve el historial Git completo.

## Progreso del plan

- [x] Fase 1: Centralizar identificadores y claves
- [x] Fase 2: Implementar la migración segura del almacenamiento
- [x] Fase 3: Migrar identificadores web y del proyecto
- [ ] Fase 4: Migrar el identificador Android
- [x] Fase 5: Actualizar documentación y clasificar referencias restantes
- [ ] Fase 6: Renombrar GitHub y la carpeta local
- [ ] Fase 7: Cerrar la tarea pendiente
- [ ] Fase Testing

## Registro de ejecución

- La migración se validó con almacenamiento controlado para copia exacta, prioridad de la clave nueva, fallos de escritura y eliminación e idempotencia.
- `lint:check`, TypeScript, la SPA y una compilación Android limpia finalizaron correctamente.
- El APK release sin firmar declara `com.calculatupresupuesto.app`, `com.calculatupresupuesto.app.MainActivity` y la etiqueta `Calcula tu presupuesto`.
- La instalación física queda pendiente porque no hay un dispositivo Android USB en estado `device`.
- Las pruebas visuales y de Local Storage dentro de la SPA quedan pendientes porque no hay un navegador controlable conectado.
- No se encontró un repositorio público en `JLeonN/CalculaTuPresupuesto`; la comprobación autenticada queda pendiente y el repositorio actual continúa siendo `JLeonN/MallicTesla` sobre `main`.
- El renombrado remoto, la actualización de `origin`, GitHub Pages y la carpeta local permanecen pendientes; no se ejecutó commit ni push.

Fecha de creación: 24 de Agosto 2026
Fecha de última actualización: 24 de Agosto 2026
Estado: EN PROCESO
