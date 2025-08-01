import { html, render } from "lit-html";
import { ChannelFormField } from "../forms-types";
import { classMap } from "lit-html/directives/class-map.js";
import { XenditChannelFormFieldChanged } from "./channel-form-field";
import { ref } from "lit-html/directives/ref.js";
import { ChannelProperties, ChannelProperty } from "../public-data-types";

/**
 * @example
 * <xendit-channel-form />
 */
export class XenditChannelFormComponent extends HTMLElement {
  static tag = "xendit-channel-form" as const;

  public form: ChannelFormField[] = [];
  public formElement: Element | undefined = undefined;

  constructor() {
    super();

    this.addEventListener(
      XenditChannelFormFieldChanged.type,
      this.onAnyFieldChanged
    );
  }

  connectedCallback() {
    this.render();
  }

  setFormElement = (element: Element | undefined) => {
    this.formElement = element;
  };

  onAnyFieldChanged = (event: XenditChannelFormFieldChanged) => {
    if (!this.formElement) return;
    this.dispatchEvent(
      new XenditChannelPropertiesChanged(this.getChannelProperties())
    );
  };

  getChannelProperties() {
    // FormData gives the nodejs version, but we need the browser version
    const formData = new (FormData as any)(this.formElement as HTMLFormElement);

    const obj: ChannelProperties = {};

    /*
    Convert form key/value pairs to channel properties
    .e.g 
    Input:
    {
      "k": "v1",
      "a.b.c": "v2",
      "z.z__a.y": ["v3", "v3"],
    }
    Output:
    {
      k: "v1",
      a: { b: { c: "v2", }, },
      z: { z: "v3", y: "v4" },
    }
  
    */

    for (const [key, value] of formData.entries()) {
      const subkeys = key.split("__");
      // split keys by __
      for (const subkey of subkeys) {
        // split key by dot, for each part, traverse the object
        // and assign the value at the end
        const parts = subkey.split(".");
        let cursor = obj;
        while (parts.length > 1) {
          const part = parts.shift()!;
          let selected = cursor[part];
          if (selected === undefined) {
            selected = cursor[part] = {};
          }
          if (
            selected &&
            typeof selected === "object" &&
            !Array.isArray(selected)
          ) {
            cursor = selected;
          }
        }
        // TODO: handle array
        cursor[parts[0]] = value;
      }
    }

    return obj;
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

    const filteredFieldGroups = fieldGroups.filter((group) => group.length);

    render(
      html`
        <form ${ref(this.setFormElement)}>
          ${filteredFieldGroups.map((fieldGroup) => {
            return html`
              <div class="xendit-form-field-group">
                ${fieldGroup.map((field) => {
                  const classes = classMap({
                    [`xendit-form-field-span-${field.span}`]: true
                  });

                  return html`
                    <xendit-channel-form-field
                      .field="${field}"
                      class="${classes}"
                    ></xendit-channel-form-field>
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

export class XenditChannelPropertiesChanged extends Event {
  static type = "xendit-channel-properties-changed" as const;

  public channelProperties: ChannelProperties;

  constructor(channelProperties: ChannelProperties) {
    super("xendit-channel-properties-changed", {
      bubbles: true,
      composed: true
    });
    this.channelProperties = channelProperties;
  }
}
