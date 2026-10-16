import {nodes, edges, sources, meta} from './data.js';
import {release} from './contract.js';
import {repositoryURL} from './project-links.js';
import {parseWorkspace, validateView, workspaceFile, maximumViews} from './saved-views.js';
import {researchFormat,researchSnapshot} from './research-paths.js';

const ids = new Set(nodes.map(node => node.id));
const libraryKey = 'columbus-network:saved-views-v1';
const sessionKey = 'columbus-network:workspace-v1';
const frames = new Map();
const captures = new Map();
let captureSerial = 0;
const emptySnapshot = () => ({query: '', positions: [], camera: {x: 0, y: 0, z: 1}, dimensions: {width: 800, height: 570}, details: {open: true, docked: false, width: 380}});
let serial = 1;
let views = [{id: 'view-1', name: 'View 1', snapshot: {...emptySnapshot(), query: location.search}}];
let activeId = 'view-1', primaryId = activeId, secondaryId = null;
try {
  const stored = JSON.parse(sessionStorage.getItem(sessionKey));
  if (stored?.views?.[stored.active]?.snapshot.query === location.search) {
    const restored = parseWorkspace(stored, ids);
    ({views, activeId, primaryId, secondaryId} = restored); serial = views.length;
  }
} catch { /* A new workspace is available even if browser storage is unavailable. */ }

