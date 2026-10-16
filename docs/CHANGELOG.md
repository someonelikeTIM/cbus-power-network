# Changelog

## Unreleased — Readable path exploration

Entities have a six-pixel minimum radius and an eighteen-pixel selected radius. Label placement avoids overlaps without changing entity positions. Entities without an incident relationship in the current filters are excluded from the canvas.

An entity flyout shows connection and neighbor counts, connection-type filters, Show direct connections, and individual records to follow. Short camera motions follow selections and direct neighborhoods. An Origin trail and clickable network overview preserve context; traversal uses original relationship IDs and survives saved-view reloads. Undo restores the previous view without fanning entities out from an anchor.

Details use compact typography, actions, record counts, connection rows and sources. Duplicate dataset/visible metric blocks and instructional filler are removed; evidence and amount/date qualifications remain.

## Earlier in this local revision — Stable desktop network

The desktop canvas now retains all entities and recorded connections in the current filters. Selection highlights a neighborhood and opens its evidence without repacking entities or changing the camera. Zoom changes label detail, not world positions. Panning updates the SVG transform directly. Center, Fit, connection-type buckets and position reset are explicit actions.

Drag to pan is the default. Scroll zooms, Shift-drag selects, Ctrl/Cmd-click adds records, and Alt-drag moves entities. Both quick tools and record details support header dragging, corner resizing and docking. Details can be resized in both dimensions, docked to the right, or undocked without reframing the map. Saved desktop views retain world positions and context height.

The first-visit choices are presented as examples alongside unrestricted search and the whole network. Desktop controls use compact dimensions. Mobile-specific canvas packing, responsive control stacks and record sheets have been removed. Small devices receive a nonblocking full-size-browser notice. Mobile regression gates are deferred until the desktop version is delivered.

The first visit now explains what the explorer covers and offers three concrete starting points. The network overview action describes its readable subset instead of suggesting that every entity and connection appears at once. Record details keep source and qualification information alongside the selected record.

Entity timelines start with direct records. The connected scope explains its two-link inclusion rule, and indirect cards identify the recorded route that brings them into view. Switching to a view that cannot show the selected record closes its inspector. Path finding no longer preselects an unrelated destination and uses a single link's recorded period instead of a shared-range warning.

Download data is visible in list and timeline views. A preview shows the current selection, record counts, JSON format, edition and file name before saving. The confirmation names the file and included entity, link and source counts. These changes do not alter curated records or source distinctions.

## 2026-10-16 — Explorer focus and retained trails

Explored trails use stronger connection lines, clear type icons and outlined entities. Surrounding connections stay visible at lower contrast and return to full contrast on hover, keyboard focus or selection. Relationship colors and historical dashes retain their original meaning. The same emphasis applies to paths opened through Show this path and saved research paths.

Selecting an entity frames its full direct neighborhood automatically, with readable names, colored connection icons and a flyout containing connection counts and type choices. Overview zoom thresholds no longer hide direct neighbors. Smooth camera flights, type changes, pins and reverse Undo preserve continuity while exploring. The full direct neighborhood fits the visible canvas without extending its height. Icons are placed on their connection lines beside the corresponding entity, with space reserved before layout. A compact flyout and inline legend leave more room for the map. Very dense, narrow views use compact bubbles with full names available on focus or hover. Explored steps and their original connection records persist through later focus, saved views and reloads; Collapse connections and Collapse explored path are explicit actions. Undo restores the trail and its presentation together.

## 2026-10-16 — 2026 campaign coverage

The 2026 political campaigns topic and searchable tag collect election-cycle candidacies, committees, donations, personal financing, endorsements and outside opposition. A September 22 official roster adds candidates from every listed party and qualified write-ins in the covered statewide executive, Senate, OH-03/OH-15 and Franklin County races. Existing record IDs and earlier relationship values are retained.

Amy Acton's recorded background now includes her health-department, university, foundation and RAPID 5 roles, her ticket and campaign committee, campaign-listed organizational endorsements, and the purpose of existing V-PAC opposition spending. RAPID 5's developer gift remains charitable funding, separate from campaign donations. New FEC records add distinct Senate campaign committees and selected PAC contributions; a voided AEP PAC item is excluded rather than counted twice.

Campaign money opens within the existing explorer. It contains 160 available 2025–2026 reports, 1,837,416 transaction/memo/balance rows and 88 original source-file references across 29 committees. Ohio bulk exports are supplemented with loan schedules; eight Franklin County scanned reports are transcribed and reconciled to their covers. Current federal amendments replace earlier versions. Totals by reported name link to their underlying rows and sources; names are not treated as resolved identities. Files load on demand, preserving a small default map.

Eight candidate filing gaps, blank summary fields and federal amounts without named itemized rows remain visible. Memo rows, carried loan balances, transfers, in-kind support and accounting carry-over subtotals are distinguished. Candidate receipts and outside-group spending are separate; the collection does not claim exhaustive outside-spending coverage.

## 2026-10-15 — CBUS Power and explorer workspaces

A tightly packed bubble overview and zoom-dependent detail replace the dense all-at-once map. Bubbles scale with connection counts, with smaller entities filling gaps between larger ones. Visible entity footprints remain separate; lower-priority entities are withheld until there is room. Selecting an entity moves into a small neighborhood with a Pin/Details pop-out. Guided exploration lists the matching connections without filling the canvas. Visible distance controls the available scope, while zoom reveals finer layers.

CBUS Power now lives at cbuspower.org. Zoom enlarges the smaller overview bubbles and reveals their full names, while the layout separates growing circles and labels. Saved views keep the overview's visible entities and camera across tabs and reloads.

Entity and connection pins form an ordered research path with notes, documented connecting routes and explicit gaps. Paths can be saved locally, exported as identifiable research artifacts and imported into new tabs with their original record IDs and source references. Notes remain distinct from the dataset. Map windows make room for one another, and Undo restores research-step edits.

Explorer tabs support independent views, side-by-side comparison, named browser saves and versioned JSON export/import. Grouped filters offer bulk selection, and the legend retains muted excluded connection types with Show controls. Factual records and stable IDs are unchanged.

Solid entity bubbles use white text. Hovering or focusing a bubble shows its full name and recorded connection count; connection hover names its type. The legend fits a compact list of displayed types and grows with its content. Contribute links directly to the GitHub contribution guide; Contact opens GitHub issues.

## 2026-10-15 — first public edition

The source-linked explorer opens with search and offers tag combinations, expandable nodes, continuous camera movement, paths, a connection legend, record details and animated Undo. The initial collection contains 316 entities, 462 relationships, 160 sources and 202 timeline events.

Recent additions cover reported developer/lobbyist contributions, documented company roles and public contract authorizations. The dataset retains separate evidence statuses, aggregate contribution dates, contract modification references and historical tax-incentive records.

The edition includes versioned JSON/CSV downloads, schemas and checksums. Code/documentation use MIT; original curated data uses CC BY 4.0, excluding third-party materials. GitHub issues provide corrections, new evidence, questions and bug reports.
