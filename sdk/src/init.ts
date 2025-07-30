import {
  XenditAccordionComponent,
  XenditAccordionItemClickedEvent
} from "./components/accordion";
import { XenditAccordionItemComponent } from "./components/accordion-item";
import { XenditChannelPickerComponent } from "./components/channel-picker";
import { XenditChannelPickerGroupComponent } from "./components/channel-picker-group";
import { XenditIconComponent } from "./components/icon";
import { XenditSessionContextProvider } from "./components/session-provider";
import { XenditContextRequestEvent } from "./context";
import { createCssVariable, registerElement } from "./dom-utils";
import { colorTokens } from "./style-tokens";
import { camelCaseToKebabCase } from "./utils";

/**
 * @public
 */
declare global {
  interface HTMLElementTagNameMap {
    // public elements
    "xendit-session-context-provider": XenditSessionContextProvider;
    "xendit-channel-picker": XenditChannelPickerComponent;

    // sub-components
    "xendit-channel-picker-group": XenditChannelPickerGroupComponent;

    // ui widgets
    "xendit-accordion": XenditAccordionComponent;
    "xendit-accordion-item": XenditAccordionItemComponent;
    "xendit-icon": XenditIconComponent;
  }

  interface HTMLElementEventMap {
    "xendit-accordion-item-clicked": XenditAccordionItemClickedEvent;
    "xendit-context-request": XenditContextRequestEvent<any>;
  }
}

for (const el of [
  XenditSessionContextProvider,
  XenditAccordionComponent,

  XenditAccordionItemComponent,

  XenditChannelPickerComponent,
  XenditChannelPickerGroupComponent,
  XenditIconComponent
]) {
  registerElement(el);
}

for (const [k, v] of Object.entries(colorTokens)) {
  createCssVariable(`--xendit-color-${camelCaseToKebabCase(k)}`, v);
}

export {};
