# Development

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
