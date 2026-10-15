// Additions reference existing checked records. Unknown identity/date fields stay unknown.
export const entityIdentifiers = {
  wsyx: [{ scheme: 'FCC facility ID', value: '56549', sourceIds: ['media-fcc-wsyx'], locator: 'WSYX license renewal row' }],
  aep: [{ scheme: 'SEC CIK', value: '0000004904', sourceIds: ['aep-order'], locator: 'SEC filing issuer directory / edgar/data/4904' }]
};
export const relationshipValidity = {
  e47: { start: '1992-12-15', end: '2007-09-04', startPrecision: 'day', endPrecision: 'day', certainty: 'documented', sourceIds: ['wexner-review'], locator: 'Printed page 9', note: 'Trustee term; distinct from the report publication date.' }
};
export const leadDetails = [
  { entityIds:['wsyx','wtte','wwho','wbns','wcmh','wtvn'], sourceIds:['media-fcc-wsyx','media-sinclair'], missingDocument:'Current FCC Form 323, license-company ownership exhibits and operating agreements', holder:'FCC public inspection files and licensees', identifiers:['FCC facility 56549 (WSYX)'], dateRange:'Current filings and the October 2025 WWHO transition' },
  { entityIds:['nexstar','tegna','wbns'], sourceIds:['media-injunction','media-yost'], missingDocument:'Executed Ohio MOU and post-August 6 court orders', holder:'Ohio Attorney General; federal court docket; agreement parties', dateRange:'After August 6, 2026' },
  { entityIds:[], sourceIds:[], missingDocument:'Ownership filings and disclosed authority for additional local outlets', holder:'Outlet disclosures, FCC and state registration records', dateRange:'Current; scope to be selected' },
  { entityIds:['dispatch','usa-today-co'], sourceIds:['media-dispatch-current','media-gannett-2019'], missingDocument:'Current intermediate legal-entity chain, voting filings and local editorial roster', holder:'SEC, Ohio business register and publisher', dateRange:'2019 merger through current records' },
  { entityIds:['wosu','wcbe'], sourceIds:['media-wosu-board','media-wosu-finance','media-wcbe'], missingDocument:'Current financial reports, appointment records, named grants and underwriting agreements', holder:'Stations, license holders, university and school district', dateRange:'After FY2024 and current appointments' },
  { entityIds:['jobsohio','flock','anduril'], sourceIds:[], missingDocument:'Named advertising invoices, FCC political files and sponsor agreements', holder:'Stations, advertisers and relevant public agencies', dateRange:'Relevant invoice / campaign periods to be established' },
  { entityIds:['wsyx','wtte'], sourceIds:['media-kimmel','media-local-kimmel'], missingDocument:'Dated local-airing logs, news-share agreements, staffing records and syndication invoices', holder:'Stations, program suppliers and public inspection files', dateRange:'September 2025 and individually established program periods' }
];
