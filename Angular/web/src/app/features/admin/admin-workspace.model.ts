import { AdminCustomer, AdminOrder, AdminProduct } from './admin-data.service';

/** Pure rules; replace repository data without changing presentation or inventing stock. */
export function availableUnits(product:AdminProduct, products:readonly AdminProduct[]):number {
  if(product.kind!=='Pack') return Math.max(0, product.stock-product.reserved);
  if(!product.components?.length) return 0;
  return Math.min(...product.components.map(part=>{
    const item=products.find(p=>p.id===part.productId);
    return !item?.active || item.kind==='Pack' || !Number.isSafeInteger(part.quantity) || part.quantity<1 ? 0 : Math.floor(Math.max(0,item.stock-item.reserved)/part.quantity);
  }));
}
export function productError(p:AdminProduct, products:readonly AdminProduct[]):string {
  if(!p.name.trim()||!p.reference.trim()) return 'Nombre y referencia son obligatorios.';
  if(products.some(other=>other.id!==p.id&&other.reference.toLowerCase()===p.reference.trim().toLowerCase())) return 'La referencia ya existe.';
  if(!Number.isFinite(p.price)||p.price<0||!Number.isFinite(p.vatRate)||p.vatRate<0||p.vatRate>100) return 'Revisa precio e IVA.';
  if(!Number.isSafeInteger(p.stock)||p.stock<p.reserved) return 'El stock debe ser entero y no inferior al reservado.';
  if(p.kind==='Wine' && ((p.alcohol!=null&&(!Number.isFinite(p.alcohol)||p.alcohol<0||p.alcohol>100))||(p.vintage!=null&&(!Number.isInteger(p.vintage)||p.vintage<1900||p.vintage>new Date().getFullYear()+1)))) return 'Revisa añada y graduación.';
  if(p.kind==='Pack') {
    if(!p.components?.length) return 'Añade al menos un producto al pack.';
    if(new Set(p.components.map(c=>c.productId)).size!==p.components.length) return 'Agrupa las unidades de un mismo producto en una sola línea.';
    if(p.components.some(c=>!Number.isSafeInteger(c.quantity)||c.quantity<1||!products.some(other=>other.id===c.productId&&other.id!==p.id&&other.kind!=='Pack'&&other.active))) return 'El pack necesita productos activos y cantidades enteras positivas.';
  }
  return '';
}
export const inPeriod=(date:string,from:string,to:string)=> (!from||date>=from)&&(!to||date<=to);
export const paidOrders=(orders:readonly AdminOrder[],from:string,to:string)=> orders.filter(o=>inPeriod(o.isoDate,from,to)&&o.payment==='succeeded'&&o.status!=='cancelled');
export function customerPeriodSpend(customer:AdminCustomer,orders:readonly AdminOrder[],from:string,to:string):number {
  return paidOrders(orders,from,to).filter(o=>o.email.toLowerCase()===customer.email.toLowerCase()).reduce((sum,o)=>sum+o.total,0);
}
export interface AvailabilityRule {id:string; date:string; weekday:number|null; from:string; to:string;}
export function reservationError(date:string,time:string,notice:number,rules:readonly AvailabilityRule[],now=new Date()):string {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)||time>'23:59'||time.slice(3)>'59'||!Number.isInteger(notice)||notice<0) return 'Fecha, hora o antelación no válidas.';
  const day=new Date(`${date}T12:00:00`); const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()+notice);
  if(Number.isNaN(day.getTime())||day.getFullYear()!==Number(date.slice(0,4))||day.getMonth()+1!==Number(date.slice(5,7))||day.getDate()!==Number(date.slice(8,10))) return 'Fecha no válida.';
  if(day<start||new Date(`${date}T${time}:00`)<=now) return `La reserva requiere ${notice} días de antelación y una hora futura.`;
  if(rules.some(r=>(r.date?r.date===date:r.weekday===day.getDay())&&time>=r.from&&time<r.to)) return 'Ese día u horario está bloqueado.';
  return '';
}
export function safeCsv(rows:Record<string,unknown>[]):string {
  if(!rows.length)return '';
  const keys=Object.keys(rows[0]).filter(key=>typeof rows[0][key]!=='object');
  const cell=(v:unknown)=>{let value=String(v??'');if(/^[\s]*[=+@-]/.test(value))value="'"+value;return '"'+value.replaceAll('"','""')+'"';};
  return '\uFEFF'+[keys.map(cell).join(';'),...rows.map(row=>keys.map(key=>cell(row[key])).join(';'))].join('\r\n');
}