document.body.dataset.workspaceHost = 'true';
document.body.dataset.view = 'network';
const main = document.querySelector('main');
const footer = document.querySelector('.page-footer');
main.replaceChildren();
const explorer = document.createElement('section'); explorer.id = 'explorer'; explorer.setAttribute('aria-label', 'Explorer workspace');
explorer.innerHTML = `<div class="workspace-bar"><div class="explorer-tabs" role="tablist" aria-label="Explorer views"></div><button class="workspace-button" id="new-view" aria-label="New explorer tab">+ New tab</button><div class="workspace-actions"><button class="workspace-button" id="split-views" aria-pressed="false">Side by side</button><label id="compare-label" hidden>Beside<select id="compare-view" aria-label="View to show beside"></select></label><details class="views-menu"><summary>Views <span aria-hidden="true">▾</span></summary><div><button id="rename-view">Rename tab</button><button id="save-view">Save this view…</button><button id="load-view">Load a saved view…</button><button id="load-research">Load a research path…</button><button id="export-view">Export this view</button><button id="export-workspace">Export all tabs</button><button id="import-views">Import views…</button></div></details></div></div><div class="explorer-panes"></div><p class="workspace-status" role="status" aria-live="polite"></p><input type="file" id="view-file" accept=".json,application/json" hidden><dialog id="view-name-dialog"><form method="dialog"><h2 id="view-name-title">Save this view</h2><label>Name<input id="view-name" maxlength="80" required></label><div class="view-dialog-actions"><button value="cancel" formnovalidate>Cancel</button><button id="confirm-view-name" value="save">Save</button></div></form></dialog><dialog id="view-library"><form method="dialog"><button class="dialog-close" aria-label="Close saved views">×</button></form><h2>Saved views</h2><p>Stored in this browser. Export a file to keep a copy or use another browser.</p><div id="saved-view-list"></div></dialog>`;
main.append(explorer, footer);
const $ = id => document.getElementById(id);
$('source-total').textContent = String(sources.length);
$('review-date').textContent = 'Updated ' + new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'}).format(new Date(meta.reviewed + 'T12:00:00Z'));
$('release-label').textContent = (release.status === 'published' ? 'Edition · ' : 'Local preview · ') + release.releaseId;
if (repositoryURL) {
  $('github-contribute').href = repositoryURL + '/blob/main/docs/CONTRIBUTING.md';
  $('github-contact').href = repositoryURL + '/issues'; $('github-contact').hidden = false;
}
const status = message => { document.querySelector('.workspace-status').textContent = message; };
const currentView = () => views.find(view => view.id === activeId);
const baseHeight = () => Math.max(480, innerHeight - document.querySelector('.masthead').offsetHeight - document.querySelector('.workspace-bar').offsetHeight - (footer.offsetHeight||32) - 18);
function send(id, type, payload = {}) {
  frames.get(id)?.frame.contentWindow?.postMessage({channel: 'columbus-explorer', type, viewportHeight:baseHeight(), ...payload}, location.origin);
}
function capture(id) {
  return new Promise((resolve,reject)=>{
    if(!frames.get(id)?.ready){reject(Error('The view is still loading. Try again in a moment.'));return;}
    const requestId=++captureSerial;
    const timer=setTimeout(()=>{captures.delete(requestId);reject(Error('The view could not be captured. Please try again.'));},1800);
    captures.set(requestId,{resolve:snapshot=>{clearTimeout(timer);resolve(snapshot);},reject});send(id,'capture',{requestId});
  });
}
function persist() {
  const file = workspaceFile(views, activeId, secondaryId, release.releaseId, primaryId);
  try { sessionStorage.setItem(sessionKey, JSON.stringify(file)); } catch { /* Explicit saved views use separate storage. */ }
}
function mount(view) {
  if (frames.has(view.id)) return;
  const pane = document.createElement('section'); pane.className = 'explorer-pane'; pane.id = 'pane-' + view.id; pane.setAttribute('role', 'tabpanel');
  const frame = document.createElement('iframe'); frame.title = view.name + ' explorer'; frame.setAttribute('scrolling', 'no'); frame.style.height = baseHeight() + 'px';
  const url = new URL(location.pathname, location.origin); url.search = view.snapshot.query; frame.src = url.href;
  pane.append(frame); document.querySelector('.explorer-panes').append(pane);
  frames.set(view.id, {pane, frame, pending: view.snapshot, ready: false});
}
function renderTabs() {
  const list = document.querySelector('.explorer-tabs'); list.replaceChildren();
  for (const view of views) {
    const holder = document.createElement('div'); holder.className = 'explorer-tab';
    const tab = document.createElement('button'); tab.setAttribute('role', 'tab'); tab.id = 'tab-' + view.id; tab.setAttribute('aria-controls', 'pane-' + view.id); tab.setAttribute('aria-selected', String(view.id === activeId)); tab.tabIndex = view.id === activeId ? 0 : -1; tab.textContent = view.name; tab.title = view.name; tab.addEventListener('click', () => activate(view.id));
    const close = document.createElement('button'); close.className = 'close-tab'; close.setAttribute('aria-label', 'Close ' + view.name); close.textContent = '×'; close.addEventListener('click', () => closeView(view.id));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const index = views.findIndex(item => item.id === view.id);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? views.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + views.length) % views.length;
      activate(views[next].id); $('tab-' + activeId).focus();
    });
    holder.append(tab, close); list.append(holder); mount(view);
  }
  for (const view of views) {
    const entry = frames.get(view.id); const visible = view.id === primaryId || view.id === secondaryId;
    entry.pane.hidden = !visible; entry.pane.classList.toggle('active-pane', view.id === activeId); entry.pane.setAttribute('aria-labelledby', 'tab-' + view.id); entry.frame.title = view.name + ' explorer';
  }
  document.querySelector('.explorer-panes').dataset.layout = secondaryId ? 'split' : 'single';
  $('split-views').textContent = secondaryId ? 'Single view' : 'Side by side'; $('split-views').setAttribute('aria-pressed', String(!!secondaryId));
  $('compare-label').hidden = !secondaryId; $('compare-view').replaceChildren();
  for (const view of views.filter(view => view.id !== primaryId)) { const option = new Option(view.name, view.id); option.selected = view.id === secondaryId; $('compare-view').append(option); }
  persist();
}
function activate(id) {
  if (!views.some(view => view.id === id)) return;
  status('');
  if (id !== primaryId && id !== secondaryId) {
    if (activeId === secondaryId) secondaryId = id; else primaryId = id;
  }
  activeId = id; renderTabs();
  history.replaceState(null, '', location.pathname + currentView().snapshot.query);
  send(id, 'measure');
}
function addView(snapshot = emptySnapshot(), name = 'View ' + (serial + 1)) {
  if (views.length >= maximumViews) { status('Up to 12 tabs can stay open. Save or export a view before closing a tab.'); return; }
  const view = {id: 'view-' + (++serial), name, snapshot}; views.push(view); activate(view.id); return view;
}
function closeView(id) {
  const index = views.findIndex(view => view.id === id); if (index < 0) return;
  frames.get(id)?.pane.remove(); frames.delete(id); views.splice(index, 1);
  if (!views.length) { activeId = primaryId = ''; secondaryId = null; addView(); return; }
  if (secondaryId === id) secondaryId = null;
  if (primaryId === id) { primaryId = secondaryId || views[Math.min(index, views.length - 1)].id; secondaryId = null; }
  if (activeId === id) activeId = primaryId;
  renderTabs(); activate(activeId);
}
$('new-view').addEventListener('click', () => addView());
$('split-views').addEventListener('click', () => {
  if (secondaryId) { primaryId = activeId; secondaryId = null; }
  else {
    primaryId = activeId;
    if (views.length === 1) { const original = activeId; addView(); primaryId = original; secondaryId = activeId; }
    else secondaryId = views.find(view => view.id !== primaryId).id;
  }
  renderTabs(); for (const id of [primaryId, secondaryId].filter(Boolean)) send(id, 'measure');
});
$('compare-view').addEventListener('change', () => { secondaryId = $('compare-view').value; renderTabs(); send(secondaryId, 'measure'); });

