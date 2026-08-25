// The in-flight/resolved Promise, null means loading hasn't started yet.
let libphonenumberPromise: Promise<typeof import("libphonenumber-js")> | null =
  null;

// The resolved module, null until loading finishes.
let libphonenumberModule: typeof import("libphonenumber-js") | null = null;

// Starts loading without waiting.
export function preloadLibphonenumber(): void {
  if (libphonenumberPromise !== null) return;
  libphonenumberPromise = import("libphonenumber-js").then((mod) => {
    libphonenumberModule = mod;
    return mod;
  });
}

// Waits for the module, triggering the load first if it hasn't started.
export async function getLibphonenumber(): Promise<
  typeof import("libphonenumber-js")
> {
  preloadLibphonenumber();
  return libphonenumberPromise!;
}

// Synchronous check: returns the module once loaded, otherwise null.
export function getLoadedLibphonenumber():
  | typeof import("libphonenumber-js")
  | null {
  return libphonenumberModule;
}
