# CBUS Power

[Explore cbuspower.org](https://cbuspower.org/) · [Suggest a correction](https://github.com/someonelikeTIM/cbus-power-network/issues/new?template=evidence-correction.yml) · [Contribute](docs/CONTRIBUTING.md)

An independent, source-linked map of the people, organizations, money and public decisions that shape Columbus and Ohio. Inspired by [TheyRule](https://theyrule.net/), the project aims to make Columbus politics easier to explore and understand.

Start anywhere: search a person, organization or tag, or browse the whole network. The welcome examples illustrate possible starting points; they are not preferred routes or research conclusions. The overview includes every entity and documented connection in the current filters.

Selecting an entity opens a flyout with connection counts and types. Show direct connections places new neighbors in nearby rings once. The anchor and previously placed entities stay fixed when expanding or filtering a branch. Type buttons narrow the highlighted connections, and choosing a connection follows it to the next entity. Short camera moves frame the active branch clear of controls. A persistent Origin trail and network overview retain the wider context. Labels avoid one another and reveal more detail with zoom. Orphans are excluded from the canvas after filters are applied; the source data and entity directory retain their records.

The current edition, **2026-10-26**, contains **390 entities, 566 relationships, 185 sources and 225 timeline events**. It retains the Wexner–Epstein and Redflex enrichments and adds a targeted campaign-ledger update. Coverage includes campaign contributions, public contracts, tax incentives, lobbying, civic affiliations and media ownership. This is a selected collection, not a complete register.

Evidence labels distinguish reporting, allegations, findings, registrations and authorizations. A connection alone establishes neither wrongdoing nor causation. Donation totals may summarize several reported receipts; spending ceilings are different from payments. Details preserve those distinctions and explain missing dates or records. See [methodology](docs/METHODOLOGY.md).

## Data and citations

The explorer provides record links, current-view downloads and evidence packets. [Versioned JSON/CSV tables, schemas and checksums](https://cbuspower.org/downloads/2026-10-26/manifest.json) are in `dist/downloads/`. Join records using stable IDs and cite the edition. See the [data dictionary](docs/DATA-DICTIONARY.md).

## Explorer views

Search **2026 political campaigns** or choose it under Filters → Topic to explore the election-cycle records. Candidates and listed write-ins in the covered races come from the official September 22 roster. The filter includes earlier fundraising for 2026 elections, with dated background roles alongside. Candidate details open Campaign money inside the explorer: official filing totals, totals by reported name, individual transactions, source links and CSV exports. This edition contains 171 reports and 1,913,651 transaction, memo and balance rows across 29 committees for 2025–2026, plus 81 supplementary disclosures excluded from financial totals. The October 26 update adds eight pre-general financial reports, one nominee-fund termination report and 26 supplementary disclosures. State and county ledger inputs retain their October 15 baseline; newly listed county filings await transcription. Eight candidates still lack matched financial reports; the coverage list preserves those gaps instead of assigning zero fundraising. Outside spending remains a separate, selected collection. Campaign statements, filings, charitable gifts and endorsements retain separate meanings.

New tab opens another independent exploration. Side by side keeps two desktop views visible; Single view returns to one canvas. Each view retains its search, tags, filters, pins, camera and entity positions.

Drag to pan and scroll to zoom. Shift-drag traces a selection rectangle; Ctrl/Cmd-click adds or removes individual records. Alt-drag moves selected entities together. Selecting a connection opens its evidence. The entity flyout provides source-linked traversal. Original records and surrounding connections remain in the network; the overview locator can pan back to any region.

The entity flyout, quick tools and record details can be dragged by their headers and resized from their bottom-right corners. The flyout avoids the active entity and followed path; Auto place restores its automatic position. Details also resize from the left edge, and Dock right / Undock switches between a sidebar and a floating window. Double-click the details or quick tools header to dock or undock it. Double-click the entity flyout header for automatic placement. Window movement and resizing do not move entity coordinates. Whole network returns to the full connected view while preserving placed branches; an explicit position reset starts a new layout. Details use compact rows and source qualifications instead of duplicate metric blocks.

The quick menu adapts to entity, connection and mixed selections: center an entity, open a timeline, find a two-entity path, select connection endpoints, pin, isolate or export records with their sources. Sort by connection type explicitly arranges entities into labeled buckets; Natural layout restores the original world positions. Dollar labels retain each record's commitment, ceiling or range qualification without adding amounts together. Legend opens a larger connection-type panel over the canvas.

**Desktop-first release:** mobile layout work is deferred until the desktop version is delivered. Smaller devices can still load the site and receive a notice recommending a full-size browser. Mobile layout and regression tests are not release gates.

Pin entities or specific connections to chart a research path. Research opens the ordered steps, their connecting routes and space for your own notes. Steps can be reordered or removed; Undo restores changes. Show path brings the research network forward. Save path keeps a named copy in this browser. Export path creates a distinct research artifact with its identifier, edition, step order, notes, presentation settings and referenced source records. Import path opens that artifact in a new tab. Connecting routes use existing relationships, with gaps retained where no route is recorded; they remain separate from your notes and interpretations.

Filters group connection types with whole-group checkboxes and Select all / Deselect all. The legend counts the relationships drawn in the current network. Selecting a record highlights its neighborhood without hiding the rest of that filtered network.

The Timeline starts with records directly involving its selected entity. Connected entities expands to events involving entities within two documented links; indirect cards show the link route that brings them into view. Scope and money-status choices remain visible beside the event count.

Views → Save this view stores a named copy in this browser. Load a saved view opens that copy in a new tab. Export this view or Export all tabs creates a portable JSON file, including pins, filters, positions and zoom. Import views opens valid files as additional tabs, keeping existing work. These files store presentation choices; Download data separately exports the sourced records. Its preview states the view, current selection, format, edition, record counts and file name. Browser reloads retain the current tab session, while a fresh site visit still begins with guided search.

Views → Load a research path opens your saved research paths from the search-only start screen as well as from the map.

## Contributing

Evidence, corrections, code, design and accessibility improvements are welcome. [Open an issue](https://github.com/someonelikeTIM/cbus-power-network/issues/new/choose) or submit a pull request. Include the relevant record ID and a source with a page or paragraph reference. [Contribution guide](docs/CONTRIBUTING.md) · [Questions and contact](https://github.com/someonelikeTIM/cbus-power-network/issues)

## Run locally

Install Node.js 24 or later. There are no package dependencies or API keys.

```sh
npm run build
npm test
npm run dev
```

Open the address printed by the preview server. The [development guide](docs/DEVELOPMENT.md) explains the layout and checks. GitHub Pages serves the static `dist/` directory through the [deployment workflow](.github/workflows/pages.yml).

## Licensing and privacy

Code and project documentation: [MIT](LICENSE). Original curated data: [CC BY 4.0](DATA-LICENSE.md). **Third-party materials are explicitly excluded from both grants** and retain their own terms. No source documents are redistributed.

The site has no accounts, analytics or submission backend. GitHub issues and pull requests are public. [Privacy information](docs/PRIVACY.md)
