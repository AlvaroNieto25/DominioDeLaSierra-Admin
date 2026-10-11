import { CommonModule } from '@angular/common';
import { Component, OnInit, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminCustomer, AdminDataService, AdminInvoice, AdminProduct, AdminVisit } from './admin-data.service';
import { AdminModalComponent } from './admin-modal.component';
import { AdminOperationsService, Measurement, WineBatch } from './admin-operations.service';
import { availableUnits, customerPeriodSpend, inPeriod, paidOrders, productError, reservationError, safeCsv } from './admin-workspace.model';
import { bottleImage } from '../../core/product-visual';

@Component({selector:'ds-admin-workspace',standalone:true,imports:[CommonModule,FormsModule,AdminModalComponent],templateUrl:'./admin-workspace.component.html',styleUrl:'./admin-workspace.component.scss'})
export class AdminWorkspaceComponent implements OnInit {
  readonly area=input('catalog');
  readonly initialQuery=input('');
  tab='';query='';category='Todas';active='all';minStock:number|null=null;maxStock:number|null=null;
  from='2026-09-01';to='2026-10-31';buyerType='Todos';territory='';territoryLevel='province';topMinimum=100;customerStatus='all';provinceFilter='';cityFilter='';
  readonly product=signal<AdminProduct|null>(null);readonly customer=signal<AdminCustomer|null>(null);readonly visit=signal<AdminVisit|null>(null);readonly invoice=signal<AdminInvoice|null>(null);readonly message=signal('');
  month=new Date(new Date().getFullYear(),new Date().getMonth(),1);selectedDay='';
  ruleDate='';ruleWeekday:number|null=1;ruleFrom='00:00';ruleTo='23:59';
  expenseDate=this.today();expenseConcept='';expenseCategory='Logística';expenseAmount:number|null=null;
  readonly lot=signal<WineBatch|null>(null);lotName='';lotProduct='';lotHarvest=this.today();
  parameter='Temperatura';measurementValue:number|null=null;measurementDate=this.today();measurementNotes='';
  feedbackOrder='';feedbackProduct='';feedbackScore=5;feedbackNotes='';
  readonly stages=['Vendimia','Recepción','Fermentación','Crianza','Embotellado','Salida'];
  readonly units:Record<string,string>={'Temperatura':'°C','pH':'pH','Densidad':'g/ml','Acidez total':'g/l','Volumen':'l'};
  readonly image=(p:AdminProduct)=>bottleImage({...p,slug:''});
  readonly available=(p:AdminProduct)=>availableUnits(p,this.data.products());
  constructor(readonly data:AdminDataService,readonly operations:AdminOperationsService){}
  ngOnInit(){this.query=this.initialQuery();}
  today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  currentTab(){return this.tab||(this.area()==='inventory'?'stock':this.area()==='billing'?'invoices':this.area()==='finance'?'summary':'products');}
  rangeError(){return !!(this.from&&this.to&&this.from>this.to);}
  products(){const q=this.query.trim().toLowerCase();return this.data.products().filter(p=>(!q||`${p.name} ${p.reference} ${p.description??''}`.toLowerCase().includes(q))&&(this.category==='Todas'||p.category===this.category)&&(this.active==='all'||p.active===(this.active==='active'))&&(this.minStock===null||this.available(p)>=this.minStock)&&(this.maxStock===null||this.available(p)<=this.maxStock));}
  kind(p:AdminProduct){return p.kind??(p.category==='Packs'?'Pack':'Wine');}
  openProduct(p?:AdminProduct){if(!this.data.stockDemoMode){this.message.set('La API administrativa aún no está conectada.');return;}this.message.set('');this.product.set(p?{...p,kind:this.kind(p),description:p.description??'',components:(p.components??[]).map(c=>({...c}))}:{id:'',reference:'',name:'',category:'Tintos',price:0,vatRate:21,stock:0,reserved:0,sales:0,updatedAt:'',active:true,kind:'Wine',description:'',grape:'Rufete',components:[]});}
  addComponent(){this.product.update(p=>p?{...p,components:[...(p.components??[]),{productId:'',quantity:1}]}:p);}
  removeComponent(index:number){this.product.update(p=>p?{...p,components:p.components?.filter((_,i)=>i!==index)}:p);}
  componentProducts(){return this.data.products().filter(p=>p.active&&this.kind(p)!=='Pack'&&p.id!==this.product()?.id);}
  componentName(id:string){return this.data.products().find(p=>p.id===id)?.name??'Referencia no disponible';}
  packValue(p:AdminProduct){return (p.components??[]).reduce((total,c)=>total+(this.data.products().find(p=>p.id===c.productId)?.price??0)*c.quantity,0);}
  saveProduct(){const draft=this.product();if(!draft)return;const p={...draft,category:draft.kind==='Pack'?'Packs':draft.category,kind:draft.kind,components:draft.kind==='Pack'?draft.components:[],stock:draft.kind==='Pack'?draft.reserved:draft.stock};const error=productError(p,this.data.products());if(error){this.message.set(error);return;}const {id,sales,reserved,updatedAt,...payload}=p;payload.name=payload.name.trim();payload.reference=payload.reference.trim();if(id)this.data.updateProduct(id,payload);else this.data.addProduct(payload);this.product.set(null);this.message.set('Producto guardado solo en esta sesión de demostración.');}
  orders(){return this.rangeError()?[]:this.data.orders().filter(o=>inPeriod(o.isoDate,this.from,this.to));}
  paid(){return this.rangeError()?[]:paidOrders(this.data.orders(),this.from,this.to);}
  spend(c:AdminCustomer){return this.rangeError()?0:customerPeriodSpend(c,this.data.orders(),this.from,this.to);}
  geoCustomers(){const q=this.query.trim().toLowerCase();return this.data.customers().filter(c=>(!q||`${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(q))&&(this.buyerType==='Todos'||c.type===this.buyerType)&&(this.customerStatus==='all'||c.active===(this.customerStatus==='active'))&&(!this.provinceFilter||c.province===this.provinceFilter)&&(!this.cityFilter||c.city===this.cityFilter));}
  customers(){return this.geoCustomers().filter(c=>!this.territory||this.territoryKey(c)===this.territory);}
  provinces(){return [...new Set(this.data.customers().map(c=>c.province))].sort();}
  cities(){return [...new Set(this.data.customers().filter(c=>!this.provinceFilter||c.province===this.provinceFilter).map(c=>c.city))].sort();}
  mappedOrders(){return this.paid().filter(o=>this.data.customers().some(c=>c.email.toLowerCase()===o.email.toLowerCase())).length;}
  topCustomers(){return this.customers().filter(c=>this.spend(c)>0&&this.spend(c)>=Math.max(0,this.topMinimum)).sort((a,b)=>this.spend(b)-this.spend(a));}
  territoryKey(c:AdminCustomer){return this.territoryLevel==='neighborhood'?`${c.city} · ${c.neighborhood?.trim()||'Barrio sin informar'}`:this.territoryLevel==='city'?c.city:c.province;}
  territories(){const groups=new Map<string,{name:string;amount:number;clients:number;horeca:number;top:string}>();for(const c of this.geoCustomers()){const name=this.territoryKey(c);const amount=this.spend(c);const row=groups.get(name)??{name,amount:0,clients:0,horeca:0,top:''};row.amount+=amount;row.clients++;row.horeca+=c.type==='Restaurante'?1:0;groups.set(name,row);}return [...groups.values()].sort((a,b)=>b.amount-a.amount);}
  heat(amount:number){const max=Math.max(1,...this.territories().map(t=>t.amount));return .06+amount/max*.28;}
  openCustomer(c?:AdminCustomer){const o=c?this.data.orders().find(o=>o.email.toLowerCase()===c.email.toLowerCase()):undefined;this.message.set('');this.customer.set(c?{...c,address:c.address??o?.address??'',postalCode:c.postalCode??o?.postalCode??''}:{id:'',name:'',email:'',phone:'',city:'',province:'',type:'Particular',orders:0,spent:0,annualSpent:0,lastOrder:'Sin pedidos',segment:'Nuevo',discount:0,notes:'',active:true,address:'',postalCode:'',neighborhood:''});}
  saveCustomer(){const c=this.customer();if(!c)return;if(!c.name.trim()||!c.email.trim()||!Number.isFinite(c.discount)||c.discount<0||c.discount>100){this.message.set('Revisa nombre, correo y descuento entre 0 y 100.');return;}if(this.data.customers().some(other=>other.id!==c.id&&other.email.trim().toLowerCase()===c.email.trim().toLowerCase())){this.message.set('Ya existe un cliente con ese correo.');return;}this.data.saveCustomer({...c,id:c.id||`customer-${Date.now()}`,name:c.name.trim(),email:c.email.trim()});this.customer.set(null);this.message.set('Ficha guardada localmente.');}
  expenseRows(){return this.rangeError()?[]:this.operations.expenses().filter(e=>inPeriod(e.date,this.from,this.to));}
  invoices(){const q=this.query.toLowerCase();return this.rangeError()?[]:this.data.invoices().filter(i=>inPeriod(i.isoDate,this.from,this.to)&&(!q||`${i.number} ${i.customer}`.toLowerCase().includes(q)));}
  income(){return this.paid().reduce((sum,o)=>sum+o.total,0);}
  visitIncome(){return this.rangeError()?0:this.data.visits().filter(v=>v.payment==='paid'&&v.status!=='cancelled'&&inPeriod(v.isoDate,this.from,this.to)).reduce((sum,v)=>sum+v.amount,0);}
  expenses(){return this.expenseRows().reduce((sum,e)=>sum+e.amount,0);}
  productSales(){const groups=new Map<string,{reference:string;name:string;units:number;amount:number}>();for(const o of this.paid())for(const l of o.lines){const row=groups.get(l.reference)??{reference:l.reference,name:l.product,units:0,amount:0};row.units+=l.quantity;row.amount+=l.quantity*l.unitPrice;groups.set(l.reference,row);}return [...groups.values()].sort((a,b)=>b.amount-a.amount);}
  addExpense(){if(!this.expenseDate||!this.expenseConcept.trim()||!Number.isFinite(this.expenseAmount)||this.expenseAmount===null||this.expenseAmount<=0){this.message.set('Completa fecha, concepto e importe positivo.');return;}this.operations.expenses.update(rows=>[...rows,{id:`expense-${Date.now()}`,date:this.expenseDate,concept:this.expenseConcept.trim(),category:this.expenseCategory,amount:this.expenseAmount!}]);this.expenseConcept='';this.expenseAmount=null;this.message.set('Gasto de demostración registrado.');}
  export(format:'csv'|'json'){if(this.rangeError()){this.message.set('El rango de fechas no es válido.');return;}const rows=this.exportRows();const body=format==='json'?JSON.stringify(rows,null,2):safeCsv(rows as unknown as Record<string,unknown>[]);const url=URL.createObjectURL(new Blob([body],{type:format==='json'?'application/json':'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`demo-${this.area()}-${this.currentTab()}.${format}`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  moveMonth(delta:number){this.month=new Date(this.month.getFullYear(),this.month.getMonth()+delta,1);this.selectedDay='';}
  monthLabel(){return new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(this.month);}
  days(){const start=new Date(this.month.getFullYear(),this.month.getMonth(),1);start.setDate(start.getDate()-((start.getDay()+6)%7));return Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return {iso:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,number:d.getDate(),inside:d.getMonth()===this.month.getMonth()};});}
  dayVisits(date:string){return this.data.visits().filter(v=>v.isoDate===date&&v.status!=='cancelled');}
  visibleVisits(){return this.data.visits().filter(v=>this.selectedDay?v.isoDate===this.selectedDay:v.isoDate.slice(0,7)===`${this.month.getFullYear()}-${String(this.month.getMonth()+1).padStart(2,'0')}`).sort((a,b)=>`${a.isoDate}${a.time}`.localeCompare(`${b.isoDate}${b.time}`));}
  monthStats(){const rows=this.data.visits().filter(v=>v.isoDate.slice(0,7)===`${this.month.getFullYear()}-${String(this.month.getMonth()+1).padStart(2,'0')}`&&v.status!=='cancelled');return {visits:rows.length,people:rows.reduce((n,v)=>n+v.people,0),income:rows.filter(v=>v.payment==='paid').reduce((n,v)=>n+v.amount,0)};}
  addRule(){if((!this.ruleDate&&this.ruleWeekday===null)||!this.ruleFrom||!this.ruleTo||this.ruleFrom>=this.ruleTo){this.message.set('Selecciona día o fecha y un intervalo horario válido.');return;}this.operations.rules.update(r=>[...r,{id:`rule-${Date.now()}`,date:this.ruleDate,weekday:this.ruleDate?null:Number(this.ruleWeekday),from:this.ruleFrom,to:this.ruleFrom==='00:00'&&this.ruleTo==='23:59'?'24:00':this.ruleTo}]);this.message.set('Bloqueo interno aplicado. La web de reservas aún necesita conectar estas reglas al backend.');}
  removeRule(id:string){this.operations.rules.update(r=>r.filter(rule=>rule.id!==id));}
  ruleLabel(rule:{date:string;weekday:number|null}){return rule.date||['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][rule.weekday??0];}
  removeExpense(id:string){this.operations.expenses.update(rows=>rows.filter(row=>row.id!==id));}
  openLot(l:WineBatch){this.message.set('');this.lot.set({...l,measurements:[...l.measurements]});}
  openVisit(v?:AdminVisit){this.message.set('');this.visit.set(v?{...v}:{id:'',customer:'',email:'',phone:'',type:'Visita esencial',date:'',isoDate:this.selectedDay||this.today(),time:'11:00',people:2,status:'pending',payment:'pending',amount:36,previousVisits:0,notes:''});}
  saveVisit(){const v=this.visit();if(!v)return;if(!v.customer.trim()||!v.email.trim()||!Number.isSafeInteger(v.people)||v.people<1||!Number.isFinite(v.amount)||v.amount<0){this.message.set('Completa contacto, personas e importe válido.');return;}const original=this.data.visits().find(x=>x.id===v.id);const scheduleChanged=!original||original.isoDate!==v.isoDate||original.time!==v.time||(original.status==='cancelled'&&v.status!=='cancelled');const error=scheduleChanged?reservationError(v.isoDate,v.time,this.operations.noticeDays(),this.operations.rules()):'';if(error){this.message.set(error);return;}this.data.saveVisit({...v,id:v.id||`visit-${Date.now()}`,date:new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short'}).format(new Date(`${v.isoDate}T12:00:00`))});this.visit.set(null);this.message.set('Reserva guardada localmente. No se ha realizado ningún cobro.');}
  cancelVisit(){const v=this.visit();if(!v?.id)return;this.data.saveVisit({...v,status:'cancelled'});this.visit.set(null);this.message.set('Visita cancelada en la demo. No se ha realizado reembolso ni enviado notificación.');}
  createLot(){if(!this.lotName.trim()||!this.lotProduct||!this.lotHarvest){this.message.set('Completa nombre, producto y fecha de vendimia.');return;}const lot:WineBatch={id:`lot-${Date.now()}`,name:this.lotName.trim(),productId:this.lotProduct,harvest:this.lotHarvest,stage:'Vendimia',notes:'',measurements:[]};this.operations.lots.update(rows=>[lot,...rows]);this.lot.set({...lot});this.lotName='';}
  saveLot(){const l=this.lot();if(l)this.operations.lots.update(rows=>rows.map(row=>row.id===l.id?{...l,measurements:[...l.measurements]}:row));}
  addMeasurement(){const l=this.lot();const value=this.measurementValue;if(!l||value===null||!Number.isFinite(value)||!this.measurementDate||this.measurementDate<l.harvest||(this.parameter==='pH'&&(value<0||value>14))||(this.parameter!=='Temperatura'&&value<0)){this.message.set('Revisa fecha y valor de la medición.');return;}const m:Measurement={id:`measurement-${Date.now()}`,date:this.measurementDate,stage:l.stage,parameter:this.parameter,value,unit:this.units[this.parameter],notes:this.measurementNotes};this.lot.set({...l,measurements:[...l.measurements,m]});this.saveLot();this.measurementValue=null;this.measurementNotes='';}
  feedbackOrders(){return this.data.orders().filter(o=>o.status==='delivered'||o.status==='collected');}
  addFeedback(){const o=this.feedbackOrders().find(o=>o.id===this.feedbackOrder);if(!o||!o.lines.some(l=>l.reference===this.feedbackProduct)||!Number.isInteger(this.feedbackScore)||this.feedbackScore<1||this.feedbackScore>5){this.message.set('Selecciona un pedido entregado, uno de sus productos y valoración entre 1 y 5.');return;}this.operations.feedback.update(rows=>[...rows,{id:`feedback-${Date.now()}`,orderId:o.id,product:this.feedbackProduct,score:this.feedbackScore,notes:this.feedbackNotes,date:this.today()}]);this.feedbackNotes='';this.message.set('Feedback registrado manualmente. No se ha contactado al cliente.');}
  feedbackLines(){return this.feedbackOrders().find(o=>o.id===this.feedbackOrder)?.lines??[];}
  exportRows():Record<string,unknown>[]{
    if(this.area()==='customers')return this.customers().map(c=>({...c,periodSpend:this.spend(c)}));
    if(this.currentTab()==='invoices')return this.invoices().map(i=>({...i}));
    if(this.currentTab()==='products')return this.productSales().map(p=>({...p}));
    if(this.currentTab()==='expenses')return this.expenseRows().map(e=>({...e}));
    if(this.currentTab()==='summary')return [
      ...this.paid().map(o=>({date:o.isoDate,kind:'Ingreso · pedido',reference:o.number,party:o.customer,amount:o.total})),
      ...this.data.visits().filter(v=>v.payment==='paid'&&v.status!=='cancelled'&&inPeriod(v.isoDate,this.from,this.to)).map(v=>({date:v.isoDate,kind:'Ingreso · visita',reference:v.id,party:v.customer,amount:v.amount})),
      ...this.expenseRows().map(e=>({date:e.date,kind:'Gasto',reference:e.id,party:e.concept,amount:-e.amount}))
    ];
    return this.orders().map(o=>({...o}));
  }
  feedbackSummary(){const groups=new Map<string,{reference:string;responses:number;total:number;average:number}>();for(const f of this.operations.feedback()){const row=groups.get(f.product)??{reference:f.product,responses:0,total:0,average:0};row.responses++;row.total+=f.score;row.average=row.total/row.responses;groups.set(f.product,row);}return [...groups.values()];}
}
