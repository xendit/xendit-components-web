import { html, render } from "lit-html";
import { ChannelFormField } from "../forms-types";
import { SessionContext } from "./session-provider";
import { getContext } from "../context";
import { BffSession } from "../bff-types";
import { ref } from "lit-html/directives/ref.js";
import { IframeEvent } from "../../../shared/shared";

const IFRAME_ORIGIN = "https://localhost:4444";
const IFRAME_FIELD_SRC = `${IFRAME_ORIGIN}/iframe.html`;

/**
 * @example
 * <xendit-channel-form-field .field={ChannelFormField} />
 */
export class XenditChannelFormFieldComponent extends HTMLElement {
  static tag = "xendit-channel-form-field" as const;

  public field: ChannelFormField | null;

  public iframeRef: Element | undefined;
  public iframeHiddenField: Element | undefined;
  public iframeEcdhPublicKey: string | undefined;

  constructor() {
    super();
    this.field = null;
  }

  connectedCallback() {
    this.render();

    window.addEventListener("message", this.handleEventFromIframe);
  }

  disconnectedCallback() {
    window.removeEventListener("message", this.handleEventFromIframe);
  }

  handleEventFromIframe = (event: MessageEvent) => {
    if (!this.iframeRef) return;

    const expectedSource = (this.iframeRef as HTMLIFrameElement).contentWindow;

    if (event.source !== expectedSource) {
      // this is normal, we are not the target of this message
      return;
    }

    const expectedOrigin = IFRAME_ORIGIN;
    if (event.origin !== expectedOrigin) {
      // this is not normal, something fishy is happening
      return;
    }

    const data = event.data as IframeEvent;
    switch (data.type) {
      case "ready": {
        this.iframeEcdhPublicKey = data.ecdhPublicKey;
        break;
      }
      case "change": {
        if (!this.iframeHiddenField) return;

        const encrypted = data.encrypted;
        const encryptionVersion = 1;
        const result = [
          "xendit-encrypted",
          encryptionVersion,
          this.iframeEcdhPublicKey,
          encrypted.iv,
          encrypted.value
        ].join("-");

        (this.iframeHiddenField as HTMLInputElement).value = result;
        this.dispatchEvent(new XenditChannelFormFieldChanged());
        break;
      }
      case "focus": {
        break;
      }
      case "blur": {
        break;
      }
      case "failed_init": {
        break;
      }
    }
  };

  setIframeElement = (element: Element | undefined) => {
    this.iframeRef = element;
  };

  setHiddenFieldElement = (element: Element | undefined) => {
    this.iframeHiddenField = element;
  };

  onChange = (event: Event) => {
    if (!this.field) return;

    this.dispatchEvent(new XenditChannelFormFieldChanged());
  };

  render() {
    if (!this.field) {
      this.replaceChildren();
      return;
    }

    const session = getContext(this, SessionContext);
    if (!session) return;

    let id: string;
    if (typeof this.field.channel_property === "string") {
      id = this.field.channel_property;
    } else {
      const keys = Object.values(this.field.channel_property);
      id = keys.join("__");
    }

    const label = html`
      <label for="${id}" class="xendit-text-14">
        ${this.field.label ?? ""}
      </label>
    `;

    render(html` ${label} ${this.renderField(id, session, this.field)} `, this);
  }

  renderField(id: string, session: BffSession, field: ChannelFormField) {
    switch (field.type.name) {
      case "credit_card_number":
      case "credit_card_expiry":
      case "credit_card_cvn":
        return this.renderIframeField(id, session, field);
      case "phone_number":
      case "email":
      case "street_address":
      case "postal_code":
      case "generic_numeric":
      case "generic_text":
        return this.renderTextField(id, field);
      case "generic_dropdown":
        return this.renderDropdownField(
          id,
          field as ChannelFormField & { type: { name: "generic_dropdown" } }
        );
    }
  }

  renderIframeField(id: string, session: BffSession, field: ChannelFormField) {
    const iframeUrl = new URL(IFRAME_FIELD_SRC);
    iframeUrl.searchParams.set("input_type", field.type.name);
    iframeUrl.searchParams.set("embedder", window.location.origin);
    iframeUrl.searchParams.set("session_id", session.payment_session_id);
    const keyParts = session.client_key.split("-");
    iframeUrl.searchParams.set("pk", keyParts[2]);
    iframeUrl.searchParams.set("sig", keyParts[3]);

    return html`
      <div class="xendit-iframe-container">
        <input
          type="hidden"
          name="${id}"
          value=""
          ${ref(this.setHiddenFieldElement)}
        />
        <iframe src="${iframeUrl.toString()}" ${ref(this.setIframeElement)} />
      </div>
    `;
  }

  renderTextField(id: string, field: ChannelFormField) {
    function isGeneric(field: ChannelFormField): field is ChannelFormField & {
      type: { name: "generic_text" | "generic_numeric" };
    } {
      return (
        field.type.name === "generic_text" ||
        field.type.name === "generic_numeric"
      );
    }

    return html`
      <input
        name="${id}"
        type="text"
        placeholder="${field.placeholder}"
        class="xendit-text-14"
        @input="${this.onChange}"
        minlength=${isGeneric(field) ? field.type.min_length : undefined}
        maxlength=${isGeneric(field) ? field.type.max_length : undefined}
      />
    `;
  }

  renderDropdownField(
    id: string,
    field: ChannelFormField & { type: { name: "generic_dropdown" } }
  ) {
    return html`
      <select name="${id}" @change="${this.onChange}">
        ${field.type.options.map(
          (option) =>
            html`<option value="${option.value}">${option.label}</option>`
        )}
      </select>
    `;
  }
}

export class XenditChannelFormFieldChanged extends Event {
  static type = "xendit-channel-form-field-changed" as const;

  constructor() {
    super("xendit-channel-form-field-changed", {
      bubbles: true,
      composed: true
    });
  }
}
