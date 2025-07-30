import { html, render } from "lit-html";
import { getContext } from "../context";
import { assert } from "../utils";
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
    assert(paymentMethodGroups);

    const groups: {
      title: string;
      icon: string;
      id: string;
    }[] = paymentMethodGroups.map((group) => {
      return {
        title: group.group_label,
        icon: group.group_icon,
        id: group.pm_type
      };
    });

    render(
      html`
      <xendit-accordion>
        ${groups.map((group) => {
          return html`
          <xendit-accordion-item title="${group.title}" icon="${group.icon}">
            <xendit-channel-picker-group group-id="${group.id}"></xendit-channel-picker-group>
          </xendit-accordion-item>
          `;
        })}
      </xendit-accordion>
      `,
      this
    );
  }
}
