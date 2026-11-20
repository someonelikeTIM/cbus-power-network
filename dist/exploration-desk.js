import {evidenceStatuses} from './data.js';
import {entrySampler} from './entry-samples.js';
import {readerField} from './reader-copy.js';

const $=id=>document.getElementById(id);
const toolPages={filters:'filters',path:'path-dialog',research:'research-panel',settings:'dock-settings'};
const titles={record:'Record',filters:'Filters',path:'Find a path',research:'Research path',settings:'Map tools'};
const kinds={entity:'On the map',tag:'Topics',source:'Sources',edge:'Connections',tool:'Tools & settings',suggestion:'Try a shorter search'};
const icons={
  record:'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6',
  filters:'M3 6h9m4 0h5M3 12h3m4 0h11M3 18h11m4 0h3 M12 3v6 M7 9v6 M15 15v6',
  path:'M7 5h8a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7 M7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M21 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  research:'M5 4h14v17l-7-4-7 4z M8 8h8 M8 11h6',
  settings:'M4 4h7v7H4z M14 5h6 M14 9h6 M4 15h6 M4 19h6 M14 14h7v7h-7z',
  jobs:'M3 9h18v12H3z M8 9V5h8v4 M3 13q9 5 18 0 M10 14h4',
  city:'M2 9l10-6 10 6z M4 20h16 M2 22h20 M6 11v7 M10 11v7 M14 11v7 M18 11v7',
  ballot:'M3 14l3-4h2 M16 10h2l3 4v7H3v-7h18 M8 4l7-2 3 8-7 2z M10 6l2 1 2-3',
  undo:'M8 5 3 10l5 5 M4 10h10a6 6 0 0 1 6 6v3',
  random:'M3 6h2c6 0 8 12 14 12h2m-3-3 3 3-3 3 M3 18h2c2.5 0 4.3-2.1 6-5m2-3c1.8-2.6 3.4-4 6-4h2m-3-3 3 3-3 3'
};
function icon(name){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('desk-icon');
  path.setAttribute('d',icons[name]);svg.append(path);return svg;
}
function makeEntry(nodes,edges,sources,openEntity,openConnection){
  $('entry-coverage').textContent=nodes.length+' entities  ·  '+edges.length+' connections  ·  '+sources.length+' sources';
  for(const button of $('start-guide').querySelectorAll('[data-start-entity]')){
    const count=edges.filter(edge=>[edge.source,edge.target].includes(button.dataset.startEntity)).length;
    button.querySelector('small').textContent=count+' documented connections';
    button.querySelector('[data-symbol]').append(icon(button.querySelector('[data-symbol]').dataset.symbol));
  }
  const picker=entrySampler(nodes,edges),card=$('entry-sample'),content=$('sample-content');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),rotation=$('sample-rotation');
  let sample=null,timer=null,intersecting=false,hovering=false,focusInside=false,paused=motion.matches;

  function draw(){
    sample=picker.nextSample();
    if(!sample)return;
    const {edge,source,target}=sample;
    for(const [button,node] of [[$('sample-source'),source],[$('sample-target'),target]]){
      button.querySelector('.sample-name').textContent=node.name;
      button.setAttribute('aria-label','Explore '+node.name);button.title=node.name;
    }
    const label=readerField(edge,'label');
    $('entry-diagram').dataset.directional=String(!!edge.directional);
    $('sample-status').textContent=(edge.historical?'Past record · ':'')+evidenceStatuses[edge.status];
    $('sample-label').textContent=label;
    $('sample-evidence').title=[label,edge.period].filter(Boolean).join(' · ');
    const endpoints=edge.directional?' from '+source.name+' to '+target.name:' between '+source.name+' and '+target.name;
    $('sample-evidence').setAttribute('aria-label','Read evidence for '+label+endpoints);
  }
  function canRotate(){
    return picker.pairCount>1&&intersecting&&!$('entry').hidden&&!document.hidden&&
      !paused&&!hovering&&!focusInside&&!$('search').value.trim();
  }
  function sync(){
    if(!canRotate()){clearTimeout(timer);timer=null;return;}
    if(timer===null)timer=setTimeout(()=>{timer=null;if(canRotate())draw();sync();},12000);
  }
  function updateRotation(){
    rotation.textContent=paused?'Resume':'Pause';
    rotation.setAttribute('aria-label',rotation.textContent+' sample rotation');
    sync();
  }
  draw();card.hidden=!sample;rotation.hidden=picker.pairCount<2;
  $('random-start').prepend(icon('random'));$('random-start').disabled=!sample;
  $('random-start').addEventListener('click',()=>{const id=picker.nextEntity();if(id!==null)openEntity(id);});
  $('sample-source').addEventListener('click',()=>openEntity(sample.source.id));
  $('sample-target').addEventListener('click',()=>openEntity(sample.target.id));
  $('sample-evidence').addEventListener('click',()=>openConnection(sample.edge.id));
  rotation.addEventListener('click',()=>{paused=!paused;updateRotation();});
  motion.addEventListener('change',event=>{paused=event.matches;updateRotation();});
  content.addEventListener('pointerenter',()=>{hovering=true;sync();});
  content.addEventListener('pointerleave',()=>{hovering=false;sync();});
  content.addEventListener('focusin',()=>{focusInside=true;sync();});
  content.addEventListener('focusout',event=>{focusInside=content.contains(event.relatedTarget);sync();});
  new IntersectionObserver(([entry])=>{intersecting=entry.isIntersecting;sync();}).observe(card);
  document.addEventListener('visibilitychange',sync);
  $('search').addEventListener('input',sync);
  updateRotation();
  return sync;
}

