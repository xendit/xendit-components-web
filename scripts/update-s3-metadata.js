#!/usr/bin/env node
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

// Read the JS hash from the build output
const jsHashPath = path.join(__dirname, "../secure-iframe/dist/js-hash.txt");
if (!fs.existsSync(jsHashPath)) {
  console.error(
    "JS hash file not found. Make sure the build completed successfully.",
  );
  process.exit(1);
}

const jsHash = fs.readFileSync(jsHashPath, "utf8").trim();
console.log(`Using JS hash: ${jsHash}`);

fs.writeFileSync(path.join(__dirname, "../csp-hash.txt"), jsHash);

console.log("Environment variables file created successfully.");
