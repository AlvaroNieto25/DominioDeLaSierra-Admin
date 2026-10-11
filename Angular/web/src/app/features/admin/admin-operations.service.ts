import { Injectable, signal } from '@angular/core';
import { AvailabilityRule } from './admin-workspace.model';
export interface Expense {id:string;date:string;concept:string;category:string;amount:number;}
export interface Measurement {id:string;date:string;stage:string;parameter:string;value:number;unit:string;notes:string;}
export interface WineBatch {id:string;name:string;productId:string;harvest:string;stage:string;notes:string;measurements:Measurement[];}
export interface Feedback {id:string;orderId:string;product:string;score:number;notes:string;date:string;}
/** Review-only repository. Replace with tenant-scoped API adapters before deployment. */
@Injectable({providedIn:'root'})
export class AdminOperationsService {
  readonly expenses=signal<Expense[]>([{id:'e1',date:'2026-09-28',concept:'Embalajes · ejemplo',category:'Logística',amount:85},{id:'e2',date:'2026-09-29',concept:'Transporte · ejemplo',category:'Logística',amount:42}]);
  readonly rules=signal<AvailabilityRule[]>([]);
  readonly noticeDays=signal(2);
  readonly lots=signal<WineBatch[]>([]);
  readonly feedback=signal<Feedback[]>([]);
}
