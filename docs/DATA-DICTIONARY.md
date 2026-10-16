# Data dictionary

## Campaign filing ledgers

`dist/finance/2026/index.json` lists candidate coverage, committees, reports, source files, checksums and reconciliation figures. Each on-demand `.json.gz` transaction file contains `columns` and `rows`. Amounts use integer US cents. Records retain reported dates, names, accounting categories, memo flags, form codes, public employer/occupation, references and source locators. Postal addresses and contact fields are excluded.

Federal record IDs contain the filing and original transaction ID. Ohio bulk files lack transaction IDs; their IDs use the report key, a hash of the reduced public row and an occurrence suffix. Identical values survive as separate rows. IDs identify records in the captured edition, not unique people. Superseded federal filing versions are excluded from totals.

Name-summary files group identical reported names and money types within each report, with counts and report references. Matching names do not establish one donor identity. Different spellings are not automatically merged. Matching a name to a map entity requires separate identity evidence.

Reconciliation compares itemized rows and reported summaries in cents. Federal summary remainders stay unattributed, including unitemized contributions and other amounts without named rows. Ohio loan schedules supplement the bulk files. Memo rows, carried loan/debt balances and form-to-form accounting subtotals are not additional fundraising. Ohio in-kind support is separate from monetary contributions. Federal totals follow the filing's accounting basis and may include in-kind entries.

Shared tickets use one ledger. Authorized nominee committees remain separate from principal committees. Transfers can appear in two committees' ledgers. Adding map donation amounts to the filing ledger would also count the same records twice. Missing reports and blank fields remain unknown. Report-year filters select reports, not a new transaction-date accounting period.

The dataset is a static collection with schema version 1.0.0. Versioned downloads contain entities, relationships, sources, events and research leads in JSON and CSV, plus schemas and a SHA-256 manifest. Original curated data uses CC BY 4.0; third-party materials are excluded. See [license and attribution](https://github.com/someonelikeTIM/cbus-power-network/blob/main/DATA-LICENSE.md).

## Tables and joins

| Table | Key | Connections to other tables |
| --- | --- | --- |
| entities | id | sourceIds; documented externalIdentifiers |
| relationships | id | source and target entity IDs; sourceIds; evidenceEntries |
| sources | id | Preferred citation URL; publicationDate; contentCheck; archiveCapture |
| events | id | edgeIds; primaryEdgeId; actorIds; sourceIds |
| leads | id | entityIds; sourceIds; resultingRecordIds |

IDs persist when names or graph positions change. Coordinates are presentation only. CSV object/array fields contain JSON; formula-like strings are escaped to reduce spreadsheet execution risk.

## Relationships and evidence

type describes the connection category. status describes its evidence, including reported, allegation, finding, authorized and registered. evidence and context state the support and its limits. evidenceEntries identify a source, locator and role: support, qualify, contradict or supersede. publicationState separates accepted records from proposals.

claimReview contains the recorded support-check status/date and reviewer attribution where available. Initial public records have unavailable attribution and carry no claim of independent editorial review. A contentCheck describes source retrieval/observation separately. Hashes can cover original response bytes or explicitly identified rendered text; methods explain the distinction.

## Amounts and dates

amount is a number with unit and an amountLabel for display. amountIsUpperBound and amountIsLowerBound preserve bounds. amountIncludedIn references a containing amount. modifiesRelationshipId links an added contract authorization to its base. A filtered packet uses externalRelationshipReferences if that base is absent.

reportedAggregate identifies a reported combined amount. contributionCount can be unknown. contributionBreakdown rows supply reported dates/amounts making up the single aggregate; they are not additional transactions to total again. Committee identifiers remain separate from proof of contribution receipts.

Event date precision is day, month, year, period or unknown. date.role identifies what occurred or was observed. validity records supported relationship terms; uncertain terms stay unknown. Archive capture, source check and publication dates are separate.

## Filtered downloads

Current-view exports include filters, viewURL and matching records. tagSelection lists active tags, matching entity/relationship IDs and separate connectorRelationshipIds for contextual links. Connected mixed-tag searches span up to two recorded links. Matching relationships and context connectors are disjoint. Presentation-only dotted path guides are absent from factual relationship exports.

Research leads are open questions. Filtered packets contain a complete lead only when all its entities are present; relatedLeadIds can refer back to the full edition. Source documents themselves are not included.
