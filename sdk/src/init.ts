import {
  XenditAccordionComponent,
  XenditAccordionItemClickedEvent
} from "./components/accordion";
import { XenditAccordionItemComponent } from "./components/accordion-item";
import { XenditChannelFormComponent } from "./components/channel-form";
import {
  XenditChannelFormFieldChanged,
  XenditChannelFormFieldComponent
} from "./components/channel-form-field";
import { XenditChannelPickerComponent } from "./components/channel-picker";
import { XenditChannelPickerGroupComponent } from "./components/channel-picker-group";
import { XenditIconComponent } from "./components/icon";
import { XenditPaymentChannelComponent } from "./components/payment-channel";
import { XenditSessionContextProvider } from "./components/session-provider";
import { XenditContextRequestEvent } from "./context";
import { registerElement } from "./dom-utils";

/**
 * @public
 */
declare global {
  interface HTMLElementTagNameMap {
    // public elements
    "xendit-session-context-provider": XenditSessionContextProvider;
    "xendit-channel-picker": XenditChannelPickerComponent;
    "xendit-payment-channel": XenditPaymentChannelComponent;

    // sub-components
    "xendit-channel-picker-group": XenditChannelPickerGroupComponent;
    "xendit-channel-form": XenditChannelFormComponent;
    "xendit-channel-form-field": XenditChannelFormFieldComponent;

    // ui widgets
    "xendit-accordion": XenditAccordionComponent;
    "xendit-accordion-item": XenditAccordionItemComponent;
    "xendit-icon": XenditIconComponent;
  }

  interface HTMLElementEventMap {
    "xendit-context-request": XenditContextRequestEvent<any>;
    "xendit-accordion-item-clicked": XenditAccordionItemClickedEvent;
    "xendit-channel-form-field-changed": XenditChannelFormFieldChanged;
  }
}

for (const el of [
  XenditSessionContextProvider,
  XenditChannelPickerComponent,
  XenditPaymentChannelComponent,

  XenditChannelPickerGroupComponent,
  XenditChannelFormComponent,
  XenditChannelFormFieldComponent,

  XenditAccordionComponent,
  XenditAccordionItemComponent,
  XenditIconComponent
]) {
  registerElement(el);
}

export {};
