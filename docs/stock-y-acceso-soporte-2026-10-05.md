# Stock y acceso de soporte de plataforma

## Corrección aplicada

AdminDataService ya no calcula stock/reservas/ventas a partir del índice de productos del catálogo público ni mezcla este con el inventario demo.
El modo preview (mockCatalog=true) mantiene ejemplos identificados como demo. Fuera de ese modo, catálogo/inventario del panel quedan sin registros hasta conectar la API administrativa; agregados desconocidos son null y se muestran como —, nunca como cero.
Se bloquean mutaciones locales de productos/stock en ese modo. Las cantidades físicas y reservadas de la demo se calculan sobre sus filas, no con constantes HTML. Ya no se muestra «API conectada» sin evidencia.

Esto corrige datos inventados, no implementa la sincronización real. Pendiente integrar el backend actualizado en rama aparte, sesión, consultas admin, stock real y concurrencia de ajustes. El catálogo público no entrega stock. El backend revisado tiene cantidad física y movimientos, no reserva de ventas/Stripe. No inferir reservado=0 si no existe su contrato.

Pruebas: demo coherente, reales desconocidos, separación de repositorios, rechazo de ajustes NaN/decimales y bloqueo de escrituras sin conexión administrativa.

## Acceso técnico propuesto (no implementado)

Un rol de PlatformSupport, separado del administrador de la bodega. No una cuenta invisible ni una contraseña maestra compartida.

- Personal técnico con cuentas individuales y MFA; no rol elegible/asignable por el administrador cliente.
- Puede quedar fuera del listado de usuarios de negocio; existencia y condiciones de soporte comunicadas al cliente.
- Sin acceso global automático a todas las empresas. Concesión por empresa, finalidad, permisos y vencimiento, validada por backend.
- Consulta por defecto; modificaciones con permiso adicional explícito. No suplantar silenciosamente al propietario.
- Registrar identidad del técnico, empresa, momento, motivo, acciones y resultado. No guardar contraseñas ni datos sensibles innecesarios en auditoría.
- Permitir revisar/revocar acceso y cerrar sesiones. Aviso e historial visibles para la empresa.
- Un acceso excepcional de emergencia, si se acuerda, requiere mecanismo separado y auditado; no bypass fijo.
- Seleccionar una empresa en la UI no otorga acceso: pertenencia/alcance deben comprobarse en cada petición y consulta.
- Auditoría y gestión de soporte requieren entidades y permisos backend. No basta un booleano hidden o un usuario hardcodeado en Angular.

Prerequisitos antes de activarlo: aislamiento multiempresa, sesión revalidable (revocar cuentas/roles), auditoría persistente y procedimiento de autorización de soporte. Actualmente no se han creado cuentas, contraseñas, grants ni endpoints privilegiados.
