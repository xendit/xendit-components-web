const textEncoder = new TextEncoder();

/**
 * Throws an error if `signature` is not a valid signature of `signee` with at least one of
 * the passed keys.
 */
export async function pin(
  masterPinningKeys: JsonWebKey[],
  signature: ArrayBuffer,
  signee: ArrayBuffer
) {
  for (const key of masterPinningKeys) {
    const pinningKey = await crypto.subtle.importKey(
      "jwk",
      key,
      {
        name: "ECDSA",
        namedCurve: "P-384"
      },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: "SHA-256"
      },
      pinningKey,
      signature,
      signee
    );
    if (valid) {
      return;
    }
  }
  throw new Error("Invalid server public key signature");
}

/**
 * Generate a keypair.
 */
export async function generateOwnKeys() {
  return await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-384"
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

/**
 * ECDH key derivation.
 *
 * Uses server public key and own private key.
 * Runs HKDF on the result using `info` and an empty salt.
 */
export async function deriveSharedKey(
  ownKeyPair: CryptoKeyPair,
  counterpartyPublicKeyBytes: ArrayBuffer,
  info: string
) {
  const serverPublicKey = await crypto.subtle.importKey(
    "spki",
    counterpartyPublicKeyBytes,
    {
      name: "ECDH",
      namedCurve: "P-384"
    },
    false,
    [] // must be empty for public key (this is not documented smh)
  );
  const keyMaterialBytes = await crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: serverPublicKey
    },
    ownKeyPair.privateKey,
    384
  );
  const keyMaterialKey = await crypto.subtle.importKey(
    "raw",
    keyMaterialBytes,
    "HKDF",
    false,
    ["deriveKey"]
  );
  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(info)
    },
    keyMaterialKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt"]
  );
}

/**
 * Hashes a string with SHA-256.
 */
export async function hashText(value: string) {
  const bytes = textEncoder.encode(value).buffer;
  const hashBytes = await crypto.subtle.digest(
    {
      name: "SHA-256"
    },
    bytes
  );

  return hashBytes;
}

/**
 * Encrypt text using AES-GCM with key and additionalData with a 128bit auth tag.
 */
export async function encryptText(
  value: string,
  key: CryptoKey,
  additionalData: ArrayBuffer
) {
  const ivBytes = crypto.getRandomValues(new Uint32Array(12)).buffer;
  const plainTextBytes = textEncoder.encode(value).buffer;
  const cipherTextBytes = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
      additionalData: additionalData,
      tagLength: 128
    },
    key,
    plainTextBytes
  );

  return { ivBytes, cipherTextBytes };
}
