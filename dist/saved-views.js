// A view stores presentation state only. Imported files cannot add data or code.
import {edges} from './data.js';
import {validateResearch} from './research-paths.js';
const relationshipIds=new Set(edges.map(edge=>edge.id));
export const workspaceFormat = 'columbus-network-views';
export const workspaceVersion = 1;
export const maximumViews = 12;

const finite = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e7;
export function validateView(value, entityIds) {
  if (!value || typeof value !== 'object' || typeof value.query !== 'string' || value.query.length > 30000 || (value.query && !value.query.startsWith('?'))) throw Error('This file does not contain a valid explorer view.');
  const query = new URLSearchParams(value.query);
  for (const key of ['pins', 'starts', 'seeded', 'expanded', 'explored', 'anchor', 'center']) for (const id of (query.get(key) || '').split(',').filter(Boolean)) if (!entityIds.has(id)) throw Error('This view references an entity that is unavailable in this edition.');
  if (!Array.isArray(value.positions) || value.positions.length > entityIds.size || value.positions.some(row => !Array.isArray(row) || row.length !== 3 || !entityIds.has(row[0]) || !finite(row[1]) || !finite(row[2]))) throw Error('This file contains invalid entity positions.');
  if (new Set(value.positions.map(row => row[0])).size !== value.positions.length) throw Error('This file repeats an entity position.');
  if(value.overviewIds&&(!Array.isArray(value.overviewIds)||value.overviewIds.length>entityIds.size||value.overviewIds.some(id=>!entityIds.has(id))||new Set(value.overviewIds).size!==value.overviewIds.length))throw Error('This file contains invalid overview entities.');
  const camera = value.camera;
  if (!camera || !finite(camera.x) || !finite(camera.y) || !finite(camera.z) || camera.z < .02 || camera.z > 4) throw Error('This file contains an invalid map zoom.');
  const size = value.dimensions || {};
  const dimensions = {width: finite(size.width) && size.width > 0 ? size.width : 800, height: finite(size.height) && size.height > 0 ? size.height : 570};
  const details = value.details || {};
  return {query: value.query, ...(['bubble-cloud-v1','bubble-cloud-v2'].includes(value.mapLayout)?{mapLayout:value.mapLayout}:{}),...(value.overviewIds?{overviewIds:[...value.overviewIds]}:{}), positions: value.positions.map(row => [...row]), camera: {x:camera.x,y:camera.y,z:camera.z}, dimensions, scale:finite(value.scale)&&value.scale>=.3&&value.scale<=1?value.scale:1, details: {open: details.open !== false, docked: details.docked === true, width: finite(details.width) ? Math.max(180, Math.min(900, details.width)) : 420},...(value.research?{research:validateResearch(value.research,entityIds,relationshipIds)}:{})};
}

export function parseWorkspace(value, entityIds) {
  if (!value || value.format !== workspaceFormat || value.version !== workspaceVersion || !Array.isArray(value.views) || !value.views.length || value.views.length > maximumViews) throw Error('Choose an explorer views file exported by this website (up to 12 views).');
  const views = value.views.map((view, index) => {
    if (!view || typeof view.name !== 'string' || !view.name.trim() || view.name.length > 80) throw Error('Each view needs a name of 1–80 characters.');
    return {id: 'view-' + (index + 1), name: view.name.trim(), snapshot: validateView(view.snapshot, entityIds)};
  });
  const active = Number.isInteger(value.active) && value.active >= 0 && value.active < views.length ? value.active : 0;
  const primary = Number.isInteger(value.primary) && value.primary >= 0 && value.primary < views.length ? value.primary : active;
  const secondary = value.layout === 'split' && Number.isInteger(value.secondary) && value.secondary >= 0 && value.secondary < views.length && value.secondary !== primary ? value.secondary : null;
  return {views, activeId: views[secondary===null||![primary,secondary].includes(active)?primary:active].id, primaryId:views[primary].id, secondaryId: secondary === null ? null : views[secondary].id, layout: secondary === null ? 'single' : 'split'};
}

export function workspaceFile(views, activeId, secondaryId, releaseId, primaryId=activeId) {
  return {format: workspaceFormat, version: workspaceVersion, release: releaseId, active: Math.max(0, views.findIndex(view => view.id === activeId)), primary:Math.max(0,views.findIndex(view=>view.id===primaryId)), secondary: views.findIndex(view => view.id === secondaryId), layout: secondaryId ? 'split' : 'single', views: views.map(view => ({name: view.name, snapshot: view.snapshot}))};
}
