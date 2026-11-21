// The host selects the phone presentation. A narrow desktop comparison pane
// keeps the usual workspace controls and its own stacked desk.
export const phoneViewport = '(width < 640px), (pointer: coarse) and (orientation: landscape) and (height < 550px) and (width < 960px)';

const paths={
  menu:'M4 7h16M4 12h16M4 17h16',
  search:'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  controls:'M4 7h6m4 0h6M4 17h11m4 0h1 M10 4v6m5 4v6',
  close:'M6 6l12 12M18 6 6 18',chevron:'M6 14l6-6 6 6',
  desktop:'M3 4h18v12H3z M9 21h6m-3-5v5',
  network:'M5 17l7-10 7 10M7 18h10 M7 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M21 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  links:'M10 14l4-4 M8 15l-1 1a3 3 0 0 1-4-4l4-4a3 3 0 0 1 4 0 M16 9l1-1a3 3 0 0 1 4 4l-4 4a3 3 0 0 1-4 0',
  entities:'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 6 0 0 1 16 0v2',
  sources:'M5 3h9l5 5v13H5z M14 3v6h5M8 13h8M8 17h6',
  projects:'M3 7h7l2 2h9v11H3z M3 7V5h7l2 2h7',
  workspace:'M3 4h15v12H3z M7 20h14V8'
};
const icon=name=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+paths[name]+'"/></svg>';
const viewNames={network:'Network',relations:'Links',directory:'Entities',sources:'Sources'};
const noticeKey='cbus-power:desktop-notice-dismissed';
const $=id=>document.getElementById(id);

