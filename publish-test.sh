#!/bin/bash -ex

# This script simulates the published NPM package and tests that it can be imported properly.

# assume the build has already been run

# pack the package and unpack it in a temp directory
rm -rf build-test
mkdir -p build-test/node_modules
npm pack --pack-destination build-test
cd build-test

# install build tools, then unpack the package, then install dependencies of the package (order is important)
npm i rollup@4.59.0 @rollup/plugin-node-resolve@16.0.3 @rollup/plugin-commonjs@29.0.2 webpack@5.105.4 webpack-cli@6.0.1
tar -xzf ./xendit-components-*.tgz -C node_modules
(cd node_modules/package && npm i --omit=dev)


# check it can be imported in ESM
node -e "$(cat <<'EOF'
const p = await import('package');
const assert = await import('assert');
console.log(Object.keys(p));
assert.ok(p.XenditComponents);
EOF
)"

# check it can be imported in CJS
node --input-type=commonjs -e "$(cat <<'EOF'
const p = require('package');
const assert = require('assert');
console.log(Object.keys(p));
assert.ok(p.XenditComponents);
EOF
)"

# check it works with rollup
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

# check it works with webpack
cat <<'EOF' > webpack.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';
export default {
	mode: 'production',
	entry: './webpack-test-entry.js',
	output: {
		path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'webpack-dist'),
		filename: 'bundle.js'
	},
	resolve: {
		extensions: ['.js']
	}
};
EOF

cat <<'EOF' > webpack-test-entry.js
import * as p from "package";
if (!p.XenditComponents) {
	throw new Error("failed");
}
EOF

./node_modules/.bin/webpack --config webpack.config.mjs
