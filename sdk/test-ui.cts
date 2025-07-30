/*
This must be a single file with no imports.
*/

document.body.innerHTML = `
  <div id="channel-picker-container" />
`;

const sdk = (window as any).XenditSdk as typeof import("./src/public-sdk");
const inst = await sdk.initializeTestSession({
  sessionClientKey: "1234"
});
const channelPicker = inst.createChannelPickerComponent();
document.getElementById("channel-picker-container")!.appendChild(channelPicker);
