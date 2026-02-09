/*
This must be a single file with no imports.
*/

const LOCALSTORAGE_KEY = "test_ui_components_sdk_key";

// document.documentElement.style.setProperty(
//   "--xendit-qr-foreground-color",
//   "#1762ee",
// );
// document.documentElement.style.setProperty(
//   "--xendit-qr-background-color",
//   "#fafafa",
// );
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

const sdkKeyInput = document.createElement("textarea");
sdkKeyInput.placeholder =
  "Paste components_sdk_key and reload (leave blank to use mock)";
sdkKeyInput.style.width = "100%";
sdkKeyInput.style.whiteSpace = "nowrap";
sdkKeyInput.setAttribute("rows", "1");
sdkKeyInput.oninput = (e) => {
  const target = e.target as HTMLTextAreaElement;
  localStorage.setItem(LOCALSTORAGE_KEY, target.value.trim());
};
sdkKeyInput.onkeypress = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    location.reload();
  }
};
controlsDiv.appendChild(sdkKeyInput);

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

const abortButton = document.createElement("button");
abortButton.textContent = "Abort";
controlsDiv.appendChild(abortButton);

const simulateButton = document.createElement("button");
simulateButton.textContent = "Simulate Payment";
controlsDiv.appendChild(simulateButton);

const { XenditComponents, XenditComponentsTest } = (
  window as unknown as { Xendit: typeof import("./src/public-sdk") }
).Xendit;

let components: import("./src/public-sdk").XenditComponents;
const iframeFieldAppearance: import("./src/public-options-types").IframeAppearanceOptions =
  {
    // inputStyles: {
    //   color: "red",
    // },
    // placeholderStyles: {
    //   color: "blue",
    // },
    fontFace: {
      source: `url(https://assets.xendit.co/payment-session/fonts/proxima-nova/proximanova_regular.ttf) format('woff2')`,
      descriptors: {
        display: "swap",
      },
    },
  };
const savedKey = localStorage.getItem(LOCALSTORAGE_KEY);
if (savedKey) {
  sdkKeyInput.value = savedKey;
  components = new XenditComponents({
    componentsSdkKey: savedKey,
    iframeFieldAppearance,
  });
} else {
  components = new XenditComponentsTest({
    iframeFieldAppearance,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).sdk = components;

const channelPicker = components.createChannelPickerComponent();
document.getElementById("channel-picker-container")!.appendChild(channelPicker);

function logEvent(event: Event) {
  const { type, isTrusted, ...rest } = event;
  outputEventLog.value += JSON.stringify({
    type,
    ...rest,
  });
  outputEventLog.value += "\n";
}

components.addEventListener("init", logEvent);

components.addEventListener("submission-ready", logEvent);
components.addEventListener("submission-not-ready", logEvent);

components.addEventListener("submission-begin", logEvent);
components.addEventListener("submission-end", logEvent);
components.addEventListener("action-begin", (event) => {
  logEvent(event);
  // if (components.getCurrentChannel()?.channelCode === "MOCK_QR") {
  //   const element = components.createActionContainerComponent({
  //     qrCode: {
  //       qrCodeOnly: true,
  //     },
  //   });
  //   element.style.width = "400px";
  //   document.body.appendChild(element);
  // }
});
components.addEventListener("action-end", logEvent);
components.addEventListener("will-redirect", logEvent);

components.addEventListener("session-complete", logEvent);
components.addEventListener("session-expired-or-canceled", logEvent);

components.addEventListener("payment-request-created", logEvent);
components.addEventListener("payment-request-discarded", logEvent);

components.addEventListener("payment-token-created", logEvent);
components.addEventListener("payment-token-discarded", logEvent);

components.addEventListener("fatal-error", logEvent);

setInterval(() => {
  const internalState = components.getState();
  const { world, channel, dispatchEvent, sdk, ...bbFlags } =
    internalState.behaviorTree.bb;
  outputChannelPropertiesLog.value = JSON.stringify(
    {
      selectedChannel: internalState.channelCode,
      ...bbFlags,
    },
    null,
    2,
  );
  outputBehaviorTree.value = stringifyBehaviorTree(
    internalState.behaviorTree.root,
    1,
  );
}, 50);

type TreeNode = { impl: { name: string }; child: TreeNode } | null | undefined;
function stringifyBehaviorTree(tree: TreeNode, depth: number): string {
  if (!tree) {
    return "";
  }
  return (
    "-".repeat(depth) +
    " " +
    tree.impl.name +
    "\n" +
    stringifyBehaviorTree(tree?.child, depth + 1)
  );
}

submitButton.addEventListener("click", () => {
  components.submit();
});

abortButton.addEventListener("click", () => {
  components.abortSubmission();
});

simulateButton.addEventListener("click", () => {
  components.simulatePayment();
});
