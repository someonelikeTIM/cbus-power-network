# CBUS Power

[Explore cbuspower.org](https://cbuspower.org/) · [Suggest a correction](https://github.com/someonelikeTIM/cbus-power-network/issues/new?template=evidence-correction.yml) · [Contribute](docs/CONTRIBUTING.md)

An independent, source-linked map of the people, organizations, money and public decisions that shape Columbus and Ohio. Inspired by [TheyRule](https://theyrule.net/), the project aims to make Columbus politics easier to explore and understand.

Each entity opens with a short introduction and links to the documents behind it. Follow a connection to read about the next person, organization or project, or use **Undo** to return to the previous stop.

Start with a name, topic, organization, source or tool. For example, search for **JobsOhio**, choose its record, then follow **Intel** through the joint project announcement. The **Evidence** link on that row opens the supporting record. The arrival link on Intel’s record returns to the announcement. You can also start with an issue such as **red light cameras**. Opening a connection from the welcome screen frames both endpoints. During an exploration, **Show this connection on map** frames the record and **Back to previous map** restores your place.

Search stays above the map. Press **/** or **Ctrl/Cmd+K** to focus it, use the arrow keys to choose a suggestion, and press **Enter** to open it. **Escape** dismisses suggestions and keeps your place. Searching for **party colors**, **date** or **connection distance** opens the relevant control.

The homepage features connections from court records, audits and public spending decisions. Use the arrows or scroll sideways through the cards. Choose either name to explore the map, **Read evidence** to see the full record, or the publisher’s name to open the original source. The cards advance every 12 seconds. Browsing pauses them, and reduced-motion settings start them paused. **RANDOM** opens any connected entity in the network.

**Your trail** shows the entities you visited. Select an earlier step to resume there. A **New start** marks a jump without a recorded link. **Undo** restores the previous exploration step. Visit **Links**, **Entities** or **Sources** to browse the underlying records. **Return to map** restores the trail, camera and panel you left.

The four research projects on the homepage open a finished map and its evidence trail. Inspect a connection or open its original document. **Back to project overview** brings the map back together. **Add to my research** copies the connections into your own path and keeps your existing notes. Click inside the Record panel to widen it or on the canvas to give the map more room. The divider also lets you set a width by hand.

The current edition, **2026-11-20-research-projects**, contains **396 entities, 584 relationships, 209 sources and 243 event records**. Seven new sources document an earlier data-center tax law, opposing testimony on Ohio license plate reader legislation, company trade-group disclosures and TechNet’s testimony on an Ohio AI bill.

Evidence labels distinguish reporting, allegations, findings, registrations and authorizations. A connection alone establishes neither wrongdoing nor causation. Donation totals may summarize several reported receipts; spending ceilings are different from payments. Details preserve those distinctions and explain missing dates or records. See [methodology](docs/METHODOLOGY.md).

## Data and citations

The explorer provides record links, current-view downloads and evidence packets. [Versioned JSON/CSV tables, schemas and checksums](https://cbuspower.org/downloads/2026-11-20-research-projects/manifest.json) are in `dist/downloads/`. Join records using stable IDs and cite the edition. See the [data dictionary](docs/DATA-DICTIONARY.md).

## Explorer views

Search **2026 political campaigns** or choose it in the Topic menu under Filters to explore the election-cycle records. The November 3 election has been held. Candidate and contest details now show the checked November 4 unofficial returns for all ten covered races, with source scope and certification pending. Leading returns are not certified victories or proof that a new officeholder has taken office. Two roster candidates absent from the retrieved return remain unknown, and shared governor/lieutenant-governor ticket counts are not added twice. Candidates and listed write-ins in the covered races come from the official September 22 roster. The filter includes earlier fundraising for 2026 elections, with dated background roles alongside. Candidate details open Campaign money inside the explorer: official filing totals, totals by reported name, individual transactions, source links and CSV exports. This edition contains 172 reports and 1,913,710 transaction, memo and balance rows across 29 committees for 2025–2026, plus 104 supplementary disclosures excluded from financial totals. Three earlier F3X financial reports for C00895276 are unparsed and excluded from these totals; their original links, coverage periods and hashes are listed in the finance index. Missing periods are not zero fundraising. The November 9 update adds 23 checked 48-hour notices, including one amendment, separately from the unchanged financial totals. Stinziano’s October 22 county report remains included from the November 2 transcription. Post-general reports and amendments remain a separate refresh task; these are not complete election-cycle totals. Other county/state inputs retain their October 15 baseline; Crawley’s new county report awaits transcription. The federal ledger retains its targeted October 26 inventory and Ronan’s earlier inventory. Eight candidates still lack matched financial reports; the coverage list preserves those gaps instead of assigning zero fundraising. Outside spending remains a separate, selected collection. Campaign statements, filings, charitable gifts and endorsements retain separate meanings.

New tab opens another independent exploration. Side by side keeps two desktop views visible; Single view returns to one canvas. Each view retains its search, tags, filters, pins, camera and entity positions.

Drag to pan and scroll to zoom. Shift-drag selects an area, Ctrl/Cmd-click adds or removes a record, and Alt-drag moves selected entities. New direct neighbors can be placed around an anchor once. Earlier placements stay fixed as you follow a branch. The overview locator and Fit control help you find the wider network.

The **Record** panel stays open as you explore. It starts on the left, with the overview map in the lower-right corner. **Float** lets you move it over the map. Use **Dock left** or **Dock right** to move it to either edge. Each saved view remembers its panel position. **Connections** lets you follow a neighbor, and **Evidence & sources** opens its supporting records. The citation beside a statement opens the publisher’s original. The source card directly below includes the document title, publication date, and an archived copy when available.

**Filters**, **Find path**, **Research** and **Map tools** open in a separate tools panel. You can inspect the current record while using a tool. Close the tool with its × button or Escape.

**Map tools** includes the connection key, color mode, connection distance, labels, dollar amounts, layout and selection actions. Distance can show one through six steps or all connected entities in the current filters. Party colors use recorded affiliations. Links with different known parties appear gray. Each dollar label retains its own payment, commitment, ceiling or range qualification.

**Desktop-first release:** mobile layout work is deferred until the desktop version is delivered. Smaller devices can still load the site and receive a notice recommending a full-size browser. Mobile layout and regression tests are not release gates.

Pin entities or specific connections to chart a research path. Research opens the ordered steps, their connecting routes and space for your own notes. Steps can be reordered or removed; Undo restores changes. **SHOW PINNED** beside the trail fits every pinned entity and both ends of every pinned connection on the canvas, across all topics and filters. The overview includes direct records between pins and documented routes through intermediate entities. Disconnected groups stay separate. **Back to exploration** restores the previous map framing. Save path keeps a named copy in this browser. Export path creates a distinct research artifact with its identifier, edition, step order, notes, presentation settings and referenced source records. Import path opens that artifact in a new tab. Connecting routes use existing relationships, with gaps retained where no route is recorded; they remain separate from your notes and interpretations.

Filters group connection types with whole-group checkboxes and Select all / Deselect all. The legend counts the relationships drawn in the current network. Selecting a record highlights its neighborhood without hiding the rest of that filtered network.


Choose **Save this view** in the Workspace menu to store a named copy in this browser. Load a saved view opens that copy in a new tab. Export this view or Export all tabs creates a portable JSON file, including pins, filters, positions and zoom. Import views opens valid files as additional tabs, keeping existing work. These files store presentation choices; Download data separately exports the sourced records. Its preview states the view, current selection, format, edition, record counts and file name. Browser reloads retain the current tab session, while a fresh site visit still begins with guided search.

Choose **Load a research path** in the Workspace menu to open saved research from the entry screen or the map.

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
