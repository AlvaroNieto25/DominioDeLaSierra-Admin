// Public deployments must never attempt to contact the visitor's own computer.
// Live API requests use the same origin; hosting must route /api to ASP.NET Core.
export const environment = {
  production: true,
  mockCatalog: false,
  apiBaseUrl: ''
};
