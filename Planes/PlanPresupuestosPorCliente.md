# Presupuestos vinculados desde la ficha del cliente

## Descripción del plan

Pablo necesita consultar desde la ficha de un cliente todos los presupuestos vinculados a ese registro y crear uno nuevo con el destinatario autocompletado. La ficha debe aprovechar mejor el espacio en teléfonos, sin perder claridad en escritorio. El vínculo se determina exclusivamente por `destinatario.tipo === 'guardado'` y `destinatario.idCliente`; el nombre del destinatario es una copia editable y no sirve para establecer la relación.

## Objetivo principal

- Mostrar «Ver presupuestos» en la ficha únicamente cuando exista al menos un presupuesto guardado vinculado al ID del cliente.
- Abrir una lista que contenga solo los presupuestos de ese cliente, con búsqueda dentro de la lista y acceso a cada presupuesto.
- Ofrecer «Nuevo presupuesto» desde la ficha y desde la lista filtrada; iniciar el formulario con el cliente guardado, su nombre y su teléfono principal.
- Compactar el encabezado de la ficha, retirar el teléfono duplicado y reducir la separación entre las acciones y la tarjeta Contacto.
- Mantener una presentación utilizable en teléfonos, tabletas y escritorio, sin desbordamiento horizontal.

## Contexto técnico verificado

- `AGENTS.md` exige Vue 3, Quasar, TypeScript estricto, nombres en español, tokens visuales en `src/css/Variables.css` y aprobación antes de implementar. Leo realiza las pruebas; durante la implementación no se ejecutan aplicación, pruebas, compilaciones ni linters salvo pedido explícito suyo.
- `src/dominio/presupuestos.ts` define `DatosDestinatarioPresupuesto` con `tipo`, `idCliente`, `nombre` y `telefono`; los presupuestos ya guardan la asociación por ID.
- `src/stores/presupuestos.ts` ofrece `presupuestosOrdenados`, `buscarPresupuestos()` y `cargarPresupuestos()`. `src/pages/PresupuestosPage.vue` presenta la misma lista como tabla en escritorio y tarjetas en móvil.
- `src/pages/ClienteDetallePage.vue` muestra el teléfono bajo el nombre y nuevamente en Contacto. El espacio inferior del encabezado proviene de `padding-block` de `.encabezado-detalle-cliente` en `src/css/app.css`.
- `src/pages/NuevoPresupuestoPage.vue` restablece cada presupuesto nuevo como destinatario potencial. `SelectorDestinatarioPresupuesto.vue` completa nombre y teléfono principal al recibir un `idCliente` válido mientras `tipo` es `guardado` y la lista de clientes está cargada.
- La navegación usa `src/router/routes.ts`; la ficha está en `/clientes/:idCliente` y el formulario nuevo en `/presupuestos/nuevo`.
- `src/css/app.css` ya cambia las tarjetas de cliente a una columna a 1199 px, apila el encabezado de la ficha a 767 px, reduce el avatar a 419 px y sustituye la tabla de presupuestos por tarjetas a 767 px. Reutilizar esos cortes y los tokens existentes.

## Alcance

### Incluye

- Vista filtrada de presupuestos para un cliente guardado y sus estados de carga, error y ausencia de datos.
- Botones de consulta y creación contextual, autocompletado y retorno coherente al cliente después de crear o cancelar.
- Ajuste responsivo del encabezado de la ficha y del encabezado de la lista filtrada.

### No incluye

- Asociar por coincidencia de nombre presupuestos creados como «Potencial cliente».
- Migrar, reasignar o borrar presupuestos existentes al modificar o eliminar clientes.
- Cambiar el almacenamiento, los cálculos, el PDF o instalar dependencias.

## Mapa de cambios

