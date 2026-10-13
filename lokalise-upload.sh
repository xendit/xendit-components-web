#!/bin/sh
set -eu

LOCALE_PATH="sdk/src/locale"

if [ -z "${LOKALISE_PROJECT_ID:-}" ]; then
  echo "Error: LOKALISE_PROJECT_ID environment variable is required" >&2
  exit 1
fi

if [ -z "${LOKALISE_API_TOKEN:-}" ]; then
  echo "Error: LOKALISE_API_TOKEN environment variable is required" >&2
  exit 1
fi

echo "Uploading en.json to Lokalise..."

FILE_CONTENT=$(base64 -w 0 < "${LOCALE_PATH}/en.json" 2>/dev/null || base64 < "${LOCALE_PATH}/en.json" | tr -d '\n')

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

HTTP_CODE=$(curl --silent --output "$TMPDIR/response.json" --write-out "%{http_code}" --request POST \
  --url "https://api.lokalise.com/api2/projects/${LOKALISE_PROJECT_ID}/files/upload" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --header "X-Api-Token: ${LOKALISE_API_TOKEN}" \
  --data '{
    "data": "'"${FILE_CONTENT}"'",
    "filename": "en.json",
    "lang_iso": "en",
    "tags": ["components", "imported-from-components"],
    "replace_modified": false,
    "convert_placeholders": true,
    "detect_icu_plurals": true
  }')

RESPONSE=$(cat "$TMPDIR/response.json")

if [ "$HTTP_CODE" -ge 400 ]; then
  echo "Upload failed with HTTP $HTTP_CODE:"
  echo "$RESPONSE"
  exit 1
fi

if echo "$RESPONSE" | jq -e '.process.process_id' > /dev/null 2>&1; then
  echo "Upload queued successfully"
else
  echo "Upload may have failed. Check response above."
  exit 1
fi
