import { html, render } from "lit-html";
import { ChannelForm, ChannelFormField } from "../forms-types";
import { classMap } from "lit-html/directives/class-map.js";

/**
 * @example
 * <xendit-channel-form />
 */
export class XenditChannelFormComponent extends HTMLElement {
  static tag = "xendit-channel-form" as const;

  public form: ChannelForm = [];

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const fieldGroups: ChannelFormField[][] = [[]];
    for (const field of this.form) {
      if (
        field.span === 1 &&
        fieldGroups[fieldGroups.length - 1].length === 1 &&
        fieldGroups[fieldGroups.length - 1][0].span === 1
      ) {
        // join two half-width fields into one group
        fieldGroups[fieldGroups.length - 1].push(field);
        continue;
      }

      if (field.join) {
        // if the field should be explicitly joined, add it to the last group
        fieldGroups[fieldGroups.length - 1].push(field);
        continue;
      }

      // otherwise, start a new group
      fieldGroups.push([field]);
    }

    render(
      html`
      <form>
        ${fieldGroups
          .filter((group) => group.length)
          .map((fieldGroup) => {
            return html`
            <div class="xendit-form-field-group">
              ${fieldGroup.map((field) => {
                const classes = classMap({
                  [`xendit-form-field-span-${field.span}`]: true
                });

                return html`
                  <xendit-channel-form-field .field="${field}" class="${classes}"></xendit-channel-form-field>
                `;
              })}
            </div>
          `;
          })}
      </form>
      `,
      this
    );
  }
}
