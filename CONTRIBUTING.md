# Development

Use `pnpm` to install dependencies, not npm.

Run `pnpm dev` to run the dev server. It hosts a development UI on https://localhost:4443/. You must trust or ignore the self signed certificate.

Run `pnpm test` to run tests.

# Releasing

1. Run `./bump 1.2.3` to change the version number.
2. Update CHANGELOG.md. Rename the "Unreleased" section to the version number and add a new empty "Unreleased" section.
3. Commit and merge the result.
4. Create a tag using https://github.com/xendit/xendit-components-web/releases/new
5. Trigger a staging release on the new tag https://buddy.tidnex.com/xendit-inc/xendit-components-web/pipelines/pipeline/14900/run
6. Test using the postrelease testbed: https://assets.xendit.co/components/postrelease-testbed.html
7. Trigger a prod release on the new tag https://buddy.tidnex.com/xendit-inc/xendit-components-web/pipelines/pipeline/14901/run
8. Test using the postrelease testbed: https://assets.xendit.co/components/postrelease-testbed.html
