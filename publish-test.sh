#!/bin/bash -ex

# This script simulates the published NPM package and tests that it can be imported properly.

# assume the build has already been run

# pack the package and unpack it in a temp directory
rm -rf build-test
mkdir -p build-test/node_modules
npm pack --pack-destination build-test
cd build-test

# install build tools, then unpack the package, then install dependencies of the package (order is important)
npm i rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs
tar -xzf ./xendit-components-*.tgz -C node_modules
(cd node_modules/package && npm i --omit=dev)


# check it can be imported in ESM
node -e "$(cat <<'EOF'
const p = await import('package');
const assert = await import('assert');
assert.ok(p.XenditComponents);
EOF
)"

# check it can be imported in CJS
node --input-type=commonjs -e "$(cat <<'EOF'
const p = require('package');
const assert = require('assert');
assert.ok(p.XenditComponents);
EOF
)"

# check it can be bundled properly
cat <<'EOF' > rollup.config.mjs
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
export default {
	input: "-",
	output: { format: "esm" },
	external: () => false,
	plugins: [
		resolve({ browser: true }),
		commonjs({ include: "**/node_modules/**" })
	]
};
EOF

cat <<'EOF' | ./node_modules/.bin/rollup -c rollup.config.mjs --input-type=module --format=esm --silent > /dev/null
import * as p from "package";
if (!p.XenditComponents) {
	throw new Error("failed");
}
EOF
