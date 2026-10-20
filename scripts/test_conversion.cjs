'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
class Element {
  constructor(dataset = {}) { this.dataset=dataset; this.hidden=false; this.value=''; this.attrs={}; this.listeners={}; this.classes=new Set(); this.firstChild={textContent:''}; this.selectedOptions=[{textContent:'CAR e regularização rural'}]; this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)}; }
  addEventListener(type,fn){(this.listeners[type] ||= []).push(fn);}
  async fire(type,event={}){for(const fn of this.listeners[type]||[]) await fn(event);}
  setAttribute(k,v){this.attrs[k]=v;} getAttribute(k){return this.attrs[k];} removeAttribute(k){delete this.attrs[k];}
  querySelectorAll(){return [];} querySelector(){return null;} contains(el){return el===this;}
  focus(){this.focused=true;} select(){this.selected=true;} scrollIntoView(){this.scrolled=true;} scrollBy(options){this.scrolledBy=options;}
  reportValidity(){return this.valid!==false;}
}
function boot({hash='',empty=false,clipboardFails=false}={}){
 const selectors=['.menu-toggle','#mobile-nav','.service-filters','#show-all-services','#services-status','#solucoes','#quote-form','#request-preview','#email-fallback','#retry-whatsapp','#copy-status','#copy-request','#service','#city','#unit','#name','#message','#selected-service','.form-progress','#form-next','#form-back','[data-form-step="1"]','[data-form-step="2"]','.clients-rail','.rail-controls','[data-clients-prev]','[data-clients-next]','#year','.whatsapp-float','.mobile-cta','#orcamento'];
 const elements=new Map((empty?[]:selectors).map(s=>[s,new Element()]));
 const filters=empty?[]:['all','ambiental','seguranca','maquinas'].map(filter=>new Element({filter}));
 const cards=empty?[]:['ambiental','ambiental','ambiental','ambiental','ambiental','ambiental','seguranca','seguranca','maquinas'].map((category,i)=>{const el=new Element({category});el.id='servico-'+[1,2,3,6,7,8,4,9,5][i];return el;});
 const labels=empty?[]:[1,2].map(n=>new Element({stepLabel:String(n)}));
 const quoteLink=new Element({quoteService:'Regularização rural'});
 const lists={'.solution-card':cards,'[data-filter]':filters,'[data-step-label]':labels,'[data-quote-service]':empty?[]:[quoteLink]};
 const document=new Element(); document.querySelector=s=>elements.get(s)||null;document.querySelectorAll=s=>lists[s]||[];
 const opened=[],observed=[],copied=[];const window=new Element(); window.location={hash};window.matchMedia=()=>({matches:false,addEventListener(){}});window.open=(...args)=>opened.push(args);
 function IntersectionObserver(callback){this.observe=el=>observed.push({el,callback});}window.IntersectionObserver=IntersectionObserver;
 if(!empty){elements.get('.menu-toggle').setAttribute('aria-expanded','false');elements.get('#service').valid=false;elements.get('#unit').value='maraba';elements.get('#email-fallback').hidden=true;elements.get('.clients-rail').clientWidth=500;}
 const context=vm.createContext({document,window,IntersectionObserver,Date,FormData:class{get(key){return elements.get('#'+key)?.value;}},navigator:{clipboard:{async writeText(value){if(clipboardFails)throw Error('unavailable');copied.push(value);}}}});
 vm.runInContext(source,context);
 return {elements,filters,cards,labels,quoteLink,opened,window,document,observed,copied};
}
const submit={preventDefault(){}};
test('home starts with three services, supports filtering and exposing all nine',async()=>{
 const ui=boot(); assert.equal(ui.cards.filter(c=>!c.hidden).length,3);
 await ui.filters[2].fire('click');assert.equal(ui.cards.filter(c=>!c.hidden).length,2);assert.equal(ui.filters[2].getAttribute('aria-pressed'),'true');
 await ui.filters[3].fire('click');assert.equal(ui.cards.filter(c=>!c.hidden).length,1);
 await ui.filters[0].fire('click');await ui.elements.get('#show-all-services').fire('click');assert.equal(ui.cards.filter(c=>!c.hidden).length,9);
});
test('direct links reveal services that are initially hidden',()=>{
 const ui=boot({hash:'#servico-9'});const card=ui.cards.find(c=>c.id==='servico-9');assert.equal(card.hidden,false);assert.equal(card.scrolled,true);
});
test('required service blocks progression; service CTA preselects the quote',async()=>{
 const ui=boot();await ui.elements.get('#form-next').fire('click');assert.equal(ui.elements.get('[data-form-step="2"]').hidden,true);assert.equal(ui.opened.length,0);
 await ui.quoteLink.fire('click');assert.equal(ui.elements.get('#service').value,'Regularização rural');
 ui.elements.get('#service').valid=true;await ui.elements.get('#form-next').fire('click');assert.equal(ui.elements.get('[data-form-step="2"]').hidden,false);assert.equal(ui.elements.get('#name').focused,true);
});
test('quote routes to the selected unit, preserves accents and prepares without sending',async()=>{
 for(const [unit,number] of [['maraba','5594981068031'],['novo-repartimento','5594991614641']]){
  const ui=boot();ui.elements.get('#service').value='Regularização rural';ui.elements.get('#service').valid=true;
  ui.elements.get('#city').value='Marabá / PA';ui.elements.get('#unit').value=unit;ui.elements.get('#name').value=' José ';ui.elements.get('#message').value='CAR & pendência\nPrazo informado.';
  await ui.elements.get('#quote-form').fire('submit',submit);assert.equal(ui.opened.length,0);
  await ui.elements.get('#quote-form').fire('submit',submit);assert.equal(ui.opened.length,1);
  const [url,target,features]=ui.opened[0];const parsed=new URL(url);assert.equal(parsed.pathname,'/'+number);assert.equal(target,'_blank');assert.equal(features,'noopener,noreferrer');
  const text=parsed.searchParams.get('text');assert.match(text,/Nome: José/);assert.match(text,/CAR & pendência\nPrazo informado\./);assert.equal(ui.elements.get('#request-preview').value,text);assert.equal(ui.elements.get('#retry-whatsapp').href,url);assert.equal(ui.elements.get('#email-fallback').hidden,false);
 }
});
test('back preserves the project details and permits changing the unit',async()=>{
 const ui=boot();ui.elements.get('#service').valid=true;ui.elements.get('#service').value='Regularização rural';ui.elements.get('#city').value='Novo Repartimento / PA';
 await ui.elements.get('#form-next').fire('click');ui.elements.get('#name').value='Ana';await ui.elements.get('#form-back').fire('click');
 assert.equal(ui.elements.get('[data-form-step="1"]').hidden,false);assert.equal(ui.elements.get('#city').value,'Novo Repartimento / PA');assert.equal(ui.elements.get('#name').value,'Ana');
});
test('menu, client rail, copy fallback and pages without widgets remain functional',async()=>{
 assert.doesNotThrow(()=>boot({empty:true}));const ui=boot({clipboardFails:true});
 await ui.elements.get('.menu-toggle').fire('click');assert.equal(ui.elements.get('#mobile-nav').hidden,false);await ui.document.fire('keydown',{key:'Escape'});assert.equal(ui.elements.get('#mobile-nav').hidden,true);
 await ui.elements.get('[data-clients-next]').fire('click');assert.equal(ui.elements.get('.clients-rail').scrolledBy.left,400);
 ui.elements.get('#request-preview').value='Mensagem pronta';await ui.elements.get('#copy-request').fire('click');assert.equal(ui.elements.get('#request-preview').selected,true);
});
