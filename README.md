# Columbus Power Network

[Explore the map](https://someoneliketim.github.io/cbus-power-network/) · [Suggest a correction](https://github.com/someonelikeTIM/cbus-power-network/issues/new?template=evidence-correction.yml) · [Contribute](docs/CONTRIBUTING.md)

An independent, source-linked map of the people, organizations, money and public decisions that shape Columbus and Ohio. Inspired by [TheyRule](https://theyrule.net/), the project aims to make Columbus politics easier to explore and understand.

Start with a name or a tag such as **Lobbyist** or **Campaign donations**. Combine tags to narrow the map, click a person or organization to reveal connections, and open a connection to read its sources. Paths, filters, a visible legend and Undo support exploration. **Show all** opens the complete network.

The first public edition, **2026-10-15**, contains **316 entities, 462 relationships, 160 sources and 202 timeline events**. Coverage includes campaign contributions, public contracts, tax incentives, lobbying, civic affiliations and media ownership. This is a selected collection, not a complete register.

Evidence labels distinguish reporting, allegations, findings, registrations and authorizations. A connection alone establishes neither wrongdoing nor causation. Donation totals may summarize several reported receipts; spending ceilings are different from payments. Details preserve those distinctions and explain missing dates or records. See [methodology](docs/METHODOLOGY.md).

## Data and citations

The explorer provides record links, current-view downloads and evidence packets. [Versioned JSON/CSV tables, schemas and checksums](https://someoneliketim.github.io/cbus-power-network/downloads/2026-10-15/manifest.json) are in `dist/downloads/`. Join records using stable IDs and cite the edition. See the [data dictionary](docs/DATA-DICTIONARY.md).

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