export function mountDesk({nodes,edges,sources,search,choose,start,launch,changed}){
  let active='',section='connections',landing=true,selected=null,singleNode=false,view='network';
  let floating=false,side='left',width=360,height=500,left=null,top=14,drag=null;
  const dock=$('record-dock'),body=$('desk-body'),surface=$('desk-main'),input=$('search'),results=$('starting-results');
  const toolScroll=new Map();
  let hits=[],cursor=-1;
  const clamp=(value,min,max)=>Math.max(min,Math.min(value,Math.max(min,max)));
  const syncEntry=makeEntry(nodes,edges,sources,start,id=>choose({kind:'edge',id}));
  $('undo-map').prepend(icon('undo'));
  for(const button of document.querySelectorAll('[data-desk-panel]')){
    button.prepend(icon(button.dataset.deskPanel));
    button.addEventListener('click',()=>{if(button.dataset.deskPanel!=='record'&&active===button.dataset.deskPanel)closeTool();else launch(button.dataset.deskPanel);});
  }
  $('tools-content').append($('filters'),$('path-dialog'),$('research-panel'));
  $('dock-record').append($('entity-popover'),$('inspector'));
  $('settings-display').append($('connection-legend'),$('label-toggle'));
  $('legend-controls').prepend(document.querySelector('.distance-control'));
  $('settings-selection').append($('quick-menu'),$('map-full'),$('reset-layout'));
  $('connection-legend').hidden=false;
  $('dock-header').addEventListener('dblclick',event=>{if(!event.target.closest('button'))setFloating(!floating);});
  $('dock-place').addEventListener('click',()=>setFloating(true));
  for(const edge of ['left','right'])$('dock-'+edge).addEventListener('click',()=>setFloating(false,edge));
  $('tools-close').addEventListener('click',()=>closeTool());
  $('tab-connections').addEventListener('click',()=>showRecord('connections'));
  $('tab-evidence').addEventListener('click',()=>showRecord('evidence'));

  function geometry(){
    if(!surface.clientWidth||!surface.clientHeight)return;
    const inset=8,w=clamp(width,Math.min(260,surface.clientWidth-16),Math.min(680,surface.clientWidth*(floating ? .94 : .55)));
    const h=clamp(height,180,surface.clientHeight-2*inset);
    body.style.setProperty('--dock-width',w+'px');dock.style.setProperty('--float-height',h+'px');
    dock.style.setProperty('--float-left',clamp(left??(side==='left'?inset:surface.clientWidth-w-inset),inset,surface.clientWidth-w-inset)+'px');
    dock.style.setProperty('--float-top',clamp(top,inset,surface.clientHeight-h-inset)+'px');
    $('dock-resize').setAttribute('aria-valuenow',Math.round(w));
    $('dock-resize').setAttribute('aria-valuemax',Math.round(surface.clientWidth));
    $('dock-resize').setAttribute('aria-valuemin',Math.min(260,Math.round(w)));
  }
  function setFloating(next,dockSide=side){
    floating=next;side=dockSide;paint();changed();
    $(floating?'dock-'+side:'dock-place').focus({preventScroll:true});
  }
  function paint(){
    const isEntry=landing&&!active&&view==='network';
    document.body.dataset.landing=String(isEntry);
    $('entry').hidden=!isEntry;$('desk-bar').hidden=isEntry;$('trail-bar').hidden=isEntry;
    $('scope-bar').hidden=isEntry;body.hidden=isEntry;
    syncEntry();
    const slot=$(isEntry?'entry-search-slot':'desk-search-slot');
    if(input.closest('#desk-search').parentElement!==slot)slot.append($('desk-search'));
    const tool=Object.hasOwn(toolPages,active)?active:'';
    body.dataset.tools=tool;body.dataset.dock=floating?'floating':side;
    $('tools-panel').hidden=!tool;
    $('tools-title').textContent=tool?titles[tool]:'Explorer tools';
    $('tools-close').setAttribute('aria-label','Close '+(titles[tool]||'tool'));
    $('dock-title').textContent=selected?.kind==='edge'?'Connection evidence':selected?.kind==='source'?'Source record':'Record';
    $('dock-place').hidden=floating;$('dock-left').hidden=!floating;$('dock-right').hidden=!floating;
    $('dock-header').title=floating?'Drag to move the record panel, or double-click to dock '+side:'Double-click to float the record panel';
    for(const [key,id] of Object.entries(toolPages))$(id).hidden=tool!==key;
    for(const button of document.querySelectorAll('[data-desk-panel]:not(#record-open)'))button.setAttribute('aria-expanded',String(tool===button.dataset.deskPanel));
    $('record-switch').hidden=!singleNode;
    $('record-empty').hidden=!!selected;
    $('entity-popover').hidden=!singleNode||section!=='connections';
    $('inspector').hidden=!selected||(singleNode&&section==='connections');
    $('tab-connections').setAttribute('aria-pressed',String(section==='connections'));
    $('tab-evidence').setAttribute('aria-pressed',String(section==='evidence'));
    $('list-search-row').hidden=view==='network';
    $('trail-empty').hidden=!!$('exploration-trail').childElementCount;
    geometry();
  }
  function setPanel(name,{focus=true}={}){
    if(name==='record'){
      if(!active)active='record';
      paint();
      if(focus)$('dock-title').focus({preventScroll:true});
    }else if(Object.hasOwn(toolPages,name)){
      if(name!==active){
        if(Object.hasOwn(toolPages,active))toolScroll.set(active,$('tools-content').scrollTop);
        active=name;paint();$('tools-content').scrollTop=toolScroll.get(name)||0;
      }else paint();
      if(focus)$('tools-title').focus({preventScroll:true});
    }
    changed();
  }
  function closeTool(focus=true){
    if(!Object.hasOwn(toolPages,active))return;
    const last=active;toolScroll.set(last,$('tools-content').scrollTop);
    active='record';paint();
    if(focus)document.querySelector('[data-desk-panel="'+last+'"]')?.focus({preventScroll:true});
    changed();
  }
  function showRecord(next='connections',focus=false){
    section=next;setPanel('record',{focus});$('dock-content').scrollTop=0;
  }
  const header=$('dock-header'),resize=$('dock-resize');
  function begin(event,mode){
    if(event.button!==0||mode==='move'&&(!floating||event.target.closest('button')))return;
    const rect=dock.getBoundingClientRect(),outer=surface.getBoundingClientRect();
    drag={mode,id:event.pointerId,x:event.clientX,y:event.clientY,w:rect.width,h:rect.height,left:rect.left-outer.left,top:rect.top-outer.top};
    event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault();
  }
  header.addEventListener('pointerdown',event=>begin(event,'move'));
  resize.addEventListener('pointerdown',event=>begin(event,'resize'));
  dock.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(drag.mode==='move'){left=drag.left+dx;top=drag.top+dy;}
    else{width=clamp(drag.w+(floating||side==='left'?dx:-dx),250,680);if(floating){left=drag.left;height=clamp(drag.h+dy,180,surface.clientHeight-16);}}
    geometry();
  });
  for(const eventName of ['pointerup','pointercancel','lostpointercapture'])dock.addEventListener(eventName,event=>{if(drag?.id===event.pointerId){drag=null;changed();}});
  dock.addEventListener('keydown',event=>{
    const onTitle=event.target===$('dock-title'),onResize=event.target===resize;
    if(!(onResize||onTitle&&floating)||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();const dx=event.key==='ArrowLeft'?-16:event.key==='ArrowRight'?16:0,dy=event.key==='ArrowUp'?-16:event.key==='ArrowDown'?16:0;
    if(onTitle){left=dock.offsetLeft+dx;top=dock.offsetTop+dy;}
    else{width=clamp(dock.offsetWidth+(floating||side==='left'?dx:-dx),250,680);if(floating)height=dock.offsetHeight+dy;}
    geometry();changed();
  });
  new ResizeObserver(geometry).observe(surface);

  function dismiss(){input.value='';hits=[];cursor=-1;results.hidden=true;results.replaceChildren();input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');$('search-status').textContent='';syncEntry();}
  function highlight(index){
    cursor=index;
    for(const row of results.querySelectorAll('[role=option]'))row.setAttribute('aria-selected',String(Number(row.dataset.index)===index));
    const row=$('desk-result-'+index);
    if(row){input.setAttribute('aria-activedescendant',row.id);row.scrollIntoView({block:'nearest'});}
  }
  function chooseIndex(index){
    const hit=hits[index];if(!hit)return;
    if(hit.kind==='suggestion'){input.value=hit.label;suggest();input.focus({preventScroll:true});return;}
    dismiss();choose(hit);
  }
  function suggest(){
    const query=input.value.trim();if(!query){dismiss();return;}
    results.style.setProperty('--results-room',Math.max(130,innerHeight-input.getBoundingClientRect().bottom-12)+'px');
    hits=search(query);cursor=-1;input.removeAttribute('aria-activedescendant');
    if(!hits.length){
      const words=query.split(/\s+/);
      if(words.length>1){
        const shorter=new Set([words.slice(0,-1).join(' '),words.slice(1).join(' ')]);
        hits=[...shorter].filter(phrase=>phrase.length>2&&search(phrase).some(hit=>hit.kind!=='tool'))
          .map(label=>({kind:'suggestion',label,description:'Search matching records'}));
      }
    }
    results.replaceChildren();results.hidden=false;input.setAttribute('aria-expanded','true');
    let group='',container=null;
    hits.forEach((hit,index)=>{
      if(group!==hit.kind){
        group=hit.kind;container=document.createElement('div');container.setAttribute('role','group');container.setAttribute('aria-label',kinds[group]);
        const label=document.createElement('div');label.className='result-group';label.setAttribute('aria-hidden','true');label.textContent=kinds[group];container.append(label);results.append(container);
      }
      const button=document.createElement('button');button.type='button';button.tabIndex=-1;button.id='desk-result-'+index;button.dataset.index=index;
      button.setAttribute('role','option');button.setAttribute('aria-selected','false');
      const name=document.createElement('strong'),description=document.createElement('small');name.textContent=hit.label;description.textContent=hit.description;
      button.append(name,description);container.append(button);
    });
    if(!hits.length){const p=document.createElement('p');p.textContent='No matches in this view. Try fewer words or check your filters.';results.append(p);}
    $('search-status').textContent=hits.length?hits.length+(hits.length===1?' suggestion.':' suggestions.')+' Use the arrow keys to choose.':'No matches.';
  }
  input.addEventListener('input',suggest);
  input.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&(!results.hidden||input.value)){event.preventDefault();event.stopPropagation();dismiss();return;}
    if(event.isComposing||!hits.length)return;
    if(event.key==='Enter'){event.preventDefault();chooseIndex(Math.max(0,cursor));}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();highlight(cursor<0?(event.key==='ArrowDown'?0:hits.length-1):(cursor+(event.key==='ArrowDown'?1:-1)+hits.length)%hits.length);}
  });
  results.addEventListener('pointerdown',event=>event.preventDefault());
  results.addEventListener('click',event=>{const button=event.target.closest('[data-index]');if(button)chooseIndex(Number(button.dataset.index));});
  document.addEventListener('pointerdown',event=>{if(!results.hidden&&!event.target.closest('#desk-search'))dismiss();});
  input.addEventListener('blur',()=>{if(!results.hidden)dismiss();});
  function sync({empty,selection,isSingleNode,currentView}){
    landing=empty;selected=selection;singleNode=isSingleNode;view=currentView;paint();
  }
  function restore(saved,selection){
    active=saved?saved.active:(selection?'record':'');section=saved?.section||(selection?.kind==='node'?'connections':'evidence');
    side=saved?.side==='right'?'right':'left';floating=saved?.floating||false;width=saved?.width||360;height=saved?.height||500;left=saved?.left??null;top=saved?.top??14;paint();
  }
  return {sync,setPanel,closeTool,showRecord,dismiss,restore,focusSearch:()=>{input.focus({preventScroll:true});input.select();},
    get tool(){return Object.hasOwn(toolPages,active)?active:'';},get section(){return section;},
    snapshot:()=>({active,section,floating,side,width,height,left,top})};
}
