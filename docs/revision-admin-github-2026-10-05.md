# Auditoría de integración del administrador · 5 octubre 2026

## Alcance y trazabilidad

Repositorio: https://github.com/aerus95/DominioDeLaSierra
Revisión remota: `144d68026ecfe5a823077c9a7767961627821462` (origin/main).
Base local: `6d9bbaf`, rama `codex/crm-dashboard`, con cambios propios staged, unstaged y archivos nuevos. Hay 10 commits remotos adicionales.
Se han descargado las referencias con git fetch y leído los archivos remotos mediante git show. No se ha hecho pull, merge, reset, cambio de rama, push ni migración de datos. No se han ejecutado pruebas contra una base real ni comprobado el servidor desplegado.

## Arquitectura existente

- Angular standalone 19, tienda pública y panel visual /gestion.
- ASP.NET Core .NET 10: Api, Application, Domain e Infrastructure. Servicios de aplicación compartidos por controladores públicos y Razor Pages.
- EF Core con Npgsql: PostgreSQL, no MySQL/phpMyAdmin.
- /admin y /admin/users son Razor Pages autenticadas. /gestion es una interfaz Angular distinta, sin guard de acceso en las rutas revisadas.
- Docker del backend y pruebas unitarias, integración PostgreSQL y E2E del administrador existentes en el remoto. Tener esas pruebas en el árbol no demuestra que estén pasando en este entorno.

## Capacidades reales frente a demo

| Módulo | Implementación persistente revisada | Panel Angular |
| --- | --- | --- |
| Acceso y roles | Login/logout por cookie HttpOnly; Administrator, Manager, Viewer | No conecta esa sesión con /gestion |
| Usuarios admin | Crear, cambiar rol/contraseña, activar/desactivar; gestión solo Administrator | No hay módulo equivalente conectado |
| Categorías | Consulta y creación con validación | Filtros locales; hay que consumir DTO admin para inactivas |
| Productos | Crear/editar, activo, referencia/slug, precio/IVA, vino/estándar/pack | Escrituras locales en signals |
| Ficha de vino | Añada, variedad, alcohol persistidos | No se deben rellenar con placeholders cuando faltan datos |
| Packs | Composición por productos/cantidades; sin stock propio | El modelo local de catálogo no cubre todos los contratos nuevos |
| Imágenes | Imagen principal, validación/procesamiento, subida/eliminación, /media | Adaptar a primaryImageUrl real |
| Importación | JSON, validación previa, informe y ejecución | Falta UI conectada con nuestro diseño |
| Inventario | Warehouse, Stock y StockMovement, saldo inicial y ajustes | Stock/reservado/ventas parcialmente inventados |
| Pedidos/pagos/clientes | No hay entidades/servicios/controladores de estos módulos en el árbol backend revisado | Datos de demostración |
| Visitas/finanzas/facturas/cupones | Sin módulos backend persistentes encontrados; no integración Stripe/VeriFactu | Datos y acciones locales de demostración |
| Multiempresa | No hay Tenant, pertenencia ni aislamiento por empresa implementados en DbContext | Diseño visual SaaS, no aislamiento real |

## Contratos disponibles hoy

Públicos en Controllers:

- GET /api/v1/products: page, pageSize, search, category, minPrice, maxPrice.
- GET /api/v1/products/{slug}.
- GET /api/v1/products/{slug}/components.
- GET /api/v1/categories.
- POST /api/v1/products y POST /api/v1/categories, protegidos por AdminWrite.

Importante: GET público de productos devuelve catálogo activo, imagen y tipo, pero no stock ni todo el perfil del vino. No sirve como repositorio administrativo para inactivos, stock o reservas.
El POST público de producto tampoco equivale al alta completa del panel Razor: su request no contiene imagen, tipo, stock inicial ni composición; el panel usa CreateProductCommand con más campos.

Handlers de /admin (no API REST administrativa nueva):

- GET handler EditProduct, ProductCandidates.
- POST handler CreateCategory, CreateProduct, EditProduct.
- POST handler SetPrimaryImage, DeletePrimaryImage.
- POST handler ValidateProductImport, ImportProducts.
- Listado se renderiza en la página a partir de IAdminCatalogQueries.
- Login/logout y usuarios tienen handlers propios.
- Los formularios Razor incluyen antiforgery; no hay que perderlo al migrar a Angular.

