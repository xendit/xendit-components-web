#!/bin/sh
set -eu

PROJECT_ID="3462021668be91ba559c20.54914856"
API_URL="https://api.lokalise.com/api2/projects/${PROJECT_ID}/files/download"

if [ -z "${LOKALISE_API_TOKEN:-}" ]; then
  echo "Error: LOKALISE_API_TOKEN environment variable is required" >&2
  echo "Usage: LOKALISE_API_TOKEN=your_token $0" >&2
  exit 1
fi

# Trim whitespace/newlines that may be added by CI variable handling
LOKALISE_API_TOKEN=$(printf '%s' "${LOKALISE_API_TOKEN}" | tr -d '[:space:]')

echo "Using token: $(echo "${LOKALISE_API_TOKEN}" | cut -c1-4)... (length: ${#LOKALISE_API_TOKEN})"

curl --fail-with-body --request POST \
  --url "${API_URL}" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --header "X-Api-Token: ${LOKALISE_API_TOKEN}" \
  --data '{
    "format": "json",
    "original_filenames": false,
    "bundle_structure": "sdk/src/locale/%LANG_ISO%.%FORMAT%",
    "include_tags": ["components", "imported-from-components"],
    "indentation": "2sp",
    "triggers": ["github"],
    "filter_repositories": ["xendit/xendit-components-web"]
  }'

echo ""
echo "Ok. A GitHub PR should be created in a few seconds."
