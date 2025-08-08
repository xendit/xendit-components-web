/*
This must be a single file with no imports.
*/

import type { XenditReadyToSubmitEvent } from "./src/public-event-types";

const outer = document.createElement("div");
outer.id = "wrapper";
outer.style.display = "grid";
outer.style.gridTemplateColumns = "1fr 1fr";
outer.style.gridGap = "16px";
document.body.appendChild(outer);

const channelPickerDiv = document.createElement("div");
channelPickerDiv.id = "channel-picker-container";
outer.appendChild(channelPickerDiv);

const controlsDiv = document.createElement("div");
controlsDiv.id = "controls";
outer.appendChild(controlsDiv);

const outputChannelProperties = document.createElement("textarea");
outputChannelProperties.style.width = "100%";
outputChannelProperties.setAttribute("rows", "20");
controlsDiv.appendChild(outputChannelProperties);

const clearButton = document.createElement("button");
clearButton.textContent = "Clear Output";
controlsDiv.appendChild(clearButton);
clearButton.addEventListener("click", () => {
  outputChannelProperties.value = "";
});

const submitButton = document.createElement("button");
submitButton.textContent = "Submit";
controlsDiv.appendChild(submitButton);

const { initializeTestSession } = (window as any)
  .XenditSdk as typeof import("./src/public-sdk");
const sdk = await initializeTestSession({
  sessionClientKey: "1234"
});
const channelPicker = sdk.createChannelPickerComponent();
document.getElementById("channel-picker-container")!.appendChild(channelPicker);

function logEvent(event: Event) {
  const { type, isTrusted, ...rest } = event;
  outputChannelProperties.value += JSON.stringify({
    type,
    ...rest
  });
  outputChannelProperties.value += "\n";
}

sdk.addEventListener("ready-to-submit", logEvent);
sdk.addEventListener("session-complete", logEvent);
sdk.addEventListener("session-failed", logEvent);
sdk.addEventListener("user-action-complete", logEvent);
sdk.addEventListener("user-action-required", logEvent);
sdk.addEventListener("will-redirect", logEvent);
sdk.addEventListener("error", logEvent);

sdk.addEventListener("ready-to-submit", (event: XenditReadyToSubmitEvent) => {
  const state = sdk.getState();
  outputChannelProperties.value += JSON.stringify(state);
  outputChannelProperties.value += "\n";
});

submitButton.addEventListener("click", () => {
  sdk.submit();
});
