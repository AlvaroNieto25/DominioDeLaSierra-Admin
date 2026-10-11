/** Preserve page position on mobile and keep nested modals locked until the last closes. */
const locks = new Set<symbol>();
let restorePage: (() => void) | undefined;
export function lockModalScroll(): () => void {
  const token = Symbol('modal');
  if (!locks.size) {
    const body = document.body, root = document.documentElement;
    const x = window.scrollX, y = window.scrollY;
    const keys = ['position', 'top', 'left', 'width', 'overflow', 'paddingRight'] as const;
    const saved = keys.map(key => [key, body.style[key]] as const);
    const overflow = root.style.overflow, behavior = root.style.scrollBehavior;
    const gutter = Math.max(0, window.innerWidth - root.clientWidth);
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
    root.style.overflow = 'hidden';
    body.style.position = 'fixed'; body.style.top = `-${y}px`; body.style.left = `-${x}px`;
    body.style.width = '100%'; body.style.overflow = 'hidden';
    if (gutter) body.style.paddingRight = `${padding + gutter}px`;
    body.classList.add('modal-open');
    restorePage = () => {
      saved.forEach(([key, value]) => body.style[key] = value);
      root.style.overflow = overflow; root.style.scrollBehavior = 'auto';
      window.scrollTo({ left:x, top:y, behavior:'instant' });
      root.style.scrollBehavior = behavior; body.classList.remove('modal-open');
    };
  }
  locks.add(token);
  return () => {
    if (!locks.delete(token) || locks.size) return;
    restorePage?.(); restorePage = undefined;
  };
}
