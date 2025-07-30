import { html, render } from "lit-html";
import { getContext } from "../context";
import { assert } from "../utils";
import { PaymentMethodsContext } from "./session-provider";

type TemplateProps = {
  groups: {
    title: string;
    icon: string;
    id: string;
  }[];
};

function channelPickerTemplate({ groups }: TemplateProps) {
  return html`
    <xendit-accordion>
      ${groups.map((group) => {
        return html`
        <xendit-accordion-item title=${group.title} icon=${group.icon}>
          <xendit-channel-picker-group group-id=${group.id} />
        </xendit-accordion-item>
        `;
      })}
    </xendit-accordion>
  `;
}

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
    const paymentMethods = getContext(this, PaymentMethodsContext);
    assert(paymentMethods);

    render(
      channelPickerTemplate({
        groups: paymentMethods.paymentMethods.map((group) => ({
          title: "Group title",
          icon: "group-icon",
          id: group.channel_code
        }))
      }),
      this
    );
  }
}
