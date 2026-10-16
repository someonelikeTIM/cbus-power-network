# CBUS Power

[Explore cbuspower.org](https://cbuspower.org/) · [Suggest a correction](https://github.com/someonelikeTIM/cbus-power-network/issues/new?template=evidence-correction.yml) · [Contribute](docs/CONTRIBUTING.md)

An independent, source-linked map of the people, organizations, money and public decisions that shape Columbus and Ohio. Inspired by [TheyRule](https://theyrule.net/), the project aims to make Columbus politics easier to explore and understand.

Start with one of the example questions, a name, or a tag such as **Lobbyist** or **Campaign donations**. Combine tags to narrow the map, click a person or organization to reveal connections, and open a connection to read its sources. Paths, filters, a readable legend and Undo support exploration. **Browse network overview** shows a readable selection of the network; choosing an entity reveals its documented connections.

Selecting an entity automatically frames its direct connections with full names and colored type icons. The entity flyout shows connection counts and lets you explore one type or return to all connections. Pin entities or connections to keep anchors in your research path. The focused map fits the visible canvas. Connection icons sit on their lines, and explored steps remain connected until you collapse the trail. Very dense, narrow views use compact bubbles; selecting one opens its name and neighborhood.

The current edition, **2026-10-16**, contains **377 entities, 541 relationships, 175 sources and 209 timeline events**. Coverage includes campaign contributions, public contracts, tax incentives, lobbying, civic affiliations and media ownership. This is a selected collection, not a complete register.

Evidence labels distinguish reporting, allegations, findings, registrations and authorizations. A connection alone establishes neither wrongdoing nor causation. Donation totals may summarize several reported receipts; spending ceilings are different from payments. Details preserve those distinctions and explain missing dates or records. See [methodology](docs/METHODOLOGY.md).

## Data and citations

The explorer provides record links, current-view downloads and evidence packets. [Versioned JSON/CSV tables, schemas and checksums](https://cbuspower.org/downloads/2026-10-16/manifest.json) are in `dist/downloads/`. Join records using stable IDs and cite the edition. See the [data dictionary](docs/DATA-DICTIONARY.md).

## Explorer views

Search **2026 political campaigns** or choose it under Filters → Topic to explore the election-cycle records. Candidates and listed write-ins in the covered races come from the official September 22 roster. The filter includes earlier fundraising for 2026 elections, with dated background roles alongside. Candidate details open Campaign money inside the explorer: official filing totals, totals by reported name, individual transactions, source links and CSV exports. This edition contains 160 reports and 1,837,416 transaction, memo and balance rows across 29 committees for 2025–2026. Eight candidates still lack matched financial reports; the coverage list preserves those gaps instead of assigning zero fundraising. Outside spending remains a separate, selected collection. Campaign statements, filings, charitable gifts and endorsements retain separate meanings.

New tab opens another independent exploration. Side by side keeps two views visible; Single view returns to one canvas. Each tab keeps its own search, tags, filters, pins, camera and entity positions. On narrow screens, two views stack vertically.

The overview packs entities into bubbles sized by their recorded connections. Hover shows the complete name and connection count. Zoom enlarges the smaller bubbles and reveals their full names; the layout makes room for the growing bubbles and text. Entities stay separate, with the count showing how much of the current scope fits on screen.

Choose an entity to move into its neighborhood and automatically open its details. Selecting a connection opens its evidence immediately. On narrow screens, a full-width record sheet keeps the record type, key qualification and source link near the heading. Choosing a next entity keeps the explored trail visible alongside its direct connections. Stronger lines and outlined entities identify the trail; other connections stay dimmed and clickable.

The compact quick menu overlays the top of the canvas and opens actions for entities, connections and mixed selections. Drag map space to trace a selection rectangle and preview the entities inside it; links between selected entities are included. A rectangle with no entities selects crossing lines. Ctrl/Cmd-click adds or removes individual records. Drag selected entities to move them together. Space-drag or the pan-mode button moves the canvas. The menu offers exploration and timeline actions for one entity, path finding for two entities, endpoint selection for connections, and pin, isolate and source-linked JSON export actions for any selection. Saved views retain selections.

Sort by connection type arranges the currently visible entities into labeled buckets. Each entity appears once, using its most common direct type to the starting entity where available, otherwise its most common visible incident type. Original links remain intact. Natural layout restores the wider scope. Show dollar amounts displays the record's amount label, preserving qualifiers such as commitment, ceiling or range. It does not add amounts together. The Legend button opens a larger connection-type panel over the canvas without reducing its height.

Pin entities or specific connections to chart a research path. Research opens the ordered steps, their connecting routes and space for your own notes. Steps can be reordered or removed; Undo restores changes. Show path brings the research network forward. Save path keeps a named copy in this browser. Export path creates a distinct research artifact with its identifier, edition, step order, notes, presentation settings and referenced source records. Import path opens that artifact in a new tab. Connecting routes use existing relationships, with gaps retained where no route is recorded; they remain separate from your notes and interpretations.

Visible distance sits beside search. Choosing an entity starts with direct connections (one step). Increasing it broadens the available neighborhood; zoom controls how much detail fits on screen. Filters group related connection types with whole-group checkboxes and Select all / Deselect all. The legend counts the connections currently drawn. Excluded relevant types stay muted, where Show adds a type back.

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
