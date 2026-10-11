import { Component, HostListener, input, output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GROUP_CONTACT_EMAIL, GROUP_MIN_PEOPLE, GroupVisitContact, groupContactMailto, validGroupContact, validGroupPhone } from '../../core/group-visit-contact';
import { ModalFocusDirective } from '../../shared/modal-focus.directive';

@Component({
  selector: 'ds-group-visit-contact',
  standalone: true,
  imports: [FormsModule, RouterLink, ModalFocusDirective],
  template: `
    <dialog class="group-overlay" dsModalFocus aria-modal="true" aria-labelledby="group-title" aria-describedby="group-description" (cancel)="$event.preventDefault(); close()" (click)="closeOnBackdrop($event)">
      <section class="group-dialog" (click)="$event.stopPropagation()">
        <button type="button" class="group-close" (click)="close()" aria-label="Cerrar solicitud de grupo">×</button>
        <p class="eyebrow">Grupos grandes · Más de 6 personas</p>
        <h2 id="group-title">La Sierra, <em>en grupo.</em></h2>
        <p id="group-description">Cuéntanos cuántos sois. Organizaremos la fecha, la experiencia y el precio directamente con la bodega.</p>
        <div class="group-context"><strong>{{ experience() }}</strong>@if (preferredDate()) { <span>Preferencia: {{ preferredDate() }} {{ preferredTime() }}</span> }</div>
        <form #groupForm="ngForm" (ngSubmit)="prepare(groupForm)">
          <div class="group-fields">
            <label for="group-name">Nombre y apellidos
              <input id="group-name" name="name" [(ngModel)]="form.name" (ngModelChange)="invalidateDraft()" #nameField="ngModel" required maxlength="120" autocomplete="name" placeholder="Tu nombre y apellidos">
              @if (nameField.touched && !form.name.trim()) { <small class="group-error">Indica tu nombre.</small> }
            </label>
            <label for="group-email">Correo electrónico
              <input id="group-email" name="email" [(ngModel)]="form.email" (ngModelChange)="invalidateDraft()" #emailField="ngModel" type="email" email required maxlength="254" autocomplete="email" placeholder="tu@correo.com">
              @if (emailField.touched && emailField.invalid) { <small class="group-error">Introduce un correo válido.</small> }
            </label>
            <label for="group-phone">Número de teléfono
              <input id="group-phone" name="phone" [(ngModel)]="form.phone" (ngModelChange)="invalidateDraft()" #phoneField="ngModel" type="tel" required maxlength="40" autocomplete="tel" placeholder="+34 600 000 000">
              @if (phoneField.touched && !phoneValid()) { <small class="group-error">Revisa el número de teléfono.</small> }
            </label>
            <label for="group-people">Personas aproximadas
              <input id="group-people" name="approximatePeople" [(ngModel)]="form.approximatePeople" (ngModelChange)="invalidateDraft()" #peopleField="ngModel" type="number" required [min]="minimumPeople" step="1" inputmode="numeric" placeholder="Por ejemplo, 12">
              @if (peopleField.touched && !peopleValid()) { <small class="group-error">Indica al menos 7 personas, sin decimales.</small> }
            </label>
          </div>
          <label class="privacy-check"><input type="checkbox" name="privacy" [(ngModel)]="form.privacy" (ngModelChange)="invalidateDraft()" required><span>Acepto la <a routerLink="/privacidad" (click)="close()">política de privacidad</a> para atender mi solicitud.</span></label>
          @if (draft()) {
            <div class="group-ready" role="status"><strong>Tu consulta está preparada.</strong><p>Abre tu correo para enviarla a {{ contactEmail }}. No se ha enviado automáticamente ni confirmado ninguna reserva.</p></div>
            <a class="button button-dark full-width" [href]="draft()" (click)="close()">Abrir correo para enviar <span>↗</span></a>
          } @else {
            <button type="submit" class="button button-dark full-width" [disabled]="groupForm.invalid || !valid()">Preparar solicitud <span>↗</span></button>
          }
          <p class="group-delivery">Se enviará desde tu aplicación de correo, no automáticamente. También puedes escribir a <a [href]="'mailto:' + contactEmail">{{ contactEmail }}</a>.</p>
        </form>
      </section>
    </dialog>
  `,
  styles: [`
    :host{display:contents}
    .group-overlay{position:fixed;inset:0;z-index:1400;box-sizing:border-box;width:100%;height:100%;height:100dvh;max-width:none;max-height:none;margin:0;border:0;display:grid;place-items:center;padding:16px;background:transparent;overflow:hidden;overscroll-behavior:none}
    .group-overlay{grid-template-rows:minmax(0,1fr)}.group-overlay:not([open]){display:none}.group-overlay::backdrop{background:#25131ac2;backdrop-filter:blur(7px)}
    .group-dialog{box-sizing:border-box;position:relative;width:min(600px,100%);max-height:100%;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:26px;border:1px solid #d5c3aa;border-radius:22px;background:#faf7f0;color:#382029;box-shadow:0 24px 90px #190a1940;scrollbar-gutter:stable}
    .group-close{position:absolute;top:14px;right:14px;display:grid;place-items:center;width:44px;height:44px;border:1px solid #dccdbb;border-radius:50%;background:transparent;color:#753047;font-size:26px;line-height:1}
    .group-close:hover{background:#eee5d9}.group-signature{display:block;object-fit:contain;margin:0 0 16px}
    .group-dialog>.eyebrow{font-size:.6rem;margin:0 44px 12px 0}.group-dialog h2{font-size:clamp(1.65rem,5vw,2.3rem);line-height:1.12;margin:0 0 10px}
    #group-description{font-size:.82rem;line-height:1.5;margin:0 0 12px;color:#6b5c62}
    .group-context{display:grid;gap:4px;margin-bottom:14px;padding:8px 12px;border-left:2px solid #b69a71;background:#eee6db;font-size:.78rem}.group-context span{color:#6b5c62}
    .group-fields{display:grid;grid-template-columns:1fr 1fr;gap:18px 16px}
    .group-fields label{display:grid;align-content:start;gap:7px;min-width:0;font:500 .78rem/1.4 'DM Sans',sans-serif}
    .group-fields input{box-sizing:border-box;min-width:0;width:100%;min-height:48px;padding:11px 12px;border:1px solid #cbbbaa;border-radius:9px;background:#fffcf7;color:#382029;font:400 16px/1.4 'DM Sans',sans-serif}
    .group-fields input:focus-visible{outline:2px solid #a77942;outline-offset:2px}.group-fields small{font-size:.7rem;font-weight:400;line-height:1.5;color:#76676d}.group-fields .group-error{color:#922e48}
    .group-dialog .privacy-check{display:flex;align-items:flex-start;gap:10px;margin:14px 0;font-size:.75rem;line-height:1.5}.group-dialog .privacy-check input{flex:0 0 18px;width:18px;height:18px;min-width:18px;margin:2px 0 0}.group-dialog .privacy-check span{min-width:0}.group-dialog .privacy-check a{text-decoration:underline}
    .group-dialog .button{box-sizing:border-box;justify-content:center;gap:14px;border-radius:9px}
    .group-ready{padding:14px 16px;margin-bottom:16px;border-radius:9px;background:#e9e1d4;font-size:.83rem;line-height:1.6}.group-ready p{margin:4px 0 0;overflow-wrap:anywhere}
    .group-delivery{margin:10px 0 0;font-size:.7rem;line-height:1.45;color:#76676d}.group-delivery a{text-decoration:underline;overflow-wrap:anywhere}
    @media(max-width:600px){.group-overlay{padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}.group-dialog{padding:20px 16px;border-radius:16px;scrollbar-gutter:auto}.group-fields{grid-template-columns:1fr;gap:10px}.group-fields label{gap:4px}.group-fields input{min-height:44px;padding:8px 10px}.group-dialog h2{font-size:1.85rem}.group-dialog .button{min-height:44px;padding:12px}.group-close{top:8px;right:8px}}
    @media(prefers-reduced-motion:reduce){.group-close,.group-dialog .button{transition:none}}
  `]
})
export class GroupVisitContactComponent {
  readonly experience = input('Visita esencial');
  readonly preferredDate = input('');
  readonly preferredTime = input('');
  readonly closed = output<void>();
  readonly draft = signal('');
  readonly contactEmail = GROUP_CONTACT_EMAIL;
  readonly minimumPeople = GROUP_MIN_PEOPLE;
  form: GroupVisitContact = { name:'', email:'', phone:'', approximatePeople:null, privacy:false };
  valid(): boolean { return validGroupContact(this.form); }
  phoneValid(): boolean { return validGroupPhone(this.form.phone); }
  peopleValid(): boolean { return Number.isSafeInteger(this.form.approximatePeople) && Number(this.form.approximatePeople) >= this.minimumPeople; }
  invalidateDraft(): void { this.draft.set(''); }
  prepare(form: NgForm): void {
    if (form.invalid || !this.valid()) { form.control.markAllAsTouched(); return; }
    this.draft.set(groupContactMailto(this.form, { experience:this.experience(), preferredDate:this.preferredDate(), preferredTime:this.preferredTime() }));
  }
  @HostListener('document:keydown.escape') close(): void { this.closed.emit(); }
  closeOnBackdrop(event: MouseEvent): void { if (event.target === event.currentTarget) this.close(); }
}
