/*
This must be a single file with no imports.
*/

const sessionId = "ps-12345678901234567890";

let pinningKeys: CryptoKey[] = [];

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  let i = 0;
  for (const c of binaryString) {
    bytes[i] = c.charCodeAt(0);
    i += 1;
  }
  return bytes.buffer;
}

async function hashText(value: string) {
  const bytes = new TextEncoder().encode(value).buffer;
  const hashBytes = await crypto.subtle.digest(
    {
      name: "SHA-256",
    },
    bytes,
  );

  return hashBytes;
}

async function deriveSharedKey(
  ownKeyPair: CryptoKeyPair,
  counterpartyPublicKeyBytes: ArrayBuffer,
  info: string,
) {
  const serverPublicKey = await crypto.subtle.importKey(
    "spki",
    counterpartyPublicKeyBytes,
    {
      name: "ECDH",
      namedCurve: "P-384",
    },
    false,
    [], // must be empty for public key (this is not documented smh)
  );
  const keyMaterialBytes = await crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: serverPublicKey,
    },
    ownKeyPair.privateKey,
    384,
  );
  const keyMaterialKey = await crypto.subtle.importKey(
    "raw",
    keyMaterialBytes,
    "HKDF",
    false,
    ["deriveKey"],
  );
  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(info),
    },
    keyMaterialKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["decrypt"],
  );
}

async function checkDecryptionWorks(
  ecdhKeyPair: CryptoKeyPair,
  iframePublicKeyBytes: ArrayBuffer | null,
  encrypted: { iv: string; value: string },
  sessionIdHashBytes: ArrayBuffer,
) {
  if (!iframePublicKeyBytes) {
    throw new Error("Iframe public key not set");
  }
  const aesKey = await deriveSharedKey(
    ecdhKeyPair,
    iframePublicKeyBytes,
    sessionId,
  );
  const buf = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToArrayBuffer(encrypted.iv),
      additionalData: sessionIdHashBytes,
    },
    aesKey,
    base64ToArrayBuffer(encrypted.value),
  );
  const decryptedText = new TextDecoder().decode(buf);
  return decryptedText;
}

async function initPinningKeys() {
  const pinningKeysResponse = await fetch("/pinning-keys.json");
  const pinningKeysData: JsonWebKey[] = await pinningKeysResponse.json();

  pinningKeys = await Promise.all(
    pinningKeysData
      .filter((jwk) => {
        // filter to only private keys
        return jwk.d !== undefined;
      })
      .map((jwk) => {
        return crypto.subtle.importKey(
          "jwk",
          jwk,
          {
            name: "ECDSA",
            namedCurve: "P-384",
          },
          true,
          ["sign"],
        );
      }),
  );
}

async function createTestCase(testCaseName: string, inputType: string) {
  const sessionIdHashBytes = await hashText(sessionId);

  const ecdhKeyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-384",
    },
    true,
    ["deriveKey", "deriveBits"],
  );
  const ecdhPublicKeyBytes = await crypto.subtle.exportKey(
    "spki",
    ecdhKeyPair.publicKey,
  );

  const signature = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    pinningKeys[0],
    ecdhPublicKeyBytes,
  );

  let iframePublicKeyBytes: ArrayBuffer | null = null;

  // make iframe url
  const embedderOrigin = "https://localhost:4444";
  const search = new URLSearchParams({
    embedder: embedderOrigin,
    pk: arrayBufferToBase64(ecdhPublicKeyBytes),
    sig: arrayBufferToBase64(signature),
    session_id: sessionId,
    input_type: inputType,
  });
  const url = `./secure-iframe.html?${search}`;

  // make ui
  const iframe = document.createElement("iframe");
  iframe.src = url;
  const h1 = document.createElement("h1");
  h1.textContent = testCaseName;
  const div = document.createElement("div");
  div.appendChild(h1);
  div.appendChild(iframe);

  // setup event listener for messages
  window.addEventListener("message", (event) => {
    if (event.source === iframe.contentWindow) {
      if (event.origin !== embedderOrigin) {
        console.warn("Received message from unexpected origin:", event.origin);
        return;
      }

      const data = event.data as import("../shared/types").IframeEvent;
      console.log("Received message:", data);
      switch (data.type) {
        case "xendit-iframe-ready": {
          iframePublicKeyBytes = base64ToArrayBuffer(data.ecdhPublicKey);
          break;
        }
        case "xendit-iframe-change": {
          const encrypted = data.encrypted;
          for (const enc of encrypted) {
            checkDecryptionWorks(
              ecdhKeyPair,
              iframePublicKeyBytes,
              enc,
              sessionIdHashBytes,
            )
              .then((str) => {
                console.log("Decryption result", str);
              })
              .catch((error) => {
                console.error("Decryption failed:", error);
              });
          }
        }
      }
    }
  });

  document.body.appendChild(div);
}

async function init() {
  await initPinningKeys();
  await createTestCase("Credit card input", "credit_card_number");
  await createTestCase("Expiry date input", "credit_card_expiry");
  await createTestCase("Credit card cvn input", "credit_card_cvn");
}

init().catch((error) => {
  console.error("Error loading secure iframe test UI:", error);
});
