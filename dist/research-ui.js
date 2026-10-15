import {researchConnections,researchFile,researchSnapshot} from './research-paths.js';
import {validateView} from './saved-views.js';

export function mountResearchUI({state,nodes,edges,relationships,release,snapshot,records,remember,changed,openPanel,focusNode,focusEdge,showPath,openView,download,importPath,notify}){
  const $=id=>document.getElementById(id),nodeById=new Map(nodes.map(n=>[n.id,n])),edgeById=new Map(edges.map(e=>[e.id,e]));
  const nodeIds=new Set(nodeById.keys()),edgeIds=new Set(edgeById.keys()),storageKey='columbus-network:research-paths-v1';
  const fullGraph={nodes,edges};let guideLimit=8;
  const text=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el;};
  function edit(steps,refit=true){remember();state.research={...state.research,id:state.research.id||crypto.randomUUID(),createdAt:state.research.createdAt||new Date().toISOString(),steps};changed(refit);}
  function toggle(kind,id){
    if(!(kind==='entity'?nodeById:edgeById).has(id))return;
    const exists=state.research.steps.some(step=>step.kind===kind&&step.id===id);
    edit(exists?state.research.steps.filter(step=>step.kind!==kind||step.id!==id):[...state.research.steps,{kind,id,note:''}]);
    notify(exists?'Removed from research path':'Pinned to research path');
  }
  function render(){
    const research=state.research,route=researchConnections(research.steps,fullGraph);
    $('research-count').textContent=research.steps.length||'';$('research-open').classList.toggle('has-research',!!research.steps.length);
    if(document.activeElement!==$('research-name'))$('research-name').value=research.title;
    const list=$('research-steps');list.replaceChildren();
    if(!research.steps.length)list.append(text('p','Pin an entity or a connection to begin. Choose Explore connections to find the next step.'));
    research.steps.forEach((step,index)=>{
      const row=document.createElement('li'),heading=document.createElement('button');heading.className='research-step-title';
      const edge=edgeById.get(step.id),label=step.kind==='entity'?nodeById.get(step.id).name:nodeById.get(edge.source).name+' → '+nodeById.get(edge.target).name;
      heading.textContent=label;heading.addEventListener('click',()=>step.kind==='entity'?focusNode(step.id):focusEdge(step.id));row.append(heading);
      row.append(text('small',step.kind==='connection'?relationships[edge.type].label+' · '+edge.label:'Pinned entity'));
      const controls=document.createElement('div');controls.className='research-step-controls';
      for(const [label,delta]of [['Move earlier',-1],['Move later',1]]){const button=text('button',delta<0?'↑':'↓');button.setAttribute('aria-label',label+' '+labelFor(step));button.disabled=index+delta<0||index+delta>=research.steps.length;button.addEventListener('click',()=>{const steps=[...research.steps];[steps[index],steps[index+delta]]=[steps[index+delta],steps[index]];edit(steps);});controls.append(button);}
      const remove=text('button','Unpin');remove.setAttribute('aria-label','Unpin research step '+labelFor(step));remove.addEventListener('click',()=>toggle(step.kind,step.id));controls.append(remove);row.append(controls);
      const notes=document.createElement('details');notes.append(text('summary',step.note?'Research note':'Add a note'));const input=document.createElement('textarea');input.value=step.note;input.maxLength=1000;input.setAttribute('aria-label','Note for '+labelFor(step));let editingNote=false;input.addEventListener('input',()=>{if(!editingNote){remember();editingNote=true;}state.research={...state.research,steps:state.research.steps.map((item,i)=>i===index?{...item,note:input.value}:item)};changed(false);});input.addEventListener('blur',()=>{editingNote=false;});notes.append(input);row.append(notes);list.append(row);
    });
    const gaps=route.segments.filter(segment=>!segment.route).length;
    $('research-route-summary').textContent=research.steps.length?route.edgeIds.size+' recorded connection'+(route.edgeIds.size===1?'':'s')+' in the research path'+(gaps?' · '+gaps+' gap'+(gaps===1?'':'s')+' without a recorded route.':'.'):'';
    for(const id of ['research-save','research-export','research-show'])$(id).disabled=!research.steps.length;
    renderGuide();
  }
  function labelFor(step){const edge=edgeById.get(step.id);return step.kind==='entity'?nodeById.get(step.id).name:nodeById.get(edge.source).name+' to '+nodeById.get(edge.target).name;}
  function renderGuide(){
    const id=state.selected?.kind==='node'?state.selected.id:state.focusEntity;
    const node=nodeById.get(id),query=$('guided-search').value.trim().toLowerCase(),graph=records('graph');
    $('guided-context').textContent=node?'Continue from '+node.name+'. Pin the records that belong in your research path.':'Choose an entity to explore its connections.';
    const links=graph.edges.filter(edge=>edge.source===id||edge.target===id).sort((a,b)=>a.type.localeCompare(b.type)||a.id.localeCompare(b.id)).filter(edge=>[nodeById.get(edge.source).name,nodeById.get(edge.target).name,relationships[edge.type].label,edge.label].join(' ').toLowerCase().includes(query));
    const list=$('guided-results');list.replaceChildren();
    links.slice(0,guideLimit).forEach(edge=>{
      const other=nodeById.get(edge.source===id?edge.target:edge.source),row=document.createElement('article');
      const next=text('button',other.name+' →');next.className='guide-next';next.addEventListener('click',()=>{guideLimit=8;$('guided-search').value='';focusNode(other.id);});
      const evidence=text('button',relationships[edge.type].label+' · '+edge.label);evidence.className='guide-evidence';evidence.addEventListener('click',()=>focusEdge(edge.id));
      const pin=text('button',state.research.steps.some(step=>step.kind==='connection'&&step.id===edge.id)?'Unpin connection':'Pin connection');pin.className='guide-pin';pin.addEventListener('click',()=>toggle('connection',edge.id));
      row.append(next,evidence,pin);list.append(row);
    });
    if(!links.length)list.append(text('p',node?'No connections match these filters.':'Search for a name or select an entity on the map.'));
    if(links.length>guideLimit){const more=text('button','Show '+Math.min(8,links.length-guideLimit)+' more connections ('+(links.length-guideLimit)+' remaining)');more.className='guide-more';more.addEventListener('click',()=>{guideLimit+=8;renderGuide();});list.append(more);}
  }
  function artifact(){if(!state.research.id)state.research={...state.research,id:crypto.randomUUID(),createdAt:state.research.createdAt||new Date().toISOString()};return researchFile(state.research,snapshot(),release,records('research'),fullGraph);}
  function library(){try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(saved)?saved.filter(file=>{try{parse(file);return true;}catch{return false;}}):[];}catch{return [];}}
  function parse(file){
    return researchSnapshot(file,{nodeIds,edgeIds,validateSnapshot:validateView});
  }
  function renderLibrary(){
    const list=$('research-saved');list.replaceChildren();const saved=library();
    if(!saved.length)list.append(text('p','No saved research paths in this browser.'));
    saved.forEach(file=>{const button=text('button','Open '+file.research.title);button.addEventListener('click',()=>openView(parse(file),file.research.title));list.append(button);});
  }
  $('research-open').addEventListener('click',()=>{render();renderLibrary();openPanel('research-panel');});
  $('guided-open').addEventListener('click',()=>{guideLimit=8;renderGuide();openPanel('guided-panel');});
  $('guided-search').addEventListener('input',()=>{guideLimit=8;renderGuide();});
  let editingName=false;
  $('research-name').addEventListener('input',()=>{if(!editingName){remember();editingName=true;}state.research={...state.research,title:$('research-name').value.trim().slice(0,100)||'Untitled research path'};changed(false);});
  $('research-name').addEventListener('blur',()=>{editingName=false;});
  $('research-show').addEventListener('click',()=>{const route=researchConnections(state.research.steps,fullGraph);showPath({nodes:[...route.nodeIds],edges:[...route.edgeIds]});});
  $('research-save').addEventListener('click',()=>{try{const file=artifact(),saved=library().filter(item=>item.id!==file.id);saved.push(file);localStorage.setItem(storageKey,JSON.stringify(saved));$('research-status').textContent='“'+file.title+'” saved in this browser.';renderLibrary();}catch{$('research-status').textContent='Browser storage is unavailable. Export the path to keep a copy.';}});
  $('research-export').addEventListener('click',()=>{const file=artifact(),name=(file.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'research-path')+'.json';download(file,name);$('research-status').textContent='Research path download started, including notes and source records.';});
  $('research-import').addEventListener('click',()=>importPath());
  return {render,toggle,renderGuide,openSaved:()=>{render();renderLibrary();$('research-library').open=true;openPanel('research-panel');}};
}
