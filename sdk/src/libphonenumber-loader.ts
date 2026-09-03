import { assert } from "./utils";
import type { LibphonenumberFacade } from "./libphonenumber-facade";

// The in-flight/resolved Promise, null means loading hasn't started yet.
let libphonenumberPromise: Promise<LibphonenumberFacade> | null = null;

// The resolved module, null until loading finishes.
let libphonenumberModule: LibphonenumberFacade | null = null;

// Starts loading without waiting.
export function preloadLibphonenumber(): void {
  if (libphonenumberPromise !== null) return;
  libphonenumberPromise = import("./libphonenumber-facade").then((mod) => {
    libphonenumberModule = mod.libphonenumberFacade;
    return mod.libphonenumberFacade;
  });
}

// Waits for the module, triggering the load first if it hasn't started.
export async function getLibphonenumber(): Promise<LibphonenumberFacade> {
  preloadLibphonenumber();
  return libphonenumberPromise!;
}

// Synchronous check: returns the module once loaded, otherwise null.
export function getLoadedLibphonenumber(): LibphonenumberFacade {
  assert(libphonenumberModule);
  return libphonenumberModule;
}
