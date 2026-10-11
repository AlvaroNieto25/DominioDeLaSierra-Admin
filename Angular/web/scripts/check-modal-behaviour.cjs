/* DOM doubles test lock/restore behaviour; visual mobile QA remains separate. */
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = resolve(__dirname, '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
function load(path, context) {
  const code = ts.transpileModule(read(path), { compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true} }).outputText;
  const exports = {};
  runInNewContext(code, {exports, ...context}); return exports;
}
const classes = new Set();
const body = {style:{position:'relative',top:'',left:'',width:'',overflow:'auto',paddingRight:'4px'},classList:{add:key=>classes.add(key),remove:key=>classes.delete(key)}};
const html = {style:{overflow:'',scrollBehavior:'smooth'},clientWidth:1000};
const scrolls = [];
const win = {scrollX:0,scrollY:730,innerWidth:1016,scrollTo:options=>scrolls.push(options)};
const { lockModalScroll } = load('src/app/shared/modal-scroll-lock.ts', {require(){return{}},document:{body,documentElement:html},window:win,getComputedStyle:()=>({paddingRight:'4px'})});
const first = lockModalScroll();
assert.equal(body.style.top,'-730px'); assert.equal(body.style.position,'fixed');
assert.equal(body.style.paddingRight,'20px'); assert.equal(html.style.overflow,'hidden');
assert.ok(classes.has('modal-open'));
const second = lockModalScroll();
first(); first(); assert.equal(body.style.position,'fixed'); assert.equal(scrolls.length,0);
second(); assert.equal(body.style.position,'relative'); assert.equal(body.style.overflow,'auto');
assert.equal(body.style.paddingRight,'4px'); assert.equal(html.style.overflow,'');
assert.equal(html.style.scrollBehavior,'smooth'); assert.equal(scrolls[0].top,730);
assert.equal(scrolls[0].behavior,'instant'); assert.ok(!classes.has('modal-open'));
second(); assert.equal(scrolls.length,1);
win.scrollY=900; const next = lockModalScroll(); assert.equal(body.style.top,'-900px'); next();
assert.equal(scrolls[1].top,900);
let acquired=0,released=0,shown=0,closed=0;
const focus=[];
const previous = {isConnected:true,focus:options=>focus.push(['previous',options])};
const control = {getClientRects:()=>[{}],focus:options=>focus.push(['control',options])};
class Dialog {
  open=false;
  closest(){return null;}
  querySelectorAll(){return[control];}
  showModal(){this.open=true;shown++;}
  close(){this.open=false;closed++;}
}
const modal = new Dialog();
const { ModalFocusDirective } = load('src/app/shared/modal-focus.directive.ts', {
  require:name=> name==='./modal-scroll-lock'?{lockModalScroll:()=>{acquired++;return()=>released++;}}:{inject:()=>({nativeElement:modal}),Directive:()=>target=>target,HostListener:()=>()=>{}},
  document:{activeElement:previous},HTMLDialogElement:Dialog
});
const directive = new ModalFocusDirective(); directive.ngAfterViewInit();
assert.equal(shown,1); assert.equal(acquired,1); assert.equal(focus[0][1].preventScroll,true);
directive.ngOnDestroy(); assert.equal(closed,1); assert.equal(released,1);
assert.equal(focus.at(-1)[0],'previous'); assert.equal(focus.at(-1)[1].preventScroll,true);
const group = read('src/app/features/visits/group-visit-contact.component.ts');
assert.ok(group.includes('<dialog class="group-overlay" dsModalFocus'));
assert.ok(group.includes('height:100dvh')); assert.ok(group.includes('overflow-y:auto'));
assert.ok(group.includes('(cancel)="$event.preventDefault(); close()"'));
assert.ok(group.includes('class="privacy-check"'));
assert.ok(!group.includes('aria-describedby="group-phone-help"'));
const app = read('src/app/app.component.ts');
assert.ok(app.includes("element.closest('dialog, [role=\"dialog\"]"));
assert.ok(app.includes('class="age-card" dsModalFocus'));
assert.ok(!read('src/app/features/visits/visits.component.ts').includes('reservation-still-life'));
const styles = read('src/brand.scss');
assert.ok(styles.includes('body.modal-open .cookie-panel'));
assert.ok(styles.includes('body:has(dialog[open]) .cookie-panel'));
assert.ok(styles.includes('max-height:min(55dvh,400px)'));
const config = JSON.parse(read('angular.json'));
assert.equal(config.projects['dominio-de-la-sierra'].architect.build.configurations.production.fileReplacements[0].with,'src/environments/environment.production.ts');
assert.ok(!read('src/environments/environment.production.ts').includes('localhost'));
console.log('OK: modal nativo, scroll bloqueado, posición restaurada, bloqueo anidado, foco sin salto, cookies subordinadas y API pública sin loopback.');
