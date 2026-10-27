# COPIAS DE SEGURIDAD JSON E IMPORTACIÓN SEGURA

## Descripción del plan

Agregar en Configuración una sección «Seguridad» para guardar y recuperar manualmente los datos locales de Calcula tu presupuesto. La copia será un único JSON portable. La importación agregará solamente registros completos que no existan por identificador; jamás mezclará campos de un registro antiguo con uno actual, sobrescribirá registros existentes ni eliminará datos ausentes del archivo. Ambas acciones requerirán una sesión iniciada. El formato quedará separado de las claves de almacenamiento actuales para que el futuro módulo de Firebase pueda leer las mismas copias.

## Objetivo principal

- Descargar o compartir una copia completa de clientes, materiales, presupuestos y configuración guardada, con identificadores, relaciones, fechas y datos anidados intactos.
- Detectar datos locales o archivos de copia dañados y detener la operación sin presentarlos como listas vacías.
- Previsualizar una importación y agregar únicamente registros ausentes; conservar íntegros los actuales, aunque la copia sea más antigua.
- Ofrecer el flujo en la web y Android, desde Configuración y con inicio de sesión obligatorio.

## Contexto técnico verificado

- `AGENTS.md` exige español, TypeScript estricto, Vue 3 con `<script setup>`, tokens visuales en `src/css/Variables.css`, aprobación antes de implementar y ninguna ejecución de la app, pruebas, linters o compilaciones sin pedido explícito de Leo.
- En web `crearAlmacenamientoAplicacion()` usa `localStorage`; en Android usa Capacitor Preferences. `CLAVES_ALMACENAMIENTO` separa clientes, materiales, presupuestos y configuración. `AlmacenamientoConMigracionClaves` reconoce las claves históricas `mallic-tesla:*`.
- Los repositorios implementan contratos asíncronos. Clientes y materiales hoy convierten JSON ilegible o una estructura inesperada en `[]`; configuración puede volver a valores iniciales; presupuestos ya rechaza archivos ilegibles y recupera modelos históricos. El respaldo no debe inferir «sin datos» a partir de un fallo.
- `Cliente` conserva teléfonos y locales con teléfonos; `Material` conserva múltiples precios; `Presupuesto` conserva estado, fechas, destinatario y líneas completas, además de una copia de la configuración del documento. Los vínculos usan `idCliente`; una referencia histórica puede apuntar a un cliente o material eliminado y debe seguir siendo válida.
- `Configuracion` contiene logo como `datosUrl`, métodos de pago y otros datos sensibles. `sesionPrueba` y `actualizacionVista` son estado técnico y no pertenecen a la copia. Las credenciales provisionales provienen de variables de entorno y tampoco deben exportarse.
- `src/pages/ConfiguracionPage.vue` muestra `FormularioConfiguracion.vue`; todavía no existe sección «Seguridad». Conviene crear un panel independiente fuera del `q-form` para que importar o descargar no envíe cambios sin guardar en el formulario.
- `useAutenticacionStore` expone `estaAutenticado`, `inicializarSesion()` y `solicitarInicioSesion()`. `ModalInicioSesion.vue` ya está montado en `App.vue`. El acceso provisional no es una barrera de seguridad de producción; Firebase Authentication y reglas de Firestore se planificarán aparte.
- Ya están instalados `@capacitor/filesystem` y `@capacitor/share`. El PDF muestra un patrón web con `Blob` y URL temporal, y un patrón Android con `Filesystem` y `Share`. El selector de logo usa un `input type="file"`, reutilizable como patrón de lectura.
- `package.json` ofrece `npm run lint:check`, `npm run typecheck`, `npm run build` y `npm run build:android`; no hay infraestructura de pruebas unitarias. Leo realiza las pruebas y decide si autoriza ejecutar comandos.

## Alcance

### Incluye

