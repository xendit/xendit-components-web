export function assert<T>(arg: any): asserts arg is NonNullable<T> {
  if (arg === null || arg === undefined) {
    throw new Error("Assertion failed: argument is null or undefined");
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function camelCaseToKebabCase(str: string): string {
  return str
    .split(/(?=([A-Z]))/gm)
    .map((part) => part.toLowerCase())
    .join("-");
}
