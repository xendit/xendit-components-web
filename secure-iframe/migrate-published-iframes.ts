#!/usr/bin/env -S node --experimental-transform-types

import { execFileSync } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
  assertJwksUrl,
  ENVIRONMENT_JWKS_URLS,
  type BuildEnvironment,
} from "./build-config.ts";
import { applyMigrationToWorktree } from "./migrate-published-iframes-lib.ts";

const repoRoot = path.resolve(import.meta.dirname, "..");
const versionsFile = path.join(import.meta.dirname, "supported-versions.txt");
const versionPattern = /^v\d+\.\d+\.\d+$/;

const deploymentDefaults: Record<
  BuildEnvironment,
  { bucket: string; prefix: string }
> = {
  "production-live": {
    bucket: "xendit-checkout-assets",
    prefix: "prod-live/components",
  },
  "production-development": {
    bucket: "",
    prefix: "",
  },
  "staging-live": {
    bucket: "xendit-checkout-assets-staging",
    prefix: "components",
  },
  "staging-development": {
    bucket: "",
    prefix: "",
  },
  local: {
    bucket: "",
    prefix: "",
  },
  test: {
    bucket: "",
    prefix: "",
  },
};

function resolveEnvironment(): BuildEnvironment {
  const environment = process.env.XENDIT_COMPONENTS_ENVIRONMENT;
  if (!environment) {
    return "production-live";
  }
  if (!(environment in ENVIRONMENT_JWKS_URLS)) {
    throw new Error(`Unknown XENDIT_COMPONENTS_ENVIRONMENT: ${environment}`);
  }
  return environment as BuildEnvironment;
}

async function readSupportedVersions() {
  const configured = process.env.SUPPORTED_IFRAME_VERSIONS;
  if (configured) {
    return configured
      .split(/[\s,]+/)
      .map((version) => version.trim())
      .filter(Boolean);
  }

  const contents = await fs.readFile(versionsFile, "utf-8");
  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function assertOnlyExpectedChanges(worktree: string) {
  const status = execFileSync("git", ["status", "--porcelain"], {
    cwd: worktree,
    encoding: "utf-8",
  });
  const allowed = new Set([
    "secure-iframe/src/main.ts",
    "secure-iframe/src/jwks.ts",
    "secure-iframe/build.ts",
  ]);
  const changed = status
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim());

  for (const file of changed) {
    if (!allowed.has(file)) {
      throw new Error(
        `Migration changed an unexpected file in ${worktree}: ${file}`,
      );
    }
  }
}