| Archivo                              | Acción                                             | Símbolos principales                                                                                  | Propósito                                                                                   |
| ------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/router/routes.ts`               | Modificar                                          | `routes`, ruta `historial-presupuestos-cliente`                                                       | Abrir la lista del cliente mediante `/clientes/:idCliente/presupuestos`.                    |
| `src/pages/ClienteDetallePage.vue`   | Modificar                                          | `presupuestosStore`, `presupuestosDelCliente`, `cargarPresupuestos`, encabezado                       | Condicionar «Ver presupuestos», ofrecer «Nuevo presupuesto» y quitar el teléfono duplicado. |
| `src/pages/PresupuestosPage.vue`     | Modificar                                          | `esHistorialCliente`, `clienteActual`, `presupuestosFiltrados`                                        | Reutilizar la lista existente para un único cliente sin alterar la lista general.           |
| `src/pages/NuevoPresupuestoPage.vue` | Modificar                                          | `inicializarPantalla`, `restablecerFormularioNuevo`, `confirmarCancelacion`, `guardarNuevoYFinalizar` | Completar el cliente indicado por la ruta y devolverlo a su contexto.                       |
| `src/css/app.css`                    | Modificar                                          | `.encabezado-detalle-cliente`, `.acciones-encabezado-detalle`, `.encabezado-modulo-presupuestos`      | Distribución y espaciado responsivos.                                                       |
| `src/css/Variables.css`              | Modificar solo si hace falta un token reutilizable | Variables semánticas                                                                                  | Centralizar cualquier valor visual nuevo; preferir tokens actuales.                         |

## FASE 1: Habilitar la consulta de presupuestos por cliente

### Objetivo

El historial accesible desde una ficha muestra únicamente presupuestos realmente vinculados a su ID.

### Pasos de ejecución

- [x] Agregar en `src/router/routes.ts` la ruta hija `clientes/:idCliente/presupuestos` con nombre `historial-presupuestos-cliente`, antes de la ruta genérica de detalle de cliente, y reutilizar `PresupuestosPage.vue`.
  - La ruta debe funcionar también al recargar o abrir un enlace directo.
- [x] Integrar `usePresupuestosStore` en `src/pages/ClienteDetallePage.vue` y cargar los presupuestos junto con los clientes al montar la ficha.
  - Definir `presupuestosDelCliente` como `computed<Presupuesto[]>`, derivado de `presupuestosStore.presupuestosOrdenados` y filtrado por `destinatario.tipo === 'guardado'` y `destinatario.idCliente === cliente.value?.id`.
  - Mostrar «Ver presupuestos» solo si existe `cliente`, terminó la carga sin error y `presupuestosDelCliente.length > 0`. Al pulsarlo, navegar a `/clientes/${cliente.id}/presupuestos`.
  - Mostrar el error de carga de presupuestos en la ficha para no interpretar un fallo como ausencia de historial. No mostrar un contador ni resultados antiguos de otro cliente mientras se carga.
- [x] Adaptar `src/pages/PresupuestosPage.vue` para reconocer `ruta.name === 'historial-presupuestos-cliente'` mediante `useRoute()` y consultar el cliente actual con `useClientesStore`.
  - Mantener la lista general sin cambios funcionales en `/presupuestos`.
  - En contexto de cliente, cargar clientes y presupuestos si hace falta; derivar la lista del cliente por ID y aplicar la búsqueda existente únicamente dentro de ella. Mantener el orden actual por fecha.
  - Mostrar encabezado «Presupuestos de [nombre]», control «Volver al cliente», la tabla/tarjetas existentes y «Ver presupuesto» en cada fila. «Nuevo presupuesto» debe apuntar a `/presupuestos/nuevo?idCliente=${encodeURIComponent(cliente.id)}`.
  - Si el ID no existe, mostrar un estado claro con enlace a Clientes; si falla la carga, mostrar el error sin presentar un falso estado vacío. Si no hay coincidencias de búsqueda, usar el estado vacío de búsqueda, sin sugerir que el cliente no tiene presupuestos.
  - La relación nunca debe depender de `destinatario.nombre` o `telefono`, aunque se hayan editado dentro del presupuesto.

## FASE 2: Crear un presupuesto con el cliente autocompletado

### Objetivo

La creación iniciada desde una ficha o su historial conserva la relación con el cliente sin alterar el flujo general de presupuestos nuevos.

### Pasos de ejecución

- [x] Agregar en modo lectura de `src/pages/ClienteDetallePage.vue` el botón «Nuevo presupuesto», visible aun cuando el cliente no tenga historial, con destino `/presupuestos/nuevo?idCliente=${encodeURIComponent(cliente.id)}`.
- [x] En `inicializarPantalla()` de `src/pages/NuevoPresupuestoPage.vue`, después de `cargarClientes()` y de `restablecerFormularioNuevo()`, leer `ruta.query.idCliente` solo cuando `esNuevo` y no se esté recuperando un borrador de vista previa.
  - Aceptar únicamente un string no vacío que coincida con `clientesStore.obtenerClientePorId()`; ignorar arrays o valores inválidos.
  - Para un cliente existente, asignar `tipoDestinatario = 'guardado'`, `idCliente`, `nombreDestinatario = cliente.nombre` y `telefonoDestinatario = obtenerTelefonoPrincipal(cliente)?.numero ?? ''`. Actualizar `estadoInicial` después de completar los datos para que el formulario nuevo no se marque como modificado al abrirlo.
  - Respetar la edición posterior de nombre y teléfono dentro del presupuesto. No modificar el registro del cliente. Si no se pudo cargar clientes o el ID ya no existe, mostrar un aviso y evitar guardar una asociación inválida.
  - El botón normal de `/presupuestos/nuevo`, sin `idCliente`, debe continuar iniciando como «Potencial cliente».
- [x] Ajustar `confirmarCancelacion()` y `guardarNuevoYFinalizar()` solo para el flujo con cliente válido: al cancelar, volver a `/clientes/:idCliente`; al guardar, abrir `/clientes/:idCliente/presupuestos`. Conservar las rutas actuales en el flujo general y al editar presupuestos.
  - Comprobar que la ida y vuelta por vista previa restaura el borrador sin perder la asociación ni sobrescribir cambios del destinatario. Preservar el comportamiento de `consumirBorradorVistaPrevia()`.

## FASE 3: Compactar la ficha y ajustar ambas vistas al ancho disponible

### Objetivo

Los botones se leen y se pulsan cómodamente en cualquier tamaño; Contacto comienza inmediatamente después del encabezado sin el hueco de la captura.

### Pasos de ejecución

- [x] Quitar en `src/pages/ClienteDetallePage.vue` el párrafo `.encabezado-detalle-cliente__telefono` bajo el nombre. Conservar intactos los teléfonos y WhatsApp de la tarjeta Contacto; retirar la variable `telefonoPrincipal` y sus estilos si dejan de tener consumidores.
- [x] En modo lectura de la ficha, colocar «Editar cliente» y «Ver presupuestos» en una misma fila visual cuando exista historial, y ubicar «Nuevo presupuesto» de forma visible sin comprimir los dos controles anteriores. En edición, conservar «Cancelar» y «Guardar cambios» sin accesos que puedan distraer o disparar una salida accidental.
  - Reducir el tamaño del botón «Editar cliente» mediante propiedades de Quasar y reglas específicas; conservar etiqueta completa y área táctil cómoda. No reducir fuente o icono por debajo de los tokens existentes.
  - En teléfono, permitir que los controles se adapten al ancho real: misma fila cuando quepan y distribución en filas si el nombre, la traducción o el ancho lo requieren; evitar cortes de texto y desplazamiento horizontal. En escritorio, mantener alineación clara con el perfil.
- [x] Ajustar en `src/css/app.css` el `padding-bottom` de `.encabezado-detalle-cliente` que separa las acciones de `.detalle-cliente__columnas`, y revisar el `gap` propio del encabezado. Conservar separación perceptible y reducir el hueco observado en la captura, sin agregar márgenes negativos. Usar variables existentes de `src/css/Variables.css`; cualquier token nuevo debe declararse allí.
- [ ] Revisar el encabezado contextual de `PresupuestosPage.vue` en escritorio, tableta y teléfono: el título largo, «Volver al cliente» y «Nuevo presupuesto» deben adaptarse sin taparse. Reutilizar la tabla en escritorio y las tarjetas en móvil; evitar un segundo listado o estilos divergentes.

## FASE TESTING

### Objetivo

Dejar escenarios concretos para que Leo compruebe el cambio cuando autorice la implementación y las validaciones.

### Validaciones técnicas sujetas a solicitud de Leo

- [x] A pedido de Leo durante el release, ejecutar `npm run lint:check`, `npm run typecheck` y la compilación Android que incluye la interfaz; corregir los errores de formato detectados.

### Pruebas funcionales para Leo

- [ ] Abrir un cliente sin presupuestos: «Ver presupuestos» no aparece, «Nuevo presupuesto» sí. Abrir el formulario y comprobar tipo guardado, cliente seleccionado, nombre y teléfono principal autocompletados.
- [ ] Guardar un presupuesto desde esa ficha: aparece «Ver presupuestos» y la lista del cliente muestra el presupuesto con fecha, total y estado. Abrirlo desde la lista.
- [ ] Crear presupuestos de dos clientes y otro como «Potencial cliente» con el mismo nombre: cada historial muestra únicamente los asociados a su propio ID; la búsqueda no agrega resultados de otros clientes.
- [ ] Editar nombre y teléfono copiados dentro de un presupuesto y luego cambiar el nombre o teléfono en la ficha: la asociación por ID persiste y las copias históricas no se sobrescriben.
- [ ] Comprobar retorno al cancelar, guardar, pasar por vista previa y volver; verificar que el formulario general sin ID sigue empezando como «Potencial cliente».
- [ ] Abrir directamente un historial con ID inexistente y simular error de carga: aparecen mensajes adecuados y nunca un historial ajeno o un estado vacío engañoso.

### Casos responsivos para Leo

- [ ] Revisar la ficha a 320, 390, 767, 800 y 1280 px, con y sin historial, en lectura y edición. Comprobar botones completos, sin solapamiento ni desplazamiento horizontal, y menor distancia entre acciones y Contacto.
- [ ] Revisar la lista filtrada a 320, 390, 800 y 1280 px con nombre largo, varios presupuestos y resultado vacío de búsqueda. Comprobar navegación, tarjetas móviles, tabla de escritorio, total y estado legibles.
- [ ] Repetir en Android si está disponible, incluyendo toque de los botones y teclado en la búsqueda. Leo realiza la ejecución y prueba de la aplicación.

## Progreso del plan

- [x] Fase 1: Habilitar la consulta de presupuestos por cliente
- [x] Fase 2: Crear un presupuesto con el cliente autocompletado
- [ ] Fase 3: Compactar la ficha y ajustar ambas vistas al ancho disponible
- [ ] Fase Testing

Fecha de creación: 24 de octubre de 2026
Fecha de última actualización: 25 de octubre de 2026
Estado: EN PROCESO

## Avance de implementación

- La consulta por ID, la navegación contextual, el autocompletado y el ajuste de espaciado ya están implementados.
- Queda pendiente la revisión visual responsiva y las pruebas funcionales de Leo. Durante el release `v0.0.5`, Leo autorizó las validaciones: pasaron `npm run lint:check`, `npm run typecheck` y `npm run build:android`.
