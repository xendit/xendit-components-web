import { deriveSharedKey, hashText } from "./crypto";
import { base64ToArrayBuffer } from "./utils";

/* v8 ignore start */

export async function importPinningKeyForSigning(pinningKey: JsonWebKey) {
  return await crypto.subtle.importKey(
    "jwk",
    pinningKey,
    {
      name: "ECDSA",
      namedCurve: "P-384",
    },
    true,
    ["sign"],
  );
}

export async function exportPublicKey(keyPair: CryptoKeyPair) {
  return await crypto.subtle.exportKey("spki", keyPair.publicKey);
}

export async function generateKeys() {
  const ecdhKeyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-384",
    },
    true,
    ["deriveKey", "deriveBits"],
  );
  return ecdhKeyPair;
}

export async function signPublicKey(
  keyPair: CryptoKeyPair,
  signingKey: CryptoKey,
) {
  const signature = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    signingKey,
    await exportPublicKey(keyPair),
  );
  return signature;
}

export async function decryptText(
  ecdhKeyPair: CryptoKeyPair,
  iframePublicKeyBytes: ArrayBuffer,
  encrypted: { iv: string; value: string },
  sessionId: string,
) {
  const aesKey = await deriveSharedKey(
    ecdhKeyPair,
    iframePublicKeyBytes,
    sessionId,
  );
  const buf = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToArrayBuffer(encrypted.iv),
      additionalData: await hashText(sessionId),
    },
    aesKey,
    base64ToArrayBuffer(encrypted.value),
  );
  const decryptedText = new TextDecoder().decode(buf);
  return decryptedText;
}
