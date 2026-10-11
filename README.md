# Dominio de la Sierra · Admin

Frontend Angular con tienda y panel interno de revisión.

La última versión se publica en la rama [`codex/admin-dashboard`](https://github.com/AlvaroNieto25/DominioDeLaSierra-Admin/tree/codex/admin-dashboard).

## Ejecutar

```bash
cd Angular/web
npm ci
npm run preview
```

Panel: http://127.0.0.1:4301/gestion

El panel sigue siendo una demostración: no guarda cambios en la base de datos, ni procesa pagos, ni emite facturas fiscales. Consultar `docs/panel-admin-upgrades-2026-10-05.md` en la rama de revisión.

El repositorio original de aerus95 no se modifica.

## Contenido de esta entrega

- Catálogo, packs, descripciones e inventario integrado.
- Pedidos, avisos descartables y fichas de clientes.
- Análisis territorial por datos informados y ranking por fechas.
- Finanzas con gastos, facturas y exportación CSV/JSON.
- Agenda de visitas, bloqueos de disponibilidad y cancelaciones.
- Tipografía configurable y upgrade piloto de elaboración por lotes.
- Tienda y recursos visuales necesarios para ejecutar el frontend completo.

No se incluyen dependencias instaladas, compilaciones, credenciales ni backend C#. El frontend de producción requiere una API administrativa real, autenticación y aislamiento por empresa antes de tratar datos reales.

## Comprobaciones

```bash
cd Angular/web
node scripts/check-admin-workspaces.cjs
node scripts/check-ui-logic.cjs
node scripts/check-modal-behaviour.cjs
node scripts/check-cart-motion.cjs
npm run build:hostinger
```
