# Development

Use `pnpm` to install dependencies, not npm.

Run `pnpm dev` to run the dev server. It hosts a development UI on https://localhost:4443/.

You MUST configure the browser to trust the certificate or googlepay will not work. For chrome, go to `chrome://certificate-manager/` and import the cert. If you _ever_ ignore the cert error you must restart your browser, even after importing the cert.

Run `pnpm test` to run tests.

# Releasing

1. Run `./bump 1.2.3` to change the version number.
2. Update CHANGELOG.md. Rename the "Unreleased" section to the version number and add the following back to the top of the file:

```markdown
# Unreleased

No unreleased changes.
```

3. Commit and merge the result.
4. Create a tag using https://github.com/xendit/xendit-components-web/releases/new
5. Trigger a staging release on the new tag https://asia.buddy.works/xendit/xendit-components-web/pipelines/pipeline/1756/run
6. Test using the staging postrelease testbed: https://assets.stg.tidnex.dev/components/postrelease-testbed.html
7. Trigger a prod release on the new tag https://asia.buddy.works/xendit/xendit-components-web/pipelines/pipeline/1757/run
8. Test using the prod postrelease testbed: https://assets.xendit.co/components/postrelease-testbed.html
9. Publish to npm by running https://github.com/xendit/xendit-components-web/actions/workflows/npm-publish.yml, enter the tag name as the input (with v prefix)
