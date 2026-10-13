#!/bin/sh
set -eu

LOCALE_PATH="sdk/src/locale"
BRANCH_NAME="lokalise-translations-$(date +%Y%m%d-%H%M%S)-$(head -c 4 /dev/urandom | od -An -tx1 | tr -d ' \n')"

if [ -z "${LOKALISE_PROJECT_ID:-}" ]; then
  echo "Error: LOKALISE_PROJECT_ID environment variable is required" >&2
  exit 1
fi

if [ -z "${LOKALISE_API_TOKEN:-}" ]; then
  echo "Error: LOKALISE_API_TOKEN environment variable is required" >&2
  exit 1
fi

if [ -z "${GITHUB_TOKEN_WRITE:-}" ]; then
  echo "Error: GITHUB_TOKEN_WRITE environment variable is required" >&2
  exit 1
fi

echo "Downloading translations from Lokalise..."

RESPONSE=$(curl --fail-with-body --silent --request POST \
  --url "https://api.lokalise.com/api2/projects/${LOKALISE_PROJECT_ID}/files/download" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --header "X-Api-Token: ${LOKALISE_API_TOKEN}" \
  --data '{
    "format": "json",
    "original_filenames": false,
    "bundle_structure": "%LANG_ISO%.%FORMAT%",
    "include_tags": ["components", "imported-from-components"],
    "indentation": "2sp",
    "json_unescaped_slashes": true
  }')

echo "Download response:"
echo "$RESPONSE" | jq .

BUNDLE_URL=$(echo "$RESPONSE" | jq -r '.bundle_url')

if [ -z "$BUNDLE_URL" ] || [ "$BUNDLE_URL" = "null" ]; then
  echo "Failed to get bundle URL from Lokalise"
  exit 1
fi

echo "Downloading bundle from: $BUNDLE_URL"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
curl --fail --silent --location "$BUNDLE_URL" --output "$TMPDIR/translations.zip"
unzip -o "$TMPDIR/translations.zip" -d "$TMPDIR/translations"
mv "$TMPDIR/translations/"*.json "${LOCALE_PATH}/"

echo "Translation files updated:"
ls -la "${LOCALE_PATH}/"

git diff --quiet "${LOCALE_PATH}/" && {
  echo "No translation changes detected"
  exit 0
}

echo "Changes detected, preparing commit..."

git config user.email "ci@xendit.co"
git config user.name "CI"
git checkout -B "${BRANCH_NAME}"
git add "${LOCALE_PATH}/"
git commit --no-verify -m "chore: update translations from Lokalise"
git push -u origin "${BRANCH_NAME}"

echo "Branch '${BRANCH_NAME}' pushed. Creating PR..."

PR_RESPONSE=$(curl --fail-with-body --silent --request POST \
  --url "https://api.github.com/repos/xendit/xendit-components-web/pulls" \
  --header "Accept: application/vnd.github+json" \
  --header "Authorization: Bearer ${GITHUB_TOKEN_WRITE}" \
  --header "X-GitHub-Api-Version: 2022-11-28" \
  --data '{
    "title": "chore: update translations from Lokalise",
    "body": "This PR contains translation updates from Lokalise.",
    "head": "'"${BRANCH_NAME}"'",
    "base": "main"
  }')

PR_URL=$(echo "$PR_RESPONSE" | jq -r '.html_url')

if [ -z "$PR_URL" ] || [ "$PR_URL" = "null" ]; then
  echo "Failed to create PR. Response:"
  echo "$PR_RESPONSE" | jq .
  exit 1
fi

echo "PR created: $PR_URL"
