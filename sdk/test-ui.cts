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

const outputEventLog = document.createElement("textarea");
outputEventLog.style.width = "100%";
outputEventLog.setAttribute("rows", "10");
controlsDiv.appendChild(outputEventLog);

const outputChannelPropertiesLog = document.createElement("textarea");
outputChannelPropertiesLog.style.width = "100%";
outputChannelPropertiesLog.setAttribute("rows", "10");
controlsDiv.appendChild(outputChannelPropertiesLog);

const outputBehaviorTree = document.createElement("textarea");
outputBehaviorTree.style.width = "100%";
outputBehaviorTree.setAttribute("rows", "10");
controlsDiv.appendChild(outputBehaviorTree);

const clearButton = document.createElement("button");
clearButton.textContent = "Clear Output";
controlsDiv.appendChild(clearButton);
clearButton.addEventListener("click", () => {
  controlsDiv.querySelectorAll("textarea").forEach((ta) => {
    ta.value = "";
  });
});

const submitButton = document.createElement("button");
submitButton.textContent = "Submit";
controlsDiv.appendChild(submitButton);

const { XenditSessionTestSdk } = (
  window as unknown as { XenditSdk: typeof import("./src/public-sdk") }
).XenditSdk;

const sdk = new XenditSessionTestSdk({
  sessionClientKey: "1234",
});
sdk.env = "local";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).sdk = sdk;

const channelPicker = sdk.createChannelPickerComponent();
document.getElementById("channel-picker-container")!.appendChild(channelPicker);

function logEvent(event: Event) {
  const { type, isTrusted, ...rest } = event;
  outputEventLog.value += JSON.stringify({
    type,
    ...rest,
  });
  outputEventLog.value += "\n";
}

sdk.addEventListener("init", logEvent);

sdk.addEventListener("ready", logEvent);
sdk.addEventListener("not-ready", logEvent);

sdk.addEventListener("action-begin", logEvent);
sdk.addEventListener("action-end", logEvent);
sdk.addEventListener("will-redirect", logEvent);

sdk.addEventListener("session-complete", logEvent);
sdk.addEventListener("session-failed", logEvent);

sdk.addEventListener("error", logEvent);

setInterval(() => {
  const internalState = sdk.getState();
  outputChannelPropertiesLog.value = `Selected Channel: ${internalState.channelCode}
Channel Properties: ${JSON.stringify(internalState.channelProperties, null, 2)}`;
  outputBehaviorTree.value = stringifyBehaviorTree(
    internalState.behaviorTree,
    1,
  );
}, 200);

type TreeNode = { impl: { name: string }; child: TreeNode } | null | undefined;
function stringifyBehaviorTree(tree: TreeNode, depth: number): string {
  return (
    "-".repeat(depth) +
    " " +
    (tree
      ? tree.impl.name + "\n" + stringifyBehaviorTree(tree?.child, depth + 1)
      : "(no child)")
  );
}

submitButton.addEventListener("click", () => {
  sdk.submit();
});