async function migrateVersion(
  version: string,
  jwksUrl: string,
  outputDir: string,
) {
  if (!versionPattern.test(version)) {
    throw new Error(`Unsupported iframe version format: ${version}`);
  }

  const worktree = await fs.mkdtemp(
    path.join(process.env.MIGRATION_WORKTREE_ROOT ?? os.tmpdir(), "iframe-"),
  );
  await fs.rm(worktree, { recursive: true, force: true });

  try {
    execFileSync(
      "git",
      ["worktree", "add", "--detach", "--force", worktree, version],
      { cwd: repoRoot, stdio: "inherit" },
    );

    await applyMigrationToWorktree(worktree, repoRoot);
    assertOnlyExpectedChanges(worktree);

    // Older tags can depend on packages that are no longer in the current
    // lockfile. Install each version's own locked dependencies before building.
    if (process.env.SKIP_INSTALL === "1") {
      console.log(`[${version}] Skipping dependency install`);
      await fs.symlink(
        path.join(repoRoot, "node_modules"),
        path.join(worktree, "node_modules"),
        "dir",
      );
    } else {
      execFileSync(
        "pnpm",
        [
          "install",
          "--frozen-lockfile",
          "--ignore-scripts",
          "--prefer-offline",
        ],
        {
          cwd: worktree,
          env: { ...process.env, CI: "1" },
          stdio: "inherit",
        },
      );
    }

    execFileSync(
      process.execPath,
      ["--experimental-transform-types", "secure-iframe/build.ts", "prod"],
      {
        cwd: worktree,
        env: {
          ...process.env,
          CI: "1",
          XENDIT_COMPONENTS_JWKS_URL: jwksUrl,
          XENDIT_COMPONENTS_VERSION: version,
        },
        stdio: "inherit",
      },
    );

    const distDir = path.join(worktree, "secure-iframe/dist");
    const builtHtmlPath = path.join(distDir, "secure-iframe.html");
    const versionedHtmlPath = path.join(
      outputDir,
      `secure-iframe-${version}.html`,
    );
    const html = await fs.readFile(builtHtmlPath, "utf-8");
    if (html.includes("PINNING_KEYS_MACRO")) {
      throw new Error(`${version} still contains PINNING_KEYS_MACRO`);
    }
    if (html.includes("XENDIT_COMPONENTS_PINNING_KEYS")) {
      throw new Error(
        `${version} still contains XENDIT_COMPONENTS_PINNING_KEYS`,
      );
    }
    if (!html.includes(`connect-src ${jwksUrl}`)) {
      throw new Error(`${version} is missing the exact connect-src URL`);
    }
    if (!html.includes(jwksUrl)) {
      throw new Error(`${version} does not fetch the configured JWKS URL`);
    }

    await fs.copyFile(builtHtmlPath, versionedHtmlPath);
    const jsHash = (
      await fs.readFile(path.join(distDir, "js-hash.txt"), "utf-8")
    ).trim();

    return { version, versionedHtmlPath, jsHash };
  } finally {
    try {
      execFileSync("git", ["worktree", "remove", "--force", worktree], {
        cwd: repoRoot,
        stdio: "ignore",
      });
    } catch {
      // The worktree may not have been created if `git worktree add` failed.
    }
    await fs.rm(worktree, { recursive: true, force: true });
  }
}

async function main() {
  const environment = resolveEnvironment();
  const jwksUrl = assertJwksUrl(
    process.env.XENDIT_COMPONENTS_JWKS_URL ??
      ENVIRONMENT_JWKS_URLS[environment],
  );
  const versions = await readSupportedVersions();
  if (versions.length === 0) {
    throw new Error("No supported iframe versions configured");
  }

  const defaults = deploymentDefaults[environment];
  const bucket = process.env.S3_BUCKET ?? defaults.bucket;
  const prefix = process.env.S3_PREFIX ?? defaults.prefix;
  const publish = process.env.PUBLISH === "1";

  if (publish && (!bucket || !prefix)) {
    throw new Error("S3_BUCKET and S3_PREFIX are required when publishing");
  }

  const outputDir = await fs.mkdtemp(
    path.join(process.env.MIGRATION_OUTPUT_ROOT ?? os.tmpdir(), "iframe-out-"),
  );

  for (const version of versions) {
    const result = await migrateVersion(version, jwksUrl, outputDir);
    const cspConnectSrc = `connect-src ${jwksUrl}`;

    if (!publish) {
      console.log(
        `[dry-run] ${version}: built ${result.versionedHtmlPath}; ` +
          `would upload to s3://${bucket}/${prefix}/secure-iframe-${version}.html`,
      );
      continue;
    }

    execFileSync(
      "aws",
      [
        "s3",
        "cp",
        result.versionedHtmlPath,
        `s3://${bucket}/${prefix}/secure-iframe-${version}.html`,
        "--metadata",
        `csp-hash=${result.jsHash},csp-connect-src=${cspConnectSrc},jwks-url=${jwksUrl}`,
        "--acl",
        "private",
      ],
      { stdio: "inherit" },
    );
    console.log(`Published secure-iframe-${version}.html`);
  }

  console.log(
    `Migration complete for ${versions.length} versions using ${jwksUrl}`,
  );
  console.log(`Migration artifacts: ${outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
