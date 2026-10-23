# PLAN DEL APARTADO CLIENTES

## Descripción del plan

Implementar el apartado Clientes de Mallic Tesla con una interfaz responsive y reutilizable para SPA web y Android mediante Capacitor. El módulo permitirá listar, buscar, crear, consultar, editar y eliminar clientes, incluyendo múltiples teléfonos y locales por cliente. La persistencia inicial será local, pero quedará aislada detrás de contratos asíncronos para facilitar una futura migración a Firebase.

## Objetivo principal

- Crear un flujo completo y reutilizable de gestión de clientes.
- Mantener una única experiencia responsive para navegador y Android.
- Persistir los datos localmente sin acoplar los componentes al mecanismo de almacenamiento.
- Preparar los límites técnicos necesarios para sustituir el almacenamiento local por Firebase en el futuro.

## Reglas del plan

- Trabajar exclusivamente en el apartado Clientes y en las piezas compartidas estrictamente necesarias para integrarlo.
- Usar Quasar, Vue 3, TypeScript estricto, Pinia y Composition API con `<script setup>`.
- Crear componentes pequeños, reutilizables y con una única responsabilidad.
- Usar exclusivamente los colores y valores visuales existentes en `src/css/Variables.css`.
- No editar la paleta de colores aprobada.
- No repetir valores visuales fuera de `Variables.css`, salvo una excepción local documentada.
- No mostrar las acciones Editar y Eliminar en la lista de clientes; ambas estarán únicamente en la ficha del cliente.
- No agregar notas por local; las notas serán generales para el cliente.
- No instalar ni configurar Firebase durante este plan.
- Agregar comentarios `TODO` únicamente en los puntos de sustitución del almacenamiento, explicando qué deberá cambiar al integrar Firebase.
- No ejecutar `git add`, crear commits, tags ni hacer push durante la ejecución del plan.

## FASE 1: Definir el modelo y la capa de almacenamiento

### Objetivo

Crear contratos de datos estables y desacoplar la interfaz del almacenamiento para admitir una futura implementación con Firebase.

- [x] Revisar la arquitectura actual del proyecto y reutilizar sus patrones de tipos, servicios, stores y manejo de errores.
- [x] Definir el tipo de cliente con identificador único, nombre, teléfonos, locales, correo opcional, notas generales y fechas de creación y actualización.
- [x] Definir el tipo de teléfono con identificador, número, etiqueta y marca de teléfono principal.
- [x] Definir el tipo de local con identificador, nombre y dirección.
- [x] Garantizar mediante funciones de dominio que cada cliente con teléfonos tenga exactamente uno marcado como principal.
- [x] Crear un contrato asíncrono `RepositorioClientes` con las operaciones necesarias para obtener, crear, actualizar y eliminar clientes.
- [x] Implementar la persistencia web mediante `localStorage` sin exponerla directamente a Pinia ni a los componentes.
- [x] Implementar o integrar la persistencia móvil mediante el mecanismo de almacenamiento disponible en Capacitor, validando antes las dependencias existentes.
- [x] Crear un punto único de selección del repositorio según la plataforma.
- [x] Mantener identificadores y fechas en formatos que puedan migrarse de forma predecible a Firebase.
- [x] Incorporar manejo seguro de datos inexistentes, JSON inválido y fallos de lectura o escritura.
- [x] Agregar comentarios `TODO` concretos en los adaptadores y en el selector del repositorio para indicar dónde conectar Firebase y qué implementación local reemplazar.

## FASE 2: Crear el estado reutilizable de clientes

### Objetivo

Centralizar el acceso a clientes y exponer estados coherentes para todas las pantallas del apartado.

- [x] Crear o adaptar un store de Pinia que dependa de `RepositorioClientes` y no de APIs de almacenamiento concretas.
- [x] Exponer acciones asíncronas para cargar, crear, actualizar y eliminar clientes.
- [x] Mantener estados de carga, error y operación en curso.
- [x] Exponer una búsqueda por nombre del cliente, nombre del local y cualquier teléfono.
- [x] Ordenar el listado alfabéticamente por nombre del cliente.
- [x] Evitar mutaciones parciales en pantalla cuando una operación de persistencia falle.

