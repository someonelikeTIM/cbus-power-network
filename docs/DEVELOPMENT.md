# Development

## Weekly maintenance

Run `npm run refresh` (or `node scripts/refresh-data.mjs`). It fetches current original URLs, including originals whose citations use archives, with three workers and a 20-second request timeout. To check a few sources, pass IDs: `node scripts/refresh-data.mjs mayor council burger`.

Read `artifacts/data-refresh/latest.json`. It lists baseline responses, unchanged responses, content changes and failed retrievals, alongside the edition's campaign coverage gaps. HTML comparisons omit scripts, markup and whitespace; other files use byte hashes. Dated reports retain earlier results. Failed requests preserve the last successful observation. Everything stays in ignored artifacts; the command never edits evidence, changes dates in the dataset or publishes anything. Changes can be routine page changes; an unchanged page can still describe an outdated role. These are review signals, not factual verification.

Once a week:

1. Review changed or failed sources, starting with prominent current roles and active projects. Use a browser when a publisher blocks scripted retrieval. Keep supported historical evidence when a current page disappears.
2. Check the official FEC committee filing indexes, Ohio report listings and Franklin County filings for new reports or amendments. Start with the eight unresolved candidate coverage gaps. Check again after major filing deadlines; a missing report is not zero fundraising. The source checker does not discover filings.
3. Investigate one manageable question: campaign coverage first, then executed contracts/actual payments, ownership/lobbying, or media ownership. Use the same evidence standards across people and organizations. Add only what the checked material establishes; retain unresolved questions as leads.
4. Record the result and the next question in an ignored `artifacts/data-refresh/notes.md`. Carry unresolved changes forward so later unchanged checks do not bury them. Prioritize corrections before expanding coverage. Once a month, use this pass for a broader enrichment batch if maintenance is caught up.

For accepted factual updates, follow the existing edition/build/test process below. Keep claim review separate from source retrieval, preserve stable IDs and qualifications, and retain old editions. Publication remains a separate step. No additional service, database or review system is needed.

## Refreshing campaign ledgers

Normal builds and tests use the committed static ledger files and need no credentials or network requests. `python scripts/build-campaign-ledgers.py` is an optional data-refresh step. It reads official candidate registers, cover pages, 2025–2026 contribution/expenditure exports and original FEC electronic filings from ignored `artifacts/campaign-ledger/`. The source URLs and hashes are recorded in the public finance index. Franklin County's reduced transcription is reviewable in `content/campaigns/county-ledgers-2026.json`; original scans remain outside tracked files.

The reviewed FEC filing inventory is in `content/campaigns/federal-disclosure-index-2026.json`. After obtaining the listed original CSV files, `python scripts/read-fec-covers.py` derives summary metadata directly from their covers. The summary API can lag newly filed reports, so prefer original committee filing indexes. When those are unavailable, a targeted addition can use official filing metadata plus a checked original electronic file; retain earlier original-index records and describe the limited refresh in the inventory basis. The inventory's asOf date identifies the snapshot; older source-check dates remain unchanged, including the explicit dates in county transcriptions. Supplementary bundling and contribution-notice links stay separate from financial totals.

The refresh writes compressed transaction files and reported-name summaries under `dist/finance/2026/`. A browser retrieves a file only when that view is opened and checks its hash before reading it. `scripts/check-campaign-ledgers.mjs` independently recalculates row totals and name summaries, checks source references and balances, and verifies that real repeated rows and blank summary fields survive. The privacy scan also inspects decompressed contents.

The website is plain HTML, CSS and JavaScript. Node.js 24 or later runs the dependency-free build and test scripts. Python 3 is optional for source archiving tools; choose its executable with COLUMBUS_ARCHIVE_PYTHON if needed.

## Project layout

| Location | Purpose |
| --- | --- |
| dist/app.js, styles.css, index.html | Explorer interface |
| dist/data.js and topic modules | Curated entities, relationships and sources |
| dist/contract.js, schemas/ | Export contract, evidence packets and validation |
| dist/exploration*.js, tags.js | Map branches, camera transitions, paths and tags |
| dist/archives.js, live-sources.js | Source content-check metadata |
| content/reviews.json | Accepted/declined contribution history |
| scripts/ | Build, preview, verification and review utilities |
| docs/ | Methodology, reuse and contributor information |

Run `npm run build`, `npm test`, then `npm run dev`. The preview binds to loopback only. COLUMBUS_PREVIEW_PORT changes its port, and COLUMBUS_PREVIEW_PREFIX can emulate /cbus-power-network/ hosting. No credentials are required to run the site.

Tests cover schema/reference integrity, source gates, data semantics, exploration, distance, tags, routes, URL state and correction history. Release checks compare generated tables, CSV fields, packets and checksums. Browser checks complement these with rendered layout, keyboard navigation, downloads and normal page scrolling.

For a data change, preserve existing IDs, add precise sources and qualifications, update the release ID/revision, build new downloads and record the change. The correction utility accepts reviewed proposals for supported relationship fields, retaining attribution and before/after values. Other changes require a directly reviewed data edit. Source-retrieval utilities write caches to ignored artifacts/; those caches are excluded from releases.

Keep private settings, credentials, local recovery files and source-document caches outside tracked files. `npm run check:privacy` scans the intended public files for common secrets, private paths and disallowed internal material. Review its findings and the actual staged diff before release; pattern checks cannot prove the absence of every sensitive value.