- Corregir las lecturas silenciosas de clientes, materiales y configuración para que un dato ilegible impida crear un respaldo incompleto o importar sobre un estado desconocido, manteniendo las migraciones históricas válidas.
- Definir, validar, crear y leer la versión 1 de un JSON de respaldo independiente de `localStorage`, Preferences y futuras rutas de Firestore.
- Exportar todos los registros, sin límites de paginación, búsquedas ni filtros; importar por ID sin sobrescribir registros existentes.
- Mostrar fecha, cantidades y resultado previsto; exigir sesión en la interfaz y nuevamente al ejecutar las operaciones.
- Guardar la copia mediante descarga web y, en Android, compartirla a un destino elegido por Pablo fuera de la app.

### No incluye

- Excel, PDF de respaldo, sincronización automática, avisos periódicos, cifrado con contraseña, importación desde otros formatos ni Firebase.
- Reemplazar o fusionar campos de registros existentes, recuperar versiones anteriores de un mismo ID, eliminar registros locales o restaurar la sesión provisional.
- Cambiar el paquete Android, las claves actuales o el esquema funcional de clientes, materiales y presupuestos.

## Mapa de cambios

| Archivo                                                                                          | Acción                       | Símbolos principales                                                                          | Propósito                                                                |
| ------------------------------------------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/dominio/clientes.ts`                                                                        | Modificar                    | `esClienteGuardado`                                                                           | Validar clientes y estructuras anidadas.                                 |
| `src/dominio/materiales.ts`                                                                      | Modificar                    | `esMaterialGuardado`                                                                          | Validar materiales y todos sus precios.                                  |
| `src/dominio/presupuestos.ts`                                                                    | Modificar                    | `esPresupuestoGuardado`                                                                       | Completar la validación de líneas, opciones y configuración histórica.   |
| `src/dominio/configuracion.ts`                                                                   | Modificar                    | `migrarConfiguracionAnterior`, guardia de formato anterior                                    | Rechazar objetos arbitrarios sin romper migraciones válidas.             |
| `src/dominio/respaldo.ts`                                                                        | Crear                        | `RespaldoDatos`, `ResumenImportacion`, `crearRespaldo`, `validarRespaldo`, `compararRespaldo` | Contrato versionado, validación integral y comparación pura.             |
| `src/repositorios/clientes/RepositorioClientes.ts`, `RepositorioClientesLocal.ts`                | Modificar                    | `agregarFaltantes`, `obtenerTodos`                                                            | Lectura segura e inserción por lotes sin sobreescritura.                 |
| `src/repositorios/materiales/RepositorioMateriales.ts`, `RepositorioMaterialesLocal.ts`          | Modificar                    | `agregarFaltantes`, `obtenerTodos`                                                            | Misma garantía para materiales.                                          |
| `src/repositorios/presupuestos/RepositorioPresupuestos.ts`, `RepositorioPresupuestosLocal.ts`    | Modificar                    | `agregarFaltantes`, `obtenerTodos`                                                            | Misma garantía para presupuestos, preservando la recuperación histórica. |
| `src/repositorios/configuracion/RepositorioConfiguracion.ts`, `RepositorioConfiguracionLocal.ts` | Modificar                    | `obtenerGuardada`, `guardarSiAusente`                                                         | Distinguir configuración nunca guardada de configuración existente.      |
| `src/servicios/respaldo/ServicioRespaldo.ts`                                                     | Crear                        | `generarRespaldo`, `previsualizarImportacion`, `importarFaltantes`                            | Coordinar repositorios sin depender de claves o de Pinia.                |
| `src/servicios/respaldo/archivosRespaldo.ts`                                                     | Crear                        | `descargarArchivoRespaldo`, `crearNombreArchivoRespaldo`                                      | Descargar en web o abrir destino externo en Android.                     |
| `src/components/configuracion/PanelCopiasSeguridad.vue`                                          | Crear                        | `descargarCopia`, `seleccionarCopia`, `confirmarImportacion`                                  | Interfaz y estados de respaldo, importación y confirmación.              |
| `src/pages/ConfiguracionPage.vue`                                                                | Modificar                    | montaje de `PanelCopiasSeguridad`                                                             | Agregar sección «Seguridad» después del formulario.                      |
| `src/components/configuracion/FormularioConfiguracion.vue`                                       | Modificar                    | `cambiosPendientes`                                                                           | Avisar a la página si hay edición sin guardar antes de importar.         |
| `src/components/autenticacion/ModalInicioSesion.vue`                                             | Modificar                    | texto de ayuda                                                                                | Incluir copias de seguridad entre las acciones que requieren sesión.     |
| `src/css/app.css`                                                                                | Modificar                    | clases del panel                                                                              | Adaptar controles, resumen y mensajes a teléfono y escritorio.           |
| `src/css/Variables.css`                                                                          | Modificar solo si hace falta | tokens semánticos                                                                             | Evitar valores visuales reutilizables dispersos.                         |
| `README.md`                                                                                      | Modificar                    | sección de copias de seguridad                                                                | Documentar alcance, resguardo externo y futura migración.                |

## FASE 1: Asegurar las lecturas y definir el formato

### Objetivo

Ningún dato local ilegible debe convertirse silenciosamente en una lista vacía, y el archivo debe conservar toda la información necesaria sin depender del medio de almacenamiento.

### Archivos y símbolos involucrados

- `src/dominio/clientes.ts`: `Cliente`, `TelefonoCliente`, `LocalCliente`, nuevo `esClienteGuardado(valor: unknown): valor is Cliente`.
- `src/dominio/materiales.ts`: `Material`, `PrecioMaterial`, nuevo `esMaterialGuardado(valor: unknown): valor is Material`.
- `src/dominio/presupuestos.ts`: `esPresupuestoGuardado`, `recuperarPresupuestoGuardado`.
- `src/dominio/configuracion.ts`: `esConfiguracionGuardada`, `migrarConfiguracionAnterior`.
- Los cuatro repositorios locales y sus interfaces.

### Pasos de ejecución

- [x] Añadir validadores para cliente completo, teléfonos, locales, material completo y precios. Comprobar tipos, arrays anidados, moneda/modalidad/unidades admitidas, IDs no vacíos y fechas existentes. Mantener únicamente la compatibilidad histórica comprobada: `local.telefonos` ausente se interpreta como `[]`; no completar otros campos desconocidos de manera silenciosa.
  - Rechazar IDs duplicados dentro de cada colección y dentro de hijos de un mismo registro; no deduplicar por nombre o teléfono.
  - Revisar `esPresupuestoGuardado`: hoy no valida toda la estructura de `opcionesUnidad`, `opcionesPrecio` y `configuracionDocumento`. Completarla sin alterar `recuperarPresupuestoGuardado` ni perder presupuestos históricos válidos.
- [x] Cambiar `RepositorioClientesLocal.obtenerTodos()` y `RepositorioMaterialesLocal.obtenerTodos()`: solo `null` significa colección vacía; JSON ilegible, elemento inválido o estructura distinta de array debe lanzar error explícito. Los stores actuales deben conservar su manejo de error, sin mostrar esos datos como vacíos al servicio de respaldo.
- [x] Ajustar `RepositorioConfiguracionLocal.obtener()` para distinguir ausencia (`null`, configuración inicial), migración histórica reconocida y contenido inválido (error). Restringir `migrarConfiguracionAnterior` a la forma histórica reconocible; un objeto arbitrario no puede transformarse en configuración inicial y después guardarse. Verificar que sus migraciones de moneda, porcentaje y mensaje sigan funcionando.
- [x] Crear `src/dominio/respaldo.ts` sin importar `localStorage`, Capacitor ni Pinia. Definir `TIPO_RESPALDO = 'calcula-tu-presupuesto-respaldo'`, `VERSION_FORMATO_RESPALDO = 1` y `RespaldoDatos` con `tipo`, `versionFormato`, `fechaExportacion` ISO y `datos: { configuracion: Configuracion | null; clientes: Cliente[]; materiales: Material[]; presupuestos: Presupuesto[] }`.
  - `crearRespaldo(datos, fecha = new Date()): RespaldoDatos` preserva IDs, fechas, estados, teléfonos, locales, precios, líneas, opciones y configuraciones históricas; no incluye claves de almacenamiento, sesión ni preferencias de interfaz.
  - `validarRespaldo(valor: unknown): RespaldoDatos` debe rechazar archivo truncado, tipo o versión no admitidos, campos obligatorios ausentes, objetos anidados inválidos e IDs repetidos. No corregir ni descartar registros al importar. Permitir referencias históricas a clientes/materiales eliminados porque los presupuestos conservan su propia copia.
  - Documentar explícitamente que la versión del formato es independiente de la versión de la app. Las versiones futuras deberán migrar archivos antiguos mediante funciones dedicadas, sin cambiar el significado de la versión 1.

## FASE 2: Preparar la importación no destructiva

### Objetivo

Importar la misma copia cualquier cantidad de veces sin duplicar ni sobrescribir datos actuales.

### Archivos y símbolos involucrados

- `src/dominio/respaldo.ts`: `ResumenImportacion`, `compararRespaldo`.
- Interfaces y clases de los cuatro repositorios.
- Nuevo `src/servicios/respaldo/ServicioRespaldo.ts`.

### Pasos de ejecución

- [x] Definir `ResumenImportacion` con cantidades por clientes, materiales y presupuestos: `nuevos`, `existentesIguales`, `existentesDistintos`; para configuración, `seAgrega`, `yaExisteIgual`, `yaExisteDistinta` o `sinDatosEnCopia`. `compararRespaldo(respaldo, datosActuales)` usa el ID del registro completo; la comparación de contenido debe ser estable ante el orden de las claves JSON. Un cliente existente se conserva entero, incluidos teléfonos y locales, aunque el archivo contenga hijos que ya no figuren en la versión actual.
- [x] Extender `RepositorioClientes`, `RepositorioMateriales` y `RepositorioPresupuestos` con `agregarFaltantes(registros: readonly T[]): Promise<number>`. Cada implementación relee y valida la colección persistida inmediatamente antes de insertar; construye la unión por ID y guarda solo si hay nuevos, sin llamar a `guardar()` para IDs existentes. Preservar el orden e IDs originales. Escribir la colección una vez por lote y comprobar el resultado; si falla, propagar error.
- [x] Extender `RepositorioConfiguracion` con `obtenerGuardada(): Promise<Configuracion | null>` y `guardarSiAusente(configuracion: Configuracion): Promise<boolean>`. La ausencia se decide por el registro persistido, no comparando contra `crearConfiguracionInicial()`. Si existe una configuración válida, conservarla completa; si es ilegible, abortar. Mantener `obtener()` para los consumidores actuales y las migraciones históricas.
- [x] Crear `ServicioRespaldo` con dependencias `RepositorioClientes`, `RepositorioMateriales`, `RepositorioPresupuestos` y `RepositorioConfiguracion`, recibidas por constructor; instanciarlo con las fábricas actuales en el punto de integración. API: `generarRespaldo(permitirAcceso: boolean): Promise<RespaldoDatos>`, `previsualizarImportacion(archivo: string, permitirAcceso: boolean): Promise<{ respaldo: RespaldoDatos; resumen: ResumenImportacion }>`, `importarFaltantes(respaldo: RespaldoDatos, resumenConfirmado: ResumenImportacion, permitirAcceso: boolean): Promise<ResumenImportacion>`.
  - Verificar la sesión también dentro de cada operación, antes de leer o escribir datos. `generarRespaldo` debe leer las cuatro fuentes persistidas y abortar si cualquiera falla; nunca generar una copia parcial.
  - Antes de escribir, validar de nuevo todo el respaldo y releer/validar las cuatro fuentes actuales. Recalcular el resumen; si cambió desde la vista previa, pedir una nueva confirmación con los valores actualizados. Mantener el guardado por grupos idempotente: si la operación se interrumpe tras uno o varios grupos, repetir el mismo archivo solo añade lo pendiente y no borra lo ya existente.
  - Si un grupo falla, mostrar qué grupos pudieron completarse y cuáles no; no informar éxito total. No prometer una transacción global entre las cuatro claves. Recargar los cuatro stores tras una importación confirmada, incluso si fue parcial, para alinear la interfaz con lo persistido.

## FASE 3: Integrar los archivos y la sección Seguridad

### Objetivo

Pablo puede descargar una copia y revisar la importación desde Configuración, tanto en web como en Android.

### Archivos y símbolos involucrados

- Nuevo `src/servicios/respaldo/archivosRespaldo.ts`.
- Nuevo `src/components/configuracion/PanelCopiasSeguridad.vue`.
- `src/pages/ConfiguracionPage.vue`, `src/components/autenticacion/ModalInicioSesion.vue`, `src/css/app.css`, `src/css/Variables.css`, `README.md`.

### Pasos de ejecución

- [x] En `archivosRespaldo.ts`, crear un nombre único con fecha y hora hasta segundos o milisegundos y extensión `.json`. En web generar `Blob` UTF-8 de tipo `application/json`, activar descarga con URL temporal y liberarla. En Android escribir UTF-8 en `Directory.Cache` con `Filesystem.writeFile` y abrir `Share.share` con el URI para que Pablo elija Archivos, Drive u otro destino externo; no llamar «copia guardada» a un archivo que solo quedó dentro de la caché de la app. Reutilizar las dependencias ya instaladas, sin introducir una nueva.
- [x] En `PanelCopiasSeguridad.vue`, separar visual y funcionalmente «Descargar copia» e «Importar copia» del botón «Guardar configuración». Usar un `input type="file"` que acepte `.json`, leer el archivo seleccionado como texto UTF-8, controlar tamaño antes de analizarlo y mostrar error legible si no es compatible o está dañado. El límite técnico de tamaño debe ser suficientemente amplio para una copia real y tener un mensaje explícito; no truncar archivos.
  - Mostrar fecha de la copia y cantidades de origen. Mostrar por tipo cuántos registros nuevos se agregarán, cuántos ya existen iguales y cuántos difieren; para la configuración indicar claramente si se agregará o conservará la actual.
  - Exigir confirmación después de la vista previa y antes de cualquier escritura. En la confirmación explicar: «Se agregarán solo registros faltantes. No se modificarán ni borrarán datos actuales». Deshabilitar acciones durante lectura, descarga e importación; restablecer el selector tras cancelar para permitir elegir de nuevo el mismo archivo.
  - Si no hay sesión, usar `solicitarInicioSesion()` antes de abrir/ejecutar la acción; mostrar indicador de bloqueo coherente con las salidas de presupuestos. Inicializar la sesión al montar y volver a comprobarla al confirmar. Nunca mostrar el contenido íntegro del JSON o datos sensibles en mensajes de error.
- [x] Montar el panel en `ConfiguracionPage.vue` después de `FormularioConfiguracion`, como sección «Seguridad» independiente del `q-form`. Hacer que `FormularioConfiguracion.vue` emita `cambiosPendientes: [valor: boolean]` al comparar sus valores editables con `props.configuracion`; la página bloqueará la importación mientras haya cambios sin guardar e indicará que se guarden o descarten primero. Al terminar la importación, llamar `cargarClientes()`, `cargarMateriales()` y `cargarPresupuestos()`; llamar `cargarConfiguracion()` solo cuando se haya agregado la configuración, y comprobar errores de recarga.
- [x] Actualizar la ayuda de `ModalInicioSesion.vue` para mencionar copias de seguridad. Añadir estilos de distribución y mensajes al final del bloque de Configuración en `src/css/app.css`, reutilizando tarjetas, botones, banners, contenedores y tokens actuales; crear tokens en `Variables.css` solo si no existe equivalente. En teléfono apilar botones y resúmenes, evitar nombres de archivo desbordados y mantener áreas táctiles cómodas; en escritorio mantener lectura de cantidades por módulo.
- [x] Documentar en `README.md` que una copia debe guardarse fuera de la app, que la importación solo añade registros ausentes por ID, que no incluye acceso/sesión y que el archivo puede contener teléfonos y datos bancarios. Indicar que el futuro plan de Firebase deberá reutilizar el contrato JSON y aplicar la importación bajo el `uid` autenticado con reglas de acceso; no incorporar Firebase en este plan.

## FASE TESTING

### Objetivo

Comprobar con datos ficticios que la copia es íntegra, la importación es repetible y ningún dato más nuevo se pierde.

### Validaciones técnicas sujetas a solicitud de Leo

- [ ] Solo si Leo lo pide explícitamente, ejecutar `npm run lint:check`, `npm run typecheck` y la compilación que solicite (`npm run build` o `npm run build:android`); resolver los fallos asociados a este cambio. No ejecutar app, pruebas, compilaciones ni linters por iniciativa propia.

### Pruebas funcionales para Leo

- [ ] Crear datos ficticios: cliente con varios teléfonos y locales, material con varios precios y monedas, presupuesto con destinatario guardado, líneas y estados, configuración con logo y método de pago. Descargar una copia y verificar que el archivo incluya todos los registros, incluso los que no aparecen en la página actual del listado.
- [ ] Importar la copia en una instalación sin registros: recuperar IDs, fechas, relaciones, teléfonos, locales, precios, líneas, estado, configuración y logo. Abrir cada ficha y un presupuesto histórico.
- [ ] Importar dos veces el mismo archivo: la segunda vista previa indica cero registros nuevos y los contadores persistidos no cambian.
- [ ] Cambiar en la app el teléfono y un local de un cliente, un precio de material, el estado de un presupuesto y la configuración; importar una copia anterior. Confirmar que permanecen completos los cuatro registros actuales, sin fusionar hijos antiguos, y que sí se agregan otros IDs faltantes.
- [ ] Crear registros posteriores a la copia y luego importarla: los registros posteriores se conservan. Si un presupuesto histórico apunta a un cliente o material eliminado, su destinatario y líneas conservan la copia histórica y la importación no lo descarta.
- [ ] Probar archivo truncado, JSON válido con forma incorrecta, versión no admitida, ID duplicado y objeto anidado inválido: no se escribe ningún grupo y aparece un error claro. Simular datos locales ilegibles de clientes, materiales o configuración: se bloquea el respaldo y la importación, sin generar una copia incompleta.
- [ ] Simular fallo de escritura después de importar uno o más grupos: informar resultado parcial; volver a importar el mismo archivo completa únicamente lo pendiente y conserva datos actuales.
- [ ] Intentar descargar e importar sin sesión: se solicita acceso y no se genera ni aplica archivo. Repetir tras iniciar sesión. Verificar que el JSON no incluya sesión, credenciales ni `actualizacionVista`.
- [ ] En web, comprobar descarga, nombre, codificación UTF-8 y selección del mismo archivo tras cancelar. En Android, elegir un destino externo desde la hoja de compartir y recuperar el archivo desde el selector; confirmar que desinstalar la app no sea el único lugar donde estaba la copia.

### Casos responsivos para Leo

- [ ] Revisar Configuración en teléfono, tableta y escritorio con copia válida, conflicto, error y operación en curso: botones completos, resúmenes legibles, nombres largos sin desbordamiento y ningún envío involuntario del formulario de configuración.

## Progreso del plan

- [x] Fase 1: Asegurar las lecturas y definir el formato
- [x] Fase 2: Preparar la importación no destructiva
- [x] Fase 3: Integrar los archivos y la sección Seguridad
- [ ] Fase Testing

Fecha de creación: 26 de octubre de 2026
Fecha de última actualización: 26 de octubre de 2026
Estado: EN PROCESO