## FASE 3: Implementar el listado responsive

### Objetivo

Mostrar todos los clientes con una navegación clara hacia la ficha individual, sin acciones destructivas en el listado.

- [x] Crear la pantalla principal del apartado con el título Clientes y el botón Agregar cliente nuevo.
- [x] Agregar un buscador por nombre, local o teléfono.
- [x] Mostrar el nombre, los locales asociados y el teléfono principal de cada cliente.
- [x] Mostrar únicamente la acción Ver cliente en cada registro.
- [x] Usar una presentación amplia en escritorio y tarjetas compactas en celular, compartiendo la misma fuente de datos y comportamiento.
- [x] Representar de forma legible los clientes con varios locales sin saturar la lista.
- [x] Crear estados para lista vacía, búsqueda sin resultados, carga y error.
- [x] Conectar Agregar cliente nuevo y Ver cliente con sus rutas correspondientes.

## FASE 4: Construir el formulario reutilizable

### Objetivo

Usar un único formulario responsive para crear y editar clientes con validaciones consistentes.

- [x] Crear un componente de formulario reutilizable para los modos creación y edición.
- [x] Agregar el campo obligatorio Nombre del cliente.
- [x] Permitir agregar y quitar múltiples teléfonos.
- [x] Permitir etiquetar cada teléfono como Personal, Trabajo, WhatsApp u Otro.
- [x] Marcar automáticamente el primer teléfono agregado como principal.
- [x] Permitir cambiar el teléfono principal y asegurar que solo uno permanezca marcado.
- [x] Impedir que un cliente con teléfonos quede sin teléfono principal al quitar o cambiar números.
- [x] Permitir agregar y quitar múltiples locales dentro del mismo formulario.
- [x] Agregar nombre y dirección para cada local.
- [x] Colocar el correo opcional dentro de una sección desplegable Datos adicionales.
- [x] Agregar un único campo de notas generales del cliente.
- [x] Incorporar validaciones claras, mensajes de error y prevención de envíos duplicados.
- [x] Agregar los botones Guardar cliente y Cancelar con comportamiento correcto en ambos modos.
- [x] Confirmar la eliminación de un local durante la edición cuando ya forme parte de un cliente guardado.
- [x] Agrupar las tarjetas del formulario dentro de una tarjeta contenedora que unifique visualmente toda la carga del cliente.
- [x] Mantener Datos adicionales cerrado al ingresar y ampliar el campo Notas generales para facilitar textos extensos.
- [x] Alinear desde arriba los campos de teléfono, tipo y selección principal en la versión web.
- [x] Neutralizar el fondo y las franjas laterales que agrega el autocompletado del navegador en los campos del formulario.

## FASE 5: Implementar la ficha del cliente

### Objetivo

Centralizar la consulta y las acciones sensibles de cada cliente en una pantalla individual.

- [x] Crear una ruta y una pantalla de ficha identificada por el ID del cliente.
- [x] Mostrar el nombre, el teléfono principal, los teléfonos adicionales, el correo cuando exista, los locales y las notas generales.
- [x] Mostrar las acciones Editar cliente y Eliminar cliente únicamente dentro de esta ficha.
- [x] Conectar Editar cliente con el formulario reutilizable cargado con los datos actuales.
- [x] Mostrar una confirmación antes de eliminar e indicar cuántos locales asociados también se eliminarán.
- [x] Eliminar el cliente y todos sus locales asociados únicamente después de una confirmación explícita.
- [x] Volver al listado y mostrar una notificación clara después de crear, actualizar o eliminar correctamente.
- [x] Resolver de forma controlada el acceso a un ID inexistente o eliminado.

## FASE 6: Integrar navegación, diseño y experiencia responsive

### Objetivo

