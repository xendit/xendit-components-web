export function assert(value: unknown, iframeErrorCode: string): asserts value {
  if (!value) {
    const err = new Error("Assertion failure");
    (err as unknown as { code: string }).code = iframeErrorCode;
    throw err;
  }
}

export function base64ToArrayBuffer(base64: string) {
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

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const textEncoder = new TextEncoder();

export function stringToUtf8Bytes(str: string): Uint8Array<ArrayBuffer> {
  return textEncoder.encode(str);
}