export function mountPhoneExplorer({navigate,closeTool,returnToList,beforeCompact,layoutChanged}){
  let media=window.matchMedia(phoneViewport);
  try{media=window.parent.matchMedia(phoneViewport);}catch{ /* A cross-origin embed can only measure its own viewport. */ }
  const explorer=$('explorer'),desk=$('desk-body'),surface=$('desk-main');
  for(const slot of explorer.querySelectorAll('[data-phone-icon]'))slot.innerHTML=icon(slot.dataset.phoneIcon);
  const sheet=$('phone-sheet'),handle=$('phone-handle'),mapButton=$('phone-map-button');
  const pages={record:$('phone-record'),projects:$('phone-projects'),search:$('phone-search-page'),menu:$('phone-menu-page'),library:$('phone-library'),tool:$('phone-tool')};
  const moves=[
    [$('network-view'),surface],[$('record-dock'),pages.record],[$('tools-panel'),pages.tool],
    [$('list-search-row'),pages.library],[document.querySelector('.workspace'),pages.library],
    [document.querySelector('.desk-launchers'),$('phone-tool-buttons')],[$('trail-bar'),$('phone-trail')],[$('pins-banner'),$('phone-trail')],[$('scope-bar'),$('phone-trail')],
    [$('starter-projects'),pages.projects],[$('random-start'),pages.projects],[$('search-show-all'),pages.projects],[$('entry-sample'),pages.projects],
    [document.querySelector('.graph-controls'),$('phone-zoom')]
  ].map(([element,parent])=>{
    const marker=document.createComment(element.id||element.className);
    element.before(marker);return {element,parent,marker};
  });
  let enabled=false,page='projects',expanded=false,fraction=.53,transientReturn=null,drag=null,ignoreClick=false;
  let context={view:'network',title:'',selected:false,project:false,tool:''},lastTool='',lastView='',restoringPanel=null;
  let dismissed=false;
  try{dismissed=localStorage.getItem(noticeKey)==='1';}catch{}
  function basePage(){
    if(context.selected||context.project)return 'record';
    return context.view==='network'?'projects':'library';
  }
  function limits(){
    const height=desk.clientHeight||innerHeight;
    const safeBottom=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--phone-safe-bottom'))||0;
    const min=Math.min(height,64+safeBottom);
    return {height,min,max:Math.max(min,height-Math.min(84,height*.21))};
  }
  function closeZoom(){mapButton.setAttribute('aria-expanded','false');$('phone-zoom').hidden=true;}
  function applyHeight({height,min,max}=limits()){
    const size=expanded?Math.max(min,Math.min(max,Math.round(fraction*height))):min;
    document.documentElement.style.setProperty('--phone-sheet-height',size+'px');
    $('phone-map-controls').hidden=(expanded&&['search','menu','tool','library'].includes(page))||height-size<140;
  }
  function paint(){
    if(!enabled)return;
    applyHeight();
    sheet.dataset.page=page;
    const title={menu:'Explore',search:'Search',projects:'Research projects',library:viewNames[context.view],tool:$('tools-title').textContent,record:context.title}[page];
    $('phone-title').textContent=title;
    handle.setAttribute('aria-label',(expanded?'Collapse ':'Expand ')+title);
    handle.setAttribute('aria-expanded',String(expanded));
    handle.title='Drag to resize or tap to '+(expanded?'collapse':'expand');
    $('phone-sheet-body').hidden=!expanded;
    for(const [name,element] of Object.entries(pages))element.hidden=name!==page;
    const close=$('phone-close');
    close.hidden=!transientReturn&&context.view==='network'&&page!=='tool';
    close.setAttribute('aria-label',page==='record'&&context.view!=='network'?'Back to results':'Close '+title);
    $('phone-menu').setAttribute('aria-expanded',String(page==='menu'&&expanded));
    $('phone-search').setAttribute('aria-expanded',String(page==='search'&&expanded));
    for(const button of $('phone-menu-page').querySelectorAll('[data-phone-view]')){
      if(button.dataset.phoneView===context.view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    }
    $('phone-notice').hidden=dismissed||expanded;
  }
  function open(name,large=true){
    closeZoom();page=name;expanded=large;paint();
  }
  function overlay(name){
    if(!transientReturn)transientReturn={page,expanded,fraction,scroll:$('dock-content').scrollTop};
    if(name==='menu')fraction=Math.min(.8,368/limits().height);
    else fraction=name==='search'?.7:.62;
    open(name);
    pages[name].scrollTop=0;
  }
  function restoreBase(){
    const previous=transientReturn;transientReturn=null;
    if(previous){fraction=previous.fraction;open(previous.page,previous.expanded);$('dock-content').scrollTop=previous.scroll;}
    else open(basePage(),!!(context.selected||context.project||context.view!=='network'));
  }
  function dismiss(focus=true){
    const previousPage=page;
    if(context.tool){closeTool(false);if(transientReturn)restoreBase();}
    else if(transientReturn)restoreBase();
    else if(context.view!=='network'){
      if(page==='record'){open('library');returnToList();}
      else navigate('network');
    }else {expanded=false;paint();}
    if(focus&&(previousPage!=='record'||context.view==='network'))$(previousPage==='search'?'phone-search':'phone-menu').focus({preventScroll:true});
  }
  function setExpanded(next){
    if(!enabled)return;
    if(!next&&expanded&&page==='record')beforeCompact();
    if(!next&&page==='search')$('search').blur();
    expanded=next;paint();
  }
  function resizeTo(pixels){
    const bounds=limits(),size=Math.max(bounds.min,Math.min(bounds.max,pixels));
    const next=size>bounds.min+12;
    if(next)fraction=size/bounds.height;
    if(expanded===next)applyHeight(bounds);
    else setExpanded(next);
  }
  handle.addEventListener('pointerdown',event=>{
    if(!enabled||event.button!==0||!event.isPrimary)return;
    ignoreClick=false;drag={id:event.pointerId,y:event.clientY,height:sheet.offsetHeight,expanded,fraction,moved:false};
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove',event=>{
    if(drag?.id!==event.pointerId)return;
    const dy=drag.y-event.clientY;
    if(!drag.moved&&Math.abs(dy)<5)return;
    drag.moved=true;resizeTo(drag.height+dy);
  });
  // A sheet drag must not start a native scroll fling that consumes the next tap.
  handle.addEventListener('touchmove',event=>{if(event.cancelable)event.preventDefault();},{passive:false});
  function endDrag(event,cancelled){
    if(drag?.id!==event.pointerId)return;
    ignoreClick=drag.moved;
    if(cancelled){expanded=drag.expanded;fraction=drag.fraction;}
    else if(drag.moved&&!expanded)fraction=drag.expanded?Math.max(.35,drag.fraction):.53;
    drag=null;paint();
  }
  handle.addEventListener('pointerup',e=>endDrag(e,false));
  for(const type of ['pointercancel','lostpointercapture'])handle.addEventListener(type,e=>endDrag(e,true));
  handle.addEventListener('click',e=>{if(!ignoreClick||e.detail===0)setExpanded(!expanded);ignoreClick=false;});
  handle.addEventListener('keydown',e=>{
    if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
    e.preventDefault();const {min,max}=limits();
    resizeTo(e.key==='Home'?min:e.key==='End'?max:sheet.offsetHeight+(e.key==='ArrowUp'?56:-56));
    if(!expanded)fraction=.53;
  });
  $('phone-menu').addEventListener('click',()=>{
    if(page==='menu'&&expanded){dismiss();return;}
    if(context.tool)closeTool(false);
    overlay('menu');handle.focus({preventScroll:true});
  });
  function search(){
    if(context.tool)closeTool(false);
    if(page!=='search'||!expanded)overlay('search');
    $('search').focus({preventScroll:true});
  }
  $('phone-search').addEventListener('click',()=>{if(page==='search'&&expanded)dismiss();else search();});
  $('phone-close').addEventListener('click',()=>dismiss());
  $('phone-project-button').addEventListener('click',()=>{overlay('projects');handle.focus({preventScroll:true});});
  $('phone-search-projects').addEventListener('click',()=>{overlay('projects');handle.focus({preventScroll:true});});
  $('phone-random').addEventListener('click',()=>$('random-start').click());
  $('phone-tabs').addEventListener('click',()=>window.parent.postMessage({channel:'columbus-explorer',type:'phone-workspace'},location.origin));
  // Return to the map before a trail command captures its new history entry.
  $('phone-trail').addEventListener('click',event=>{
    if(enabled&&transientReturn&&event.target.closest('#show-all-pins,#leave-pins,#return-map,#undo-map'))restoreBase();
  },true);
  $('map-full').addEventListener('click',()=>{if(enabled&&context.tool)closeTool(false);},true);
  $('phone-menu-page').addEventListener('click',e=>{
    const view=e.target.closest('[data-phone-view]')?.dataset.phoneView;
    if(!view)return;
    transientReturn=null;navigate(view);
    open(view==='network'?basePage():'library',view!=='network');
    handle.focus({preventScroll:true});
  });
  mapButton.addEventListener('click',()=>{
    const open=$('phone-zoom').hidden;
    $('phone-zoom').hidden=!open;mapButton.setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('pointerdown',e=>{if(enabled&&!$('phone-zoom').hidden&&!e.target.closest('#phone-map-controls'))closeZoom();});
  document.addEventListener('keydown',e=>{
    if(!enabled||e.key!=='Escape'||e.defaultPrevented||document.querySelector('dialog[open]'))return;
    if(!$('phone-zoom').hidden){closeZoom();mapButton.focus();}
    else if(transientReturn||context.tool||expanded)dismiss();
    else return;
    e.preventDefault();e.stopImmediatePropagation();
  });
  $('phone-notice').querySelector('button').addEventListener('click',()=>{
    dismissed=true;try{localStorage.setItem(noticeKey,'1');}catch{}paint();$('phone-menu').focus({preventScroll:true});
  });
  window.addEventListener('storage',e=>{if(e.key===noticeKey){dismissed=e.newValue==='1';paint();}});
  for(const id of ['random-start','search-show-all','sample-source','sample-target','sample-evidence']){
    $(id).addEventListener('click',()=>{if(enabled){transientReturn=null;open(basePage(),!!(context.selected||context.project));}});
  }
  function mode(){
    enabled=media.matches;
    document.body.toggleAttribute('data-phone-canvas',enabled);
    drag=null;closeZoom();
    lastView='';lastTool='';
    for(const {element,parent,marker} of moves){if(enabled)parent.append(element);else if(marker.nextSibling!==element)marker.after(element);}
    if(enabled){transientReturn=null;open(basePage(),!!(context.selected||context.project||context.view!=='network'));}
    else{$('network-view').hidden=context.view!=='network';document.documentElement.style.removeProperty('--phone-sheet-height');}
  }
  mode();
  media.addEventListener('change',()=>{mode();layoutChanged();});
  new ResizeObserver(paint).observe(desk);
  return {
    get enabled(){return enabled;},get expanded(){return expanded;},get fraction(){return fraction;},
    search,handle,setExpanded,
    sync(next){
      context=next;
      if(enabled){
        if(next.tool&&next.tool!==lastTool){overlay('tool');}
        else if(lastTool&&!next.tool){restoreBase();}
        else if(next.view!==lastView){
          transientReturn=null;
          if(Number.isFinite(restoringPanel?.fraction))fraction=restoringPanel.fraction;
          open(basePage(),restoringPanel?.expanded??(next.view!=='network'||!!(next.selected||next.project)));
        }
        if(!next.tool&&!transientReturn&&page!=='library'&&page!==basePage())open(basePage(),!!(next.selected||next.project));
        $('network-view').hidden=false;paint();
      }
      lastTool=next.tool;lastView=next.view;restoringPanel=null;
    },
    record(){if(enabled){transientReturn=null;open('record');}},
    reset(place){transientReturn=null;lastTool='';lastView='';restoringPanel=place;},
    closeSearch(){if(enabled&&page==='search')dismiss(false);},
    returnFocus(){if(enabled)handle.focus({preventScroll:true});}
  };
}
