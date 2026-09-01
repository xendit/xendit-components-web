# Development

Use `pnpm` to install dependencies, not npm.

Run `pnpm dev` to run the dev server. It hosts a development UI on https://localhost:4443/.

You MUST configure the browser to trust the certificate or googlepay will not work. For chrome, go to `chrome://certificate-manager/` and import the cert. If you _ever_ ignore the cert error you must restart your browser, even after importing the cert.

Run `pnpm test` to run tests.

# Releasing

1. If you added any new locale strings, trigger the import process from the Lokalise UI. If any strings have changed, run `./trigger-lokalise-pr.sh` to pull from Lokalise.
1. Run `./bump 1.2.3` to change the version number.
1. Update CHANGELOG.md. Add a new section for the new version.
1. Commit and merge the result.
1. Create a tag using https://github.com/xendit/xendit-components-web/releases/new, setting the release notes to:
   `See [CHANGELOG.md](https://github.com/xendit/xendit-components-web/blob/main/CHANGELOG.md)`
1. Trigger a staging release on the new tag https://asia.buddy.works/xendit/xendit-components-web/pipelines/pipeline/1756/run
   - Test using the staging postrelease testbed: https://assets.stg.tidnex.dev/components/postrelease-testbed.html
1. Trigger a prod release on the new tag https://asia.buddy.works/xendit/xendit-components-web/pipelines/pipeline/1757/run
   - Test using the prod postrelease testbed: https://assets.xendit.co/components/postrelease-testbed.html
1. Publish to npm by running https://github.com/xendit/xendit-components-web/actions/workflows/npm-publish.yml, enter the tag name as the input (with v prefix)
