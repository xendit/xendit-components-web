import { describe, expect, it } from "vitest";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  stringToUtf8Bytes,
} from "./utils";

describe("secure iframe utils - base64ToArrayBuffer", () => {
  it("should convert a base64 string to bytes", () => {
    const base64 = btoa("\0\0\0\0");
    const arrayBuffer = base64ToArrayBuffer(base64);
    const bytes = new Uint8Array(arrayBuffer);
    expect(bytes).toEqual(new Uint8Array([0, 0, 0, 0]));
  });
});

describe("secure iframe utils - arrayBufferToBase64", () => {
  it("should convert bytes to a base64 string", () => {
    const bytes = new Uint8Array([0, 0, 0, 0]);
    const str = arrayBufferToBase64(bytes.buffer);
    expect(str).toEqual(btoa("\0\0\0\0"));
  });
});

describe("secure iframe utils - stringToUtf8Bytes", () => {
  it("should convert string to bytes", () => {
    expect(stringToUtf8Bytes("Hello").toString()).toEqual(
      new Uint8Array([72, 101, 108, 108, 111]).toString(),
    );
  });
});