Completar una experiencia consistente, accesible y reutilizable en navegador y Android.

- [x] Registrar las rutas del listado, creación, ficha y edición respetando la estructura actual del router.
- [ ] Verificar navegación hacia atrás y cancelación sin perder ni guardar cambios accidentalmente.
- [x] Reutilizar componentes comunes para teléfonos, locales, estados vacíos y confirmaciones cuando aporten una responsabilidad clara.
- [x] Aplicar únicamente variables y clases visuales compatibles con `Variables.css` sin cambiar los colores aprobados.
- [ ] Comprobar tamaños táctiles, foco, etiquetas, contraste y mensajes comprensibles.
- [ ] Verificar que no exista desplazamiento horizontal ni contenido cortado en anchos móviles.
- [x] Mantener la misma lógica de negocio y validación en SPA web y Android.

## FASE TESTING

### Objetivo

Validar el flujo completo del apartado Clientes en navegador y en una compilación Android mediante pruebas ejecutables por IA y revisables por una persona.

- [x] Ejecutar lint, validación de TypeScript y build del proyecto, y resolver los errores relacionados con el cambio.
- [ ] Crear un cliente con un teléfono y un local, recargar la aplicación y verificar que los datos persisten.
- [ ] Crear un cliente con varios teléfonos, cambiar el principal y comprobar que solo uno queda marcado y aparece en la lista.
- [ ] Crear un cliente con varios locales y verificar que todos aparecen en su ficha.
- [ ] Verificar las búsquedas por nombre del cliente, nombre del local, teléfono principal y teléfono secundario.
- [ ] Confirmar que la lista no muestra Editar ni Eliminar y que ambas acciones existen únicamente en la ficha.
- [ ] Editar todos los campos reutilizando el formulario y comprobar la persistencia después de recargar.
- [ ] Cancelar una creación y una edición, y comprobar que no se guardan cambios.
- [ ] Intentar eliminar un local guardado, cancelar la confirmación y verificar que permanece asociado.
- [ ] Eliminar un cliente con varios locales, cancelar primero la confirmación y confirmar después que el borrado incluye todos sus locales.
- [ ] Probar lista vacía, búsqueda sin resultados, ID inexistente y datos locales inválidos.
- [ ] Revisar visualmente listado, formulario y ficha en tamaños de celular, tableta y escritorio.
- [ ] Ejecutar el flujo principal en Android con Capacitor y comprobar que los datos persisten después de cerrar y volver a abrir la aplicación.
- [x] Verificar que los componentes y el store no acceden directamente a `localStorage` ni al almacenamiento de Capacitor.
- [x] Verificar que los comentarios `TODO` de Firebase sean concretos y estén limitados a los puntos de sustitución previstos.

## Progreso del plan

- [x] Fase 1: Definir el modelo y la capa de almacenamiento
- [x] Fase 2: Crear el estado reutilizable de clientes
- [x] Fase 3: Implementar el listado responsive
- [x] Fase 4: Construir el formulario reutilizable
- [x] Fase 5: Implementar la ficha del cliente
- [ ] Fase 6: Integrar navegación, diseño y experiencia responsive
- [ ] Fase Testing

Fecha de creación: 17 de Agosto 2026
Fecha de última actualización: 17 de Agosto 2026
Estado: EN PROCESO

## Evolución de la ficha — 23 de octubre de 2026

La edición del cliente se realiza ahora en su ficha: el botón Editar cliente habilita lápices por dato y controles para agregar o quitar teléfonos y locales. Los cambios se guardan juntos o se descartan con Cancelar; salir con cambios pendientes requiere confirmación. El formulario separado se utiliza solo para crear clientes y la ruta de edición anterior fue eliminada.

Cada local puede tener varios teléfonos y un principal propio, independiente del teléfono principal general del cliente. Los clientes guardados antes de este cambio se leen con una lista vacía de teléfonos por local. El selector de destinatario de presupuestos continúa usando el teléfono principal general.
