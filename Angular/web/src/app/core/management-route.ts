/** Match the internal route, not similarly named public paths. Query/hash are irrelevant. */
export function isManagementPath(url: string): boolean {
  const path = url.split(/[?#]/, 1)[0];
  return /^\/gestion(?:[\/;]|$)/.test(path);
}
