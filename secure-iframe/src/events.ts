export class SecureInputEvent extends Event {
  static type: "secureinputevent";
  subtype: "change" | "focus" | "blur";
  detail: {
    value?: string;
  };
  constructor(
    subtype: "change" | "focus" | "blur",
    detail: { value?: string } = {}
  ) {
    super("secureinputevent", {
      bubbles: true,
      composed: true
    });
    this.subtype = subtype;
    this.detail = detail;
  }
}

export function assertIsSecureInputEvent(
  event: Event
): asserts event is SecureInputEvent {
  if (event.type !== "secureinputevent") {
    throw new Error("Expected secureinputevent");
  }
}
