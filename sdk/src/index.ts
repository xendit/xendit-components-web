import "./init";
import css from "./styles.css";

document.head.appendChild(
  Object.assign(document.createElement("style"), {
    textContent: css
  })
);

export * from "./public-sdk";
export * from "./public-event-types";
export * from "./public-options-types";
export * from "./public-data-types";
