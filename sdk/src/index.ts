// Must be the first import
import "preact/debug";
import "preact/devtools";

import { createIconSet } from "./components/icon";
import { createStyles } from "./styles";

if (typeof window === "undefined" || typeof document === "undefined") {
  // do not run browser initialization in node env
} else {
  createStyles();
  createIconSet();
}

export * from "./public-sdk";
export * from "./public-event-types";
export * from "./public-options-types";
export * from "./public-data-types";
