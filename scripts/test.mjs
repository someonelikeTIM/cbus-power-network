import {execFileSync} from 'node:child_process';

const checks = [
  'check',
  'check-release',
  'check-civic-enrichment',
  'check-donation-enrichment',
  'check-exploration',
  'check-exploration-paths',
  'check-connection-distance',
  'check-explorer-ui',
  'check-tags-path-focus',
  'check-correction-workflow',
  'check-public-files',
];

for (const name of checks) {
  execFileSync(process.execPath, [`scripts/${name}.mjs`], {stdio: 'inherit'});
}
