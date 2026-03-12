// Must be the first import
import "preact/debug";
import "preact/devtools";

import { createStyles } from "./styles";
import { setupPreactBatch } from "./preact-batch";

if (typeof window === "undefined" || typeof document === "undefined") {
  // do not run browser initialization in node env
} else {
  setupPreactBatch();
  createStyles();
}

export * from "./public-sdk";
export * from "./public-event-types";
export * from "./public-options-types";
export * from "./public-data-types";
