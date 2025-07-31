import { html, render } from "lit-html";
import { ChannelForm, ChannelFormField } from "../forms-types";
import { SessionContext } from "./session-provider";
import { getContext } from "../context";
import { BffSession } from "../bff-types";

const IFRAME_FIELD_SRC = "https://localhost:4444/iframe.html";

/**
 * @example
 * <xendit-channel-form-field .field={ChannelFormField} />
 */
export class XenditChannelFormFieldComponent extends HTMLElement {
  static tag = "xendit-channel-form-field" as const;

  public field: ChannelFormField | null;

  constructor() {
    super();
    this.field = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this.field) {
      this.replaceChildren();
      return;
    }

    const session = getContext(this, SessionContext);
    if (!session) return;

    let id: string;
    if (typeof this.field.channel_property === "string") {
      id = `xendit-field-${this.field.channel_property ?? ""}`;
    } else {
      const keys = Object.keys(this.field.channel_property);
      id = `xendit-field-${keys.join("_")}`;
    }

    const label = html`
      <label for="${id}" class="xendit-text-14">
        ${this.field.label ?? ""}
      </label>
    `;

    render(
      html`
        ${label}
        ${this.renderField(id, session, this.field)}
      `,
      this
    );
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
      <iframe src="${iframeUrl.toString()}" />
    </div>
  `;
  }

  renderTextField(id: string, field: ChannelFormField) {
    return html`
    <input id="${id}" type="text" placeholder="${field.placeholder}" class="xendit-text-14" />
  `;
  }

  renderDropdownField(
    id: string,
    field: ChannelFormField & { type: { name: "generic_dropdown" } }
  ) {
    return html`
    <select id="${id}">
      ${field.type.options.map(
        (option) =>
          html`<option value="${option.value}">${option.label}</option>`
      )}
    </select>
  `;
  }
}
