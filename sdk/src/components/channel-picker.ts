import { html, render } from "lit-html";
import { getContext } from "../context";
import { PaymentMethodGroupsContext } from "./session-provider";

/**
 * @example
 * <xendit-channel-picker/>
 */
export class XenditChannelPickerComponent extends HTMLElement {
  static tag = "xendit-channel-picker" as const;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const paymentMethodGroups = getContext(this, PaymentMethodGroupsContext);
    if (!paymentMethodGroups) return;

    render(
      html`
        <xendit-accordion>
          ${paymentMethodGroups.map((group) => {
            return html`
              <xendit-accordion-item
                title="${group.group_label}"
                icon="${group.group_icon}"
              >
                <xendit-channel-picker-group
                  .group="${group}"
                ></xendit-channel-picker-group>
              </xendit-accordion-item>
            `;
          })}
        </xendit-accordion>
      `,
      this
    );
  }
}