let namingAction = 'save';
function askName(action) {
  namingAction = action; $('view-name-title').textContent = action === 'save' ? 'Save this view' : 'Rename tab'; $('confirm-view-name').textContent = action === 'save' ? 'Save view' : 'Rename'; $('view-name').value = currentView().name; $('view-name-dialog').returnValue='';$('view-name-dialog').showModal(); $('view-name').select();
}
$('rename-view').addEventListener('click', () => askName('rename'));
$('save-view').addEventListener('click', async () => {try{await capture(activeId);askName('save');}catch(error){status(error.message);}});
function library() { try { const entries = JSON.parse(localStorage.getItem(libraryKey) || '[]'); return Array.isArray(entries) ? entries.filter(entry => { try { validateView(entry.snapshot, ids); return typeof entry.name === 'string'; } catch { return false; } }) : []; } catch { return []; } }
$('view-name-dialog').addEventListener('close', () => {
  if ($('view-name-dialog').returnValue !== 'save') return;
  const name = $('view-name').value.trim().slice(0, 80); if (!name) return;
  currentView().name = name; renderTabs();
  if (namingAction === 'save') {
    const entries = library().filter(entry => entry.name !== name); entries.push({name, snapshot: currentView().snapshot});
    try { localStorage.setItem(libraryKey, JSON.stringify(entries)); status('“' + name + '” saved in this browser.'); } catch { status('The browser could not save this view. Export a file to keep a copy.'); }
  }
});
function showLibrary() {
  const list = $('saved-view-list'); list.replaceChildren();
  const entries = library();
  if (!entries.length) list.textContent = 'No saved views yet. Use Views → Save this view.';
  entries.forEach((entry, index) => {
    const row = document.createElement('div'); row.className = 'saved-view-row';
    const open = document.createElement('button'); open.textContent = 'Open ' + entry.name; open.addEventListener('click', () => { if (addView(entry.snapshot, entry.name)) $('view-library').close(); });
    const remove = document.createElement('button'); remove.textContent = 'Remove'; remove.setAttribute('aria-label', 'Remove saved view ' + entry.name); remove.addEventListener('click', () => { entries.splice(index, 1); try { localStorage.setItem(libraryKey, JSON.stringify(entries)); showLibrary(); } catch { status('The browser could not update saved views.'); } });
    row.append(open, remove); list.append(row);
  });
}
$('load-view').addEventListener('click', () => { showLibrary(); $('view-library').showModal(); });
$('load-research').addEventListener('click',()=>send(activeId,'research-library'));
async function exportViews(all) {
  const chosen = all ? views : [currentView()];
  try{await Promise.all(chosen.map(view=>capture(view.id)));}catch(error){status(error.message);return;}
  const file = workspaceFile(chosen, activeId, all ? secondaryId : null, release.releaseId,all?primaryId:activeId);
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], {type: 'application/json'}));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = all ? 'columbus-explorer-tabs.json' : 'columbus-explorer-view.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); status('Explorer view file exported.');
}
$('export-view').addEventListener('click', () => exportViews(false)); $('export-workspace').addEventListener('click', () => exportViews(true));
$('import-views').addEventListener('click', () => $('view-file').click());
$('view-file').addEventListener('change', async () => {
  const file = $('view-file').files?.[0]; $('view-file').value = ''; if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw Error('Choose an explorer views file smaller than 2 MB.');
    const json=JSON.parse(await file.text());
    if(json?.format===researchFormat){const snapshot=researchSnapshot(json,{nodeIds:ids,edgeIds:new Set(edges.map(edge=>edge.id)),validateSnapshot:validateView});if(addView(snapshot,json.research.title.slice(0,80)))status('Research path opened in a new tab. Existing tabs were kept.');return;}
    const imported = parseWorkspace(json, ids);
    if (views.length + imported.views.length > maximumViews) throw Error('These views would exceed 12 tabs. Close a tab or import fewer views.');
    const additions = imported.views.map(view => ({...view, id: 'view-' + (++serial)}));
    views.push(...additions); activate(additions[imported.views.findIndex(view => view.id === imported.activeId)].id);
    if (imported.secondaryId) { primaryId = additions[imported.views.findIndex(view => view.id === imported.primaryId)].id; secondaryId = additions[imported.views.findIndex(view => view.id === imported.secondaryId)].id; renderTabs(); }
    status(additions.length + ' imported view' + (additions.length === 1 ? '' : 's') + ' opened. Existing tabs were kept.');
  } catch (error) { status(error instanceof SyntaxError ? 'This is not a valid JSON view file. Your tabs are unchanged.' : error.message); }
});
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.channel !== 'columbus-explorer') return;
  const entry = [...frames.entries()].find(([, entry]) => entry.frame.contentWindow === event.source); if (!entry) return;
  const [id, frame] = entry, view = views.find(view => view.id === id);
  if(event.data.type==='download-campaign-money'){
    const text=event.data.text,name=event.data.name;
    if(typeof text!=='string'||text.length>128*1024*1024||typeof name!=='string'||!/^[a-zA-Z0-9_.-]{1,110}\.csv$/.test(name)){status('This campaign CSV could not be prepared.');return;}
    let link=$('campaign-csv-download');
    if(!link){link=document.createElement('a');link.id='campaign-csv-download';link.className='workspace-button';link.textContent='Save campaign CSV ↧';document.querySelector('.workspace-actions').prepend(link);}
    if(link.href.startsWith('blob:'))URL.revokeObjectURL(link.href);
    link.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));link.download=name;link.click();status('Campaign CSV prepared. Save campaign CSV keeps a downloadable copy above the explorer.');return;
  }
  if(event.data.type==='download-research'){
    try{const file=event.data.file;researchSnapshot(file,{nodeIds:ids,edgeIds:new Set(edges.map(edge=>edge.id)),validateSnapshot:validateView});const value=JSON.stringify(file,null,2);if(value.length>2*1024*1024)throw Error('The research file is larger than 2 MB.');const url=URL.createObjectURL(new Blob([value],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=String(event.data.name||'research-path.json').replace(/[^a-zA-Z0-9_.-]/g,'-').slice(0,120);link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Research path file prepared.');}catch(error){status(error.message);}return;
  }
  if(event.data.type==='import-research'){$('view-file').click();return;}
  if(event.data.type==='open-research'){try{const snapshot=validateView(event.data.snapshot,ids);addView(snapshot,String(event.data.name||'Research path').slice(0,80));}catch(error){status(error.message);}return;}
  if (event.data.type === 'ready') { frame.ready = true; send(id, 'restore', {snapshot: frame.pending||view.snapshot}); frame.pending = null; return; }
  if (event.data.type === 'focus') { if (activeId !== id) activate(id); return; }
  if (event.data.type === 'height') { const height = Number(event.data.height); if (Number.isFinite(height)) frame.frame.style.height = Math.max(baseHeight(), Math.min(150000, height)) + 'px'; return; }
  if (event.data.type === 'state') {
    try { view.snapshot = validateView(event.data.snapshot, ids); } catch { return; }
    frame.pane.dataset.ready='true';
    const pending=captures.get(event.data.requestId);if(pending){captures.delete(event.data.requestId);pending.resolve(view.snapshot);}
    if (id === activeId) {
      history.replaceState(null, '', location.pathname + view.snapshot.query);
      const kind = new URLSearchParams(view.snapshot.query).get('view') || 'network';
      document.querySelectorAll('.view-nav [data-view]').forEach(button => { const selected = button.dataset.view === kind; button.classList.toggle('active', selected); selected ? button.setAttribute('aria-current', 'page') : button.removeAttribute('aria-current'); });
    }
    persist();
  }
});
document.querySelector('.view-nav').addEventListener('click', event => {
  const button = event.target.closest('[data-view]'); if (!button) return;
  for (const entry of frames.values()) entry.frame.style.height = baseHeight() + 'px';
  send(activeId, 'navigate', {view: button.dataset.view});
});
document.addEventListener('click', event => {
  const link = event.target.closest('[data-project-dialog]');
  if (link) { event.preventDefault(); document.querySelector('dialog[open]')?.close(); $(link.dataset.projectDialog).showModal(); }
  if (event.target.closest('.methodology-open')) $('methodology').showModal();
  if (event.target.closest('.views-menu button')) document.querySelector('.views-menu').open = false;
});
window.addEventListener('resize', () => { for (const entry of frames.values()) entry.frame.style.height = baseHeight() + 'px'; for (const id of [primaryId, secondaryId].filter(Boolean)) send(id, 'measure'); });
window.addEventListener('popstate', () => { currentView().snapshot = {...emptySnapshot(), query: location.search}; send(activeId, 'restore', {snapshot: currentView().snapshot}); });
renderTabs();
