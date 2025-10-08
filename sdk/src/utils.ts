export function assert<T>(arg: unknown): asserts arg is NonNullable<T> {
  if (arg === null || arg === undefined) {
    throw new Error("Assertion failed: argument is null or undefined");
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function camelCaseToKebabCase(str: string): string {
  return str.replace(/[A-Z]/gm, (match, offset) => {
    if (offset === 0) return match.toLowerCase();
    return `-${match.toLowerCase()}`;
  });
}
