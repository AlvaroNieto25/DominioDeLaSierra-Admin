import { Component, input, output } from '@angular/core';
import { ModalFocusDirective } from '../../shared/modal-focus.directive';

@Component({selector:'ds-admin-modal',standalone:true,imports:[ModalFocusDirective],template:`
  <dialog dsModalFocus [attr.aria-label]="label()" (cancel)="$event.preventDefault();closed.emit()">
    <header><strong>{{label()}}</strong><button type="button" aria-label="Cerrar ventana" (click)="closed.emit()">×</button></header>
    <div class="body"><ng-content /></div>
  </dialog>`,styles:[`
  dialog{box-sizing:border-box;border:1px solid #dcd3c7;border-radius:20px;padding:0;width:min(760px,calc(100vw - 28px));max-height:calc(100dvh - 28px);margin:auto;background:#fbfaf7;color:#292324;font:inherit;box-shadow:0 30px 100px #24131955;overflow:auto}
  dialog::backdrop{background:#24131988;backdrop-filter:blur(5px)}header{position:sticky;top:0;z-index:2;background:#fbfaf7;display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #e6dfd6}header button{display:grid;place-items:center;width:38px;height:38px;border:1px solid #dcd3c7;border-radius:50%;background:none;font-size:24px;cursor:pointer}.body{padding:24px}@media(max-width:600px){.body{padding:16px}header{padding:12px 16px}}`]
})
export class AdminModalComponent { readonly label=input('Detalle');readonly closed=output<void>(); }
