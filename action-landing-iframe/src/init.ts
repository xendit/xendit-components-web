import {
  assert,
  base64ToArrayBuffer,
  stringToUtf8Bytes,
} from "../../shared/utils";
import { pin } from "../../shared/crypto";
import { insecurePostMessage } from "../../shared/iframe-utils";

function getQueryInputs() {
  const query = new URLSearchParams(location.search);

  const originalUrl = query.get("original_url");
  assert(originalUrl, "Missing query parameter: original_url");
  const status = query.get("status");
  assert(status, "Missing query parameter: status");
  const originalUrlSignatureBase64 = query.get("sig");
  assert(originalUrlSignatureBase64, "Missing query parameter: sig");

  return {
    originalUrl,
    status,
    originalUrlSignatureBase64,
  };
}

// @ts-expect-error This macro is replaced with a JSON array by the build script
const masterPinningKeys: JsonWebKey[] = PINNING_KEYS_MACRO;

const queryInputs = getQueryInputs();

export async function init() {
  const originalUrlSignatureBytes = base64ToArrayBuffer(
    queryInputs.originalUrlSignatureBase64,
  );

  // validate signature of original_url
  await pin(
    masterPinningKeys,
    originalUrlSignatureBytes,
    // we may also need to sign the current time to avoid replays
    stringToUtf8Bytes(queryInputs.originalUrl).buffer,
  );

  // if this is an iframe...
  if (window.parent !== window) {
    // tell parent frame that the action is done
    insecurePostMessage({
      type: "xendit-iframe-action-complete",
    });
  } else {
    // otherwise, just redirect
    window.location.href = queryInputs.originalUrl;
  }
}

export function fatalError(err: Error) {
  console.error(`Xendit secure iframe`, err);
  insecurePostMessage({
    type: "xendit-iframe-failed-init",
  });
}
