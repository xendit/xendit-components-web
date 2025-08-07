import { createIconSet } from "./components/icon";
import css from "./styles.css";

document.head.appendChild(
  Object.assign(document.createElement("style"), {
    textContent: css
  })
);
document.head.appendChild(createIconSet());

export * from "./public-sdk";
export * from "./public-event-types";
export * from "./public-options-types";
export * from "./public-data-types";
