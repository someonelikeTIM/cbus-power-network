# Releases and deployment

GitHub Pages hosts the static dist/ directory at https://someoneliketim.github.io/cbus-power-network/. The deployment workflow validates the committed build before publishing it. Pull requests run checks without deployment; a push to main or a manual workflow run publishes a passing build.

## Prepare an edition

1. Update the release ID, dates and revision in dist/contract.js and dist/data.js when changing data. Keep old public download directories available for citations.
2. Record the change in CHANGELOG.md. Update documented counts and licensing information when needed.
3. Run npm run build and npm test. Inspect the explorer, record details, source links, mobile layout and downloads under the repository prefix.
4. Review the tracked files and diff for unintended content, then commit the source and generated files together. The workflow rejects a generated build that differs from the commit.

## Verify and recover

After deployment, check the live edition label, deep links, repository/contact links and download manifest. Compare downloaded bytes with the committed checksums.

For rollback, revert the problematic commit on main and let the workflow deploy the restored build. Record the reason in the changelog and preserve previously published data editions. The Actions deployment history identifies the deployed commit.

The workflow uses GitHub's Pages artifact and deployment actions with contents-read permissions for checks and pages-write/id-token permissions only for deployment. No external hosting credentials are stored in the repository.
