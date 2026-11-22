import {evidenceStatuses} from './data.js';
import {entrySampler} from './entry-samples.js';
import {mountPhoneExplorer} from './phone-explorer.js';

const $=id=>document.getElementById(id);
const toolPages={filters:'filters',path:'path-dialog',research:'research-panel',settings:'dock-settings'};
const titles={record:'Record',filters:'Filters',path:'Find a path',research:'Research path',settings:'Map tools'};
const kinds={entity:'On the map',tag:'Topics',source:'Sources',edge:'Connections',investigation:'Investigations',project:'Project findings',tool:'Tools & settings',suggestion:'Try a shorter search'};
const icons={
  record:'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6',
  filters:'M3 6h9m4 0h5M3 12h3m4 0h11M3 18h11m4 0h3 M12 3v6 M7 9v6 M15 15v6',
  path:'M7 5h8a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7 M7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M21 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  research:'M5 4h14v17l-7-4-7 4z M8 8h8 M8 11h6',
  settings:'M4 4h7v7H4z M14 5h6 M14 9h6 M4 15h6 M4 19h6 M14 14h7v7h-7z',
  projectFunds:'M4 4h15v17l-3-2-3 2-3-2-3 2-3-2z M8 8h7 M8 12h7 M8 16h4',
  projectCamera:'M3 7h4l2-3h6l2 3h4v13H3z M16 13a4 4 0 1 1-8 0 4 4 0 1 1 8 0',
  projectServers:'M3 4h18v7H3z M3 14h18v7H3z M6 7.5h1 M10 7.5h7 M6 17.5h1 M10 17.5h7',
  projectChip:'M6 6h12v12H6z M9 9h6v6H9z M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4',
  undo:'M8 5 3 10l5 5 M4 10h10a6 6 0 0 1 6 6v3',
  random:'M3 6h2c6 0 8 12 14 12h2m-3-3 3 3-3 3 M3 18h2c2.5 0 4.3-2.1 6-5m2-3c1.8-2.6 3.4-4 6-4h2m-3-3 3 3-3 3'
};
function icon(name){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('desk-icon');
  path.setAttribute('d',icons[name]);svg.append(path);return svg;
}
function makeEntry(nodes,edges,sources,openEntity,openConnection,projects,openProject){
  $('entry-coverage').textContent=nodes.length+' entities  ·  '+edges.length+' connections  ·  '+sources.length+' sources';
  for(const project of projects.values()){
    const card=document.createElement('a'),symbol=document.createElement('span'),title=document.createElement('strong');
    const teaser=document.createElement('span'),count=document.createElement('small');
    card.href='?project='+project.id;card.target='_top';card.className='project-card';
    symbol.className='start-symbol';symbol.append(icon(project.icon));title.textContent=project.title;
    teaser.className='project-teaser';teaser.textContent=project.teaser;count.textContent=project.route.edges.length+' mapped connections';
    card.append(symbol,title,teaser,count);
    card.addEventListener('click',event=>{
      if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();openProject(project.id);
    });
    $('starter-projects').append(card);
  }
  const picker=entrySampler(nodes,edges),card=$('entry-sample'),content=$('sample-content');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),rotation=$('sample-rotation');
  const sourcesById=new Map(sources.map(source=>[source.id,source]));
  let timer=null,intersecting=false,hovering=false,focusInside=false,paused=motion.matches;

  function draw(feature,announce=false){
    if(!feature)return;
    const {edge,source,target,headline}=feature;
    for(const [button,node] of [[$('sample-source'),source],[$('sample-target'),target]]){
      button.querySelector('.sample-name').textContent=node.name;
      button.setAttribute('aria-label','Explore '+node.name);button.title=node.name;
    }
    $('entry-diagram').dataset.directional=String(!!edge.directional);
    const documentSource=sourcesById.get(edge.sourceIds[0]);
    const status=evidenceStatuses[edge.status];
    const sourceYear=documentSource?.date?.match(/^\d{4}/)?.[0];
    $('sample-status').textContent=sourceYear?status+' · '+sourceYear+' source':status;
    $('sample-status').title=edge.period||'';
    $('sample-label').textContent=headline;
    $('sample-evidence').setAttribute('aria-label','Read evidence for '+source.name+' and '+target.name);
    const link=$('feature-document');
    link.hidden=!documentSource?.url;
    if(!link.hidden){
      link.href=documentSource.url;
      $('feature-publisher').textContent=documentSource.publisher;
      link.setAttribute('aria-label','Open original source from '+documentSource.publisher+' (opens in a new tab)');
      link.title=documentSource.title;
    }
    if(announce)$('feature-announcement').textContent=headline+' '+status+'.';
  }
  function canRotate(){
    return picker.featuredCount>1&&intersecting&&!$('entry').hidden&&!document.hidden&&
      !paused&&!hovering&&!focusInside&&!$('search').value.trim();
  }
  function sync(){
    if(!canRotate()){clearTimeout(timer);timer=null;return;}
    if(timer===null)timer=setTimeout(()=>{timer=null;if(canRotate())draw(picker.move(1));sync();},12000);
  }
  function updateRotation(){
    rotation.textContent=paused?'Resume':'Pause';
    rotation.setAttribute('aria-label',rotation.textContent+' featured connections');
    sync();
  }
  function browse(direction){
    paused=true;
    updateRotation();
    draw(picker.move(direction),true);
  }
  draw(picker.current());
  card.hidden=!picker.featuredCount;
  $('feature-controls').hidden=picker.featuredCount<2;
  $('random-start').prepend(icon('random'));$('random-start').disabled=!picker.entityCount;
  $('random-start').addEventListener('click',()=>{const id=picker.nextEntity();if(id!==null)openEntity(id);});
  $('sample-source').addEventListener('click',()=>openEntity(picker.current().source.id));
  $('sample-target').addEventListener('click',()=>openEntity(picker.current().target.id));
  $('sample-evidence').addEventListener('click',()=>openConnection(picker.current().edge.id));
  $('feature-previous').addEventListener('click',()=>browse(-1));
  $('feature-next').addEventListener('click',()=>browse(1));
  card.addEventListener('keydown',event=>{
    if(picker.featuredCount<2||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
    event.preventDefault();event.stopPropagation();browse(event.key==='ArrowLeft'?-1:1);
  });
  // Treat each sideways trackpad gesture as one turn. Vertical scrolling stays native.
  let lastWheel=-Infinity,travel=0,turned=false;
  card.addEventListener('wheel',event=>{
    const horizontal=event.deltaX||(event.shiftKey?event.deltaY:0);
    if(picker.featuredCount<2||event.ctrlKey||!horizontal||(!event.shiftKey&&Math.abs(horizontal)<=Math.abs(event.deltaY)))return;
    event.preventDefault();
    if(event.timeStamp-lastWheel>220){travel=0;turned=false;}
    lastWheel=event.timeStamp;
    travel+=horizontal*(event.deltaMode===1?16:event.deltaMode===2?card.clientWidth:1);
    if(!turned&&Math.abs(travel)>=32){turned=true;browse(Math.sign(travel));}
  },{passive:false});
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

export function mountDesk({nodes,edges,sources,search,choose,start,launch,changed,projects,openProject,returnToList,beforeCompact,navigate,presentationChanged}){
  let active='',section='connections',landing=true,selected=null,singleNode=false,view='network';
  let projectOverview=false,recordTitle='Record',preview='',reading=false,readingScroll=0;
  let toolOpener=null,beforeTool='',visibleBottom=innerHeight;
  const smallPane=matchMedia('(width < 640px)');
  let floating=false,side='left',width=360,height=500,left=null,top=14,drag=null;
  const dock=$('record-dock'),body=$('desk-body'),surface=$('desk-main'),input=$('search'),results=$('starting-results');
  const toolScroll=new Map();
  let hits=[],cursor=-1;
  const clamp=(value,min,max)=>Math.max(min,Math.min(value,Math.max(min,max)));
  const syncEntry=makeEntry(nodes,edges,sources,start,id=>choose({kind:'edge',id}),projects,openProject);
  $('undo-map').prepend(icon('undo'));
  for(const button of document.querySelectorAll('[data-desk-panel]')){
    button.prepend(icon(button.dataset.deskPanel));
    button.addEventListener('click',()=>{if(button.dataset.deskPanel!=='record'&&active===button.dataset.deskPanel)closeTool();else launch(button.dataset.deskPanel);});
  }
  $('tools-content').append($('filters'),$('path-dialog'),$('research-panel'));
  $('dock-record').append($('entity-popover'),$('inspector'),$('record-options'));
  $('settings-display').append($('connection-legend'),$('label-toggle'));
  $('legend-controls').prepend(document.querySelector('.distance-control'));
  $('settings-selection').append($('quick-menu'),$('map-full'),$('reset-layout'));
  $('connection-legend').hidden=false;
  const phone=mountPhoneExplorer({navigate,closeTool,returnToList,
    beforeCompact:()=>{beforeCompact();readingScroll=$('dock-content').scrollTop;},
    layoutChanged:()=>{paint();presentationChanged();}
  });
  $('dock-header').addEventListener('dblclick',event=>{if(!smallPane.matches&&!event.target.closest('button'))setFloating(!floating);});
  $('record-toggle').addEventListener('click',()=>{
    focusWidth(!reading);
    if(!reading&&view!=='network')returnToList();
  });
  $('dock-place').addEventListener('click',()=>setFloating(true));
  for(const edge of ['left','right'])$('dock-'+edge).addEventListener('click',()=>setFloating(false,edge));
  $('tools-close').addEventListener('click',()=>closeTool());
  $('tab-connections').addEventListener('click',()=>showRecord('connections'));
  $('tab-evidence').addEventListener('click',()=>showRecord('evidence'));

  function widthLimits(){
    const min=Math.min(260,Math.max(1,surface.clientWidth-16));
    return {min,max:Math.max(min,Math.min(680,surface.clientWidth*(floating ? .94 : .55),floating?Infinity:surface.clientWidth-320))};
  }
  function focusWidth(expand){
    if(phone.enabled){phone.setExpanded(expand);return;}
    if(smallPane.matches){
      if(reading!==expand){
        if(reading){beforeCompact();readingScroll=$('dock-content').scrollTop;}
        reading=expand;geometry();
        if(reading)$('dock-content').scrollTop=readingScroll;
      }
      return;
    }
    if(!surface.clientWidth||body.hidden)return;
    const limits=widthLimits(),next=expand?limits.max:limits.min;
    if(Math.abs(width-next)<.5)return;
    width=next;geometry();changed();
  }
  function geometry(){
    const stacked=smallPane.matches||phone.enabled,tool=Object.hasOwn(toolPages,active);
    const toolWidth=clamp(body.clientWidth*.23,260,350);
    const overlay=stacked||body.clientWidth-toolWidth-(floating?0:clamp(width,260,680))<320;
    body.dataset.dock=phone.enabled?'phone':stacked?'stacked':floating?'floating':side;
    body.dataset.overlay=String(overlay);
    body.dataset.reading=String(reading);
    surface.inert=tool&&overlay&&!phone.enabled;
    $('dock-title').textContent=stacked?recordTitle:projectOverview?'Research project':selected?.kind==='edge'?'Connection evidence':selected?.kind==='source'?'Source record':'Record';
    const toggle=$('record-toggle');
    toggle.hidden=!stacked;
    toggle.textContent=reading?(view==='network'?'Show more map':'Back to results'):'Expand record';
    toggle.setAttribute('aria-expanded',String(reading));
    $('record-preview').hidden=!stacked||reading||!preview;
    $('record-preview').textContent=preview;
    $('tool-context').hidden=!tool||!overlay;
    $('tool-context').textContent=recordTitle;
    if(!surface.clientWidth||!surface.clientHeight)return;
    if(stacked)return;
    const limits=widthLimits(),inset=8,w=clamp(width,limits.min,limits.max);
    const h=clamp(height,180,surface.clientHeight-2*inset);
    body.style.setProperty('--dock-width',w+'px');dock.style.setProperty('--float-height',h+'px');
    dock.style.setProperty('--float-left',clamp(left??(side==='left'?inset:surface.clientWidth-w-inset),inset,surface.clientWidth-w-inset)+'px');
    dock.style.setProperty('--float-top',clamp(top,inset,surface.clientHeight-h-inset)+'px');
    $('dock-resize').setAttribute('aria-valuenow',Math.round(w));
    $('dock-resize').setAttribute('aria-valuemax',Math.round(limits.max));
    $('dock-resize').setAttribute('aria-valuemin',Math.round(limits.min));
  }
  function setFloating(next,dockSide=side){
    floating=next;side=dockSide;paint();changed();
    $(floating?'dock-'+side:'dock-place').focus({preventScroll:true});
  }
  function paint(){
    const isEntry=!phone.enabled&&landing&&!active&&view==='network';
    document.body.dataset.landing=String(isEntry);
    $('entry').hidden=!isEntry;$('desk-bar').hidden=isEntry;$('trail-bar').hidden=isEntry;
    $('scope-bar').hidden=isEntry;body.hidden=isEntry;
    syncEntry();
    const slot=$(phone.enabled?'phone-search-slot':isEntry?'entry-search-slot':'desk-search-slot');
    if(input.closest('#desk-search').parentElement!==slot)slot.append($('desk-search'));
    const tool=Object.hasOwn(toolPages,active)?active:'';
    body.dataset.tools=tool;
    $('tools-panel').hidden=!tool;
    $('tools-title').textContent=tool?titles[tool]:'Explorer tools';
    $('tools-close').setAttribute('aria-label','Close '+(titles[tool]||'tool'));
    $('dock-place').hidden=floating;$('dock-left').hidden=!floating;$('dock-right').hidden=!floating;
    $('dock-header').title=floating?'Drag to move the record panel, or double-click to dock '+side:'Double-click to float the record panel';
    for(const [key,id] of Object.entries(toolPages))$(id).hidden=tool!==key;
    for(const button of document.querySelectorAll('[data-desk-panel]:not(#record-open)'))button.setAttribute('aria-expanded',String(tool===button.dataset.deskPanel));
    $('record-switch').hidden=!singleNode;
    $('record-empty').hidden=!!selected||projectOverview;
    $('project-report').hidden=!projectOverview;
    $('entity-popover').hidden=!singleNode||section!=='connections';
    $('inspector').hidden=!selected||(singleNode&&section==='connections');
    $('tab-connections').setAttribute('aria-pressed',String(section==='connections'));
    $('tab-evidence').setAttribute('aria-pressed',String(section==='evidence'));
    $('list-search-row').hidden=view==='network';
    $('trail-empty').hidden=!!$('exploration-trail').childElementCount;
    phone.sync({view,tool,title:recordTitle,selected:!!selected,project:projectOverview});
    geometry();
  }
  function setPanel(name,{focus=true}={}){
    if(name==='record'){
      if(!active||focus)active='record';
      if(focus&&smallPane.matches)focusWidth(true);
      paint();
      if(focus){if(phone.enabled){phone.record();phone.returnFocus();}else $('dock-title').focus({preventScroll:true});}
    }else if(Object.hasOwn(toolPages,name)){
      if(name!==active){
        if(!Object.hasOwn(toolPages,active))beforeTool=active;
        const opener=document.activeElement;
        toolOpener=opener?.matches('[data-desk-panel],#search')?opener:document.querySelector('[data-desk-panel="'+name+'"]');
        if(Object.hasOwn(toolPages,active))toolScroll.set(active,$('tools-content').scrollTop);
        active=name;paint();$('tools-content').scrollTop=toolScroll.get(name)||0;
      }else paint();
      if(focus)(phone.enabled?phone.handle:$('tools-title')).focus({preventScroll:true});
    }
    changed();
  }
  function closeTool(focus=true){
    if(!Object.hasOwn(toolPages,active))return;
    const last=active;toolScroll.set(last,$('tools-content').scrollTop);
    active=beforeTool||(!landing?'record':'');paint();
    if(focus)(phone.enabled?$('phone-menu'):toolOpener?.getClientRects().length?toolOpener:document.querySelector('[data-desk-panel="'+last+'"]'))?.focus({preventScroll:true});
    changed();
  }
  function showRecord(next='connections',focus=false){
    if(Object.hasOwn(toolPages,active)&&body.dataset.overlay==='true')closeTool(false);
    reading=true;readingScroll=0;section=next;setPanel('record',{focus});$('dock-content').scrollTop=0;
    phone.record();
  }
  const header=$('dock-header'),resize=$('dock-resize');
  // Resize after the actual click. Moving the panel at pointerdown would move a
  // link or a button out from under the pointer before the browser activates it.
  let movedHeader=false;
  dock.addEventListener('pointerdown',()=>{movedHeader=false;},true);
  dock.addEventListener('click',event=>{
    if(event.target.closest('a')&&(event.ctrlKey||event.metaKey||event.altKey||event.shiftKey))return;
    if(!movedHeader&&!event.target.closest('#dock-resize,#record-toggle'))focusWidth(true);
  });
  function begin(event,mode){
    if(phone.enabled||smallPane.matches||event.button!==0||mode==='move'&&(!floating||event.target.closest('button')))return;
    const rect=dock.getBoundingClientRect(),outer=surface.getBoundingClientRect();
    drag={mode,id:event.pointerId,x:event.clientX,y:event.clientY,w:rect.width,h:rect.height,left:rect.left-outer.left,top:rect.top-outer.top};
    event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault();
  }
  header.addEventListener('pointerdown',event=>begin(event,'move'));
  resize.addEventListener('pointerdown',event=>begin(event,'resize'));
  dock.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(drag.mode==='move'){if(Math.hypot(dx,dy)>4)movedHeader=true;left=drag.left+dx;top=drag.top+dy;}
    else{const limits=widthLimits();width=clamp(drag.w+(floating||side==='left'?dx:-dx),limits.min,limits.max);if(floating){left=drag.left;height=clamp(drag.h+dy,180,surface.clientHeight-16);}}
    geometry();
  });
  for(const eventName of ['pointerup','pointercancel','lostpointercapture'])dock.addEventListener(eventName,event=>{if(drag?.id===event.pointerId){drag=null;changed();}});
  dock.addEventListener('keydown',event=>{
    const onTitle=event.target===$('dock-title'),onResize=event.target===resize;
    if(!(onResize||onTitle&&floating)||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();const dx=event.key==='ArrowLeft'?-16:event.key==='ArrowRight'?16:0,dy=event.key==='ArrowUp'?-16:event.key==='ArrowDown'?16:0;
    if(onTitle){left=dock.offsetLeft+dx;top=dock.offsetTop+dy;}
    else{const limits=widthLimits();width=clamp(dock.offsetWidth+(floating||side==='left'?dx:-dx),limits.min,limits.max);if(floating)height=dock.offsetHeight+dy;}
    geometry();changed();
  });
  new ResizeObserver(geometry).observe(surface);
  smallPane.addEventListener('change',geometry);

  function dismiss(){input.value='';hits=[];cursor=-1;results.hidden=true;$('dismiss-search').hidden=true;results.replaceChildren();input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');$('search-status').textContent='';syncEntry();}
  function sizeResults(){
    if(phone.enabled)return;
    const top=results.getBoundingClientRect().top;
    results.style.setProperty('--results-room',Math.max(44,visibleBottom-top-4)+'px');
    const first=results.querySelector('[role=option],p');
    const bottom=first?first.getBoundingClientRect().bottom+8:top;
    if(smallPane.matches&&document.activeElement===input&&bottom>visibleBottom+1){
      window.parent.postMessage({channel:'columbus-explorer',type:'reveal-search',bottom},location.origin);
    }
  }
  $('dismiss-search').addEventListener('pointerdown',event=>event.preventDefault());
  $('dismiss-search').addEventListener('click',()=>{dismiss();input.focus({preventScroll:true});});
  function highlight(index){
    cursor=index;
    for(const row of results.querySelectorAll('[role=option]'))row.setAttribute('aria-selected',String(Number(row.dataset.index)===index));
    const row=$('desk-result-'+index);
    if(row){input.setAttribute('aria-activedescendant',row.id);row.scrollIntoView({block:'nearest'});}
  }
  function chooseIndex(index){
    const hit=hits[index];if(!hit)return;
    if(hit.kind==='suggestion'){input.value=hit.label;suggest();input.focus({preventScroll:true});return;}
    dismiss();if(smallPane.matches||phone.enabled)input.blur();phone.closeSearch();choose(hit);
    if(hit.kind==='tool'&&Object.hasOwn(toolPages,active))toolOpener=input;
  }
  function suggest(){
    const query=input.value.trim();if(!query){dismiss();return;}
    hits=search(query);cursor=-1;input.removeAttribute('aria-activedescendant');
    if(!hits.length){
      const words=query.split(/\s+/);
      if(words.length>1){
        const shorter=new Set([words.slice(0,-1).join(' '),words.slice(1).join(' ')]);
        hits=[...shorter].filter(phrase=>phrase.length>2&&search(phrase).some(hit=>hit.kind!=='tool'))
          .map(label=>({kind:'suggestion',label,description:'Search matching records'}));
      }
    }
    results.replaceChildren();results.hidden=false;$('dismiss-search').hidden=false;input.setAttribute('aria-expanded','true');
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
    sizeResults();
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
  input.closest('#desk-search').addEventListener('focusout',event=>{if(!results.hidden&&!event.currentTarget.contains(event.relatedTarget))dismiss();});
  function sync({empty,selection,isSingleNode,currentView,showProject=false,title,summary}){
    landing=empty;selected=selection;singleNode=isSingleNode;view=currentView;projectOverview=showProject;
    recordTitle=title;preview=summary;paint();
  }
  function restore(saved,selection,place){
    phone.reset(place);
    active=saved?saved.active:(selection?'record':'');section=saved?.section||(selection?.kind==='node'?'connections':'evidence');
    reading=place?.expanded??(!!selection||new URLSearchParams(location.search).has('project'));readingScroll=place?.scroll??0;
    side=saved?.side==='right'?'right':'left';floating=saved?.floating||false;width=saved?.width||360;height=saved?.height||500;left=saved?.left??null;top=saved?.top??14;paint();
  }
  return {sync,setPanel,closeTool,showRecord,dismiss,restore,focusWidth,focusSearch:()=>{if(phone.enabled)phone.search();input.focus({preventScroll:true});input.select();},
    setVisibleBottom(value){visibleBottom=value;if(!results.hidden)sizeResults();},get stacked(){return smallPane.matches||phone.enabled;},get phone(){return phone.enabled;},
    get readingPlace(){const expanded=phone.enabled?phone.expanded:reading;return {expanded,scroll:expanded?$('dock-content').scrollTop:readingScroll,...(phone.enabled?{fraction:phone.fraction}:{})};},
    get tool(){return Object.hasOwn(toolPages,active)?active:'';},get section(){return section;},
    snapshot:()=>({active,section,floating,side,width,height,left,top})};
}