## Puntos críticos

1. AdminDataService mezcla datos públicos con stock/reservas/ventas calculados artificialmente y fija IVA=21. Nunca debe entrar en modo real; no debe usarse una lista pública paginada para reconstruir el inventario completo.
2. /gestion está sin protección en Angular. Un guard mejora UX, pero la protección definitiva debe estar en cada operación backend.
3. La gestión de usuarios documenta que desactivaciones/cambios de rol/contraseña no revocan cookies emitidas. Resolver revalidación de sesión antes de ampliar el uso real.
4. Conservar FichaRevision, loadedStock y comprobación del stock al guardar: UpdateProductService utiliza transacciones y bloqueo de fila. No reemplazarlo por una escritura ciega desde el frontend.
5. El inventario existente no es todavía una reserva de stock ni una integración ventas-pagos. No afirmar que Stripe descuenta unidades automáticamente. La disponibilidad de packs necesita un contrato explícito que respete componentes y reservas futuras.
6. Política CORS revisada admite frontend local en puerto 4200, sin AllowCredentials. Nuestro preview usa 4301. Preferir proxy/same-origin o configurar orígenes exactos y credenciales con CSRF; no abrir CORS a cualquiera.
7. Usuarios de una empresa no pueden separarse por un filtro frontend: multiempresa requiere modelo, pertenencia, consultas y autorización backend.
8. Admin Razor y componente Angular son grandes y reúnen muchas funciones. Modularizar interfaz y contratos sin duplicar reglas de negocio.

## Diseño objetivo propuesto (no implementado)

Mantener la estética/sidebar/tablas/modales de Angular y reutilizar los servicios de aplicación C# existentes.

Frontend features/admin:

- shell: layout, sidebar, cabecera, navegación y contexto de usuario/empresa.
- auth: sesión, roles, guards UX y tratamiento 401/403.
- shared: filtros, tabla/paginación, modal, estados vacío/cargando/error.
- catalog: productos, categorías, perfil de vino, packs.
- media: subida/eliminación y previsualización de imagen.
- inventory: existencias y movimientos reales; concurrencia.
- imports: validación JSON, informe, confirmación y resultado.
- users: administradores/roles.
- orders/customers/visits/finance/billing: inicialmente deshabilitados o marcados Demo, sin mezclar datos ficticios con reales.

Separar DTO de transporte, mapper y modelos de vista. Repositorios HTTP y mock distintos, elegidos explícitamente mediante configuración/inyección; nunca hacer fallback silencioso a demo tras un error de API.
Registro de módulos/capacidades por código estable permite añadir upgrades. Ocultar un módulo o usar feature flags no sustituye autorización o licencias comprobadas en el servidor.

Backend: exponer adaptadores administrativos JSON versionados reutilizando IAdminCatalogQueries, ICreateProduct, IUpdateProduct, servicios de media/importación y usuarios. Espacio propuesto /api/v1/admin/*; NO existe aún. Añadir sesión/CSRF y políticas consistentes para cookies.
No convertir acceso a base de datos en una responsabilidad Angular. Evitar consumir HTML o raspar Razor para obtener listas.

## Orden de integración

1. Preservar copia y cambios locales; integrar actualizaciones en rama codex/*, nunca en main directamente.
2. Sesión real + DTO/repositorios admin + separación de datos demo.
3. Catálogo/categorías/media/packs con nuestro diseño; mantener pruebas de comportamiento.
4. Inventario e importación JSON reales; conflictos y errores visibles.
5. Usuarios, revocación de sesión y pruebas de roles.
6. Módulos de negocio restantes cuando tengan contratos y persistencia. Multiempresa antes de ofrecer una instalación compartida a varias bodegas.
7. Verificar API local/test y build Angular, revisar responsive y permisos, después publicar rama y PR si el usuario lo autoriza.

## Información pendiente

URL/origen de ASP.NET desplegado y si tienda/API comparten dominio o proxy. No hacen falta contraseñas en el chat. Sin ese dato se puede preparar la integración y pruebas locales, pero no afirmar que el panel muestra datos de la instalación real.
