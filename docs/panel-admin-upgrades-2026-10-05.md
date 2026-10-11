# Panel de gestión · revisión de producto

## Alcance implementado

Esta entrega es una revisión funcional del frontend Angular `/gestion`. No se modificó el backend, el dominio público, los roles ni la base de datos. No se subió nada a GitHub ni a Hostinger.

- Catálogo e inventario agrupados; ficha de vino/producto/pack con descripción, IVA, precio, añada, variedad, graduación y composición. Disponibilidad de packs derivada de sus componentes activos, sin duplicar existencias físicas. Sin packs anidados.
- Campana de avisos derivados de stock, pagos pendientes y reservas. Descartar uno/todos durante la sesión.
- Imágenes de botella por referencia más grandes en el resumen; pedidos con botón de detalle y sin tarjetas grandes de fases.
- Clientes con teléfono, dirección, barrio informado, tarifa comercial, notas, estado y gasto histórico separado del periodo. Ranking configurable por fechas y umbral.
- Actividad territorial comparativa con provincia, ciudad, barrio y tipo de cliente; porcentaje de cobertura visible. No hay polígonos geográficos ni geocodificación. No se inventa el barrio ni se atribuyen pedidos sin ficha.
- Finanzas agrupa resumen, pedidos, productos, facturas y gastos. Rangos de fechas, CSV/JSON y separación entre cobros y documentos. No suma factura y pedido dos veces. Saldo orientativo, no beneficio contable. Los ejemplos anteriores no están conciliados a nivel de líneas/portes.
- Calendario mensual navegable, detalle de reserva, teléfono, bloqueos por fecha/día y horario, antelación y cancelación. Reglas internas: no están conectadas al formulario público. Cancelar no simula reembolso ni envío de avisos.
- Preferencias de letra globales: tamaño y tres familias. Integraciones retiradas de ajustes. Los cambios son de sesión.
- Upgrade piloto de elaboración: lotes por vino, fases, notas, mediciones fechadas con unidades y respuestas manuales vinculadas a productos de pedidos entregados. Media de valoración por producto. No envía encuestas ni hace recomendaciones enológicas.

## Límites y arquitectura

`admin-workspace.model.ts` contiene reglas puras de packs, periodos, disponibilidad y exportación. `AdminDataService` mantiene el repositorio de ejemplos existente; sin catálogo administrativo conectado, no genera stock a partir del catálogo público. `AdminOperationsService` conserva gastos, reglas y lotes mientras vive la aplicación. `AdminModalComponent` reutiliza el bloqueo de scroll/foco con diálogos nativos. La vista de áreas está separada del shell y su navegación.

Las rutas anteriores `/gestion/inventory` y `/gestion/billing` siguen disponibles, ahora como subsecciones de catálogo y finanzas. Nueva ruta piloto: `/gestion/production`.

No hay persistencia de cambios al recargar. No se han creado migraciones, tablas, credenciales ni datos reales para estas funciones. `/gestion` sigue siendo una demostración, no un panel autenticado listo para datos personales reales.

## Antes de usarlo con una empresa real

1. Autenticación, autorización por operación, aislamiento de empresa y auditoría de modificaciones.
2. Adaptadores administrativos y contratos para producto/composición/imagen/stock; el backend valida reservas y revisiones concurrentes. El stock de un pack debe reservar las unidades de sus componentes en transacción.
3. Identificadores estables de cliente/pedido en lugar de la unión temporal por correo. Histórico completo de cobros, devoluciones, impuestos, costes y gastos para informes contables.
4. Direcciones verificadas y límites geográficos reales para un mapa, con cobertura y datos desconocidos explícitos. No interpretar un código postal como barrio exacto.
5. Disponibilidad unificada entre reserva pública y agenda; aforo, duración de visita, festivos y validación en servidor.
6. Producción como módulo contratado y protegido en servidor: lotes, fases, mediciones inmutables/correcciones auditadas, unidad, operario, fecha/hora y relaciones entre lote y producto enviado.
7. Feedback automático mediante trabajos idempotentes después de entrega, enlaces limitados a la compra, permisos de comunicación y cancelación de envíos. Las valoraciones deben poder distinguir muestras pequeñas, periodos y lotes; el prototipo solo calcula media de respuestas manuales.

## Verificación

`check-admin-workspaces.cjs`, `check-ui-logic.cjs`, `check-modal-behaviour.cjs` y `check-cart-motion.cjs`: pruebas de lógica. Compilación `npm run build:hostinger` correcta. Rutas de revisión y las imágenes principales responden HTTP 200 en el servidor local.

La verificación visual automatizada no se pudo ejecutar: el navegador de pruebas falla al iniciar por permisos del entorno (`helper_sandbox_lock_failed`). HTTP 200 y compilación no sustituyen una revisión visual en escritorio y móvil.
