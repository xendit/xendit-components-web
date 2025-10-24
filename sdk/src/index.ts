// Must be the first import (TODO: remove from prod build)
import "preact/debug";
import "preact/devtools";

import { createIconSet } from "./components/icon";
import { createStyles } from "./styles";

createStyles();
createIconSet();

export * from "./public-sdk";
export * from "./public-event-types";
export * from "./public-options-types";
export * from "./public-data-types";
