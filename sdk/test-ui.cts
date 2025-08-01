/*
This must be a single file with no imports.
*/

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
outputChannelProperties.setAttribute("readonly", "");
controlsDiv.appendChild(outputChannelProperties);

const sdk = (window as any).XenditSdk as typeof import("./src/public-sdk");
const inst = await sdk.initializeTestSession({
  sessionClientKey: "1234"
});
const channelPicker = inst.createChannelPickerComponent();
document.getElementById("channel-picker-container")!.appendChild(channelPicker);

document
  .getElementById("channel-picker-container")!
  .addEventListener("xendit-channel-properties-changed", (event: Event) => {
    outputChannelProperties.value = JSON.stringify(
      (event as any).channelProperties,
      null,
      2
    );
  });
