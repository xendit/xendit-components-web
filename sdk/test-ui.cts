/*
This must be a single file with no imports.
*/

const div = document.createElement("div");
div.id = "channel-picker-container";
document.body.appendChild(div);

const sdk = (window as any).XenditSdk as typeof import("./src/public-sdk");
const inst = await sdk.initializeTestSession({
  sessionClientKey: "1234"
});
const channelPicker = inst.createChannelPickerComponent();
document.getElementById("channel-picker-container")!.appendChild(channelPicker);
