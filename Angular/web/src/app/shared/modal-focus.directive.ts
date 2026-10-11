import { AfterViewInit, Directive, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { lockModalScroll } from './modal-scroll-lock';

/** Keyboard containment and focus restoration for non-native modal overlays. */
@Directive({ selector: '[dsModalFocus]', standalone: true })
export class ModalFocusDirective implements AfterViewInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private previousFocus: HTMLElement | null = null;
  private release?: () => void;
  private portal?: { node: HTMLElement; placeholder: Comment };
  private background: Array<{ node: HTMLElement; inert: boolean }> = [];
  ngAfterViewInit(): void {
    this.previousFocus = document.activeElement as HTMLElement;
    const element = this.element.nativeElement;
    const overlay = element.closest<HTMLElement>('.quick-view-backdrop, .age-gate');
    if (overlay && overlay.parentNode !== document.body) {
      const placeholder = document.createComment('modal-position');
      overlay.before(placeholder); document.body.appendChild(overlay);
      this.portal = { node:overlay, placeholder };
      this.background = Array.from(document.body.children).filter(node => node !== overlay && node instanceof HTMLElement)
        .map(node => ({ node:node as HTMLElement, inert:(node as HTMLElement).inert }));
      this.background.forEach(({ node }) => node.inert = true);
    }
    this.release = lockModalScroll();
    if (element instanceof HTMLDialogElement && !element.open) element.showModal();
    this.focusable()[0]?.focus({ preventScroll:true });
  }
  @HostListener('keydown', ['$event']) onKey(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const controls = this.focusable();
    const first = controls[0], last = controls.at(-1);
    if (!first || !last) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus({ preventScroll:true }); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus({ preventScroll:true }); }
  }
  ngOnDestroy(): void {
    const element = this.element.nativeElement;
    if (element instanceof HTMLDialogElement && element.open) element.close();
    this.background.forEach(({ node, inert }) => node.inert = inert);
    if (this.portal) this.portal.placeholder.replaceWith(this.portal.node);
    this.release?.();
    if (this.previousFocus?.isConnected) this.previousFocus.focus({ preventScroll:true });
  }
  private focusable(): HTMLElement[] {
    return Array.from(this.element.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter(node => node.getClientRects().length > 0);
  }
}
