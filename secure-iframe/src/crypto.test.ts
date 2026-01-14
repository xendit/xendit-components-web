import { describe, expect, it } from "vitest";
import {
  deriveSharedKey,
  encryptText,
  generateOwnKeys,
  hashText,
  pin,
} from "./crypto";
import testPinningKeys from "../../test-pinning-keys.json";

function bufferToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

describe("secure iframe crypto - hashText", () => {
  it("should hash text with SHA-256", async () => {
    const hashBytes = await hashText("Hello 1234567890");
    expect(bufferToHex(hashBytes)).toEqual(
      "2d4b05af4620b562ba9d4dd1bb26ae7bcc04aedcd67d4a740dcfeaf2010f3265",
    );
  });
});

describe("secure iframe crypto - generateOwnKeys", () => {
  it("should generate an ECDH key", async () => {
    const key = await generateOwnKeys();
    expect(key).toEqual({
      privateKey: expect.any(CryptoKey),
      publicKey: expect.any(CryptoKey),
    });
  });
});

describe("secure iframe crypto - encryptText", () => {
  it("should encrypt text", async () => {
    const key = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    );
    const additionalData = crypto.getRandomValues(new Uint8Array(16));
    const bytes = await encryptText(
      "Hello, World!",
      key,
      additionalData.buffer,
    );
    // iv is random so we can't snapshot the output
    expect(bytes).toEqual({
      cipherTextBytes: expect.anything(),
      ivBytes: expect.anything(),
    });
  });
});

describe("secure iframe crypto - deriveSharedKey", () => {
  it("should generate an ECDH shared secret", async () => {
    const ownKey = await generateOwnKeys();
    const serverKeys = await generateOwnKeys();

    const sharedKey1 = await deriveSharedKey(
      ownKey,
      await crypto.subtle.exportKey("spki", serverKeys.publicKey),
      "info",
    );
    const sharedKey1Hex = bufferToHex(
      await crypto.subtle.exportKey("raw", sharedKey1),
    );

    const sharedKey2 = await deriveSharedKey(
      serverKeys,
      await crypto.subtle.exportKey("spki", ownKey.publicKey),
      "info",
    );
    const sharedKey2Hex = bufferToHex(
      await crypto.subtle.exportKey("raw", sharedKey2),
    );

    expect(sharedKey1Hex).toEqual(sharedKey2Hex);
  });
});

describe("secure iframe crypto - pin", () => {
  const signee = crypto.getRandomValues(new Uint8Array(64)).buffer;
  it("should not throw if signature does match ", async () => {
    const signingKey = await crypto.subtle.importKey(
      "jwk",
      testPinningKeys[0],
      {
        name: "ECDSA",
        namedCurve: "P-384",
      },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: "SHA-256",
      },
      signingKey,
      signee,
    );
    await pin(
      testPinningKeys.map((k) => {
        return { ...k, d: undefined };
      }),
      signature,
      signee,
    );
  });
  it("should throw if signature doesn't match ", async () => {
    await expect(async () => {
      await pin(
        testPinningKeys.map((k) => {
          return { ...k, d: undefined };
        }),
        crypto.getRandomValues(new Uint8Array(96)).buffer,
        signee,
      );
    }).rejects.toThrowError("Assertion failure");
  });
});
