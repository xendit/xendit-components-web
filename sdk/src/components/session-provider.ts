import {
  BffBusiness,
  BffCustomer,
  BffPaymentMethod,
  BffResponse,
  BffSession
} from "../bff-types";
import { createContext, provideContext } from "../context";

export const SessionContext = createContext<BffSession>("session");
export const BusinessContext = createContext<BffBusiness>("business");
export const CustomerContext = createContext<BffCustomer>("customer");
export const PaymentMethodsContext = createContext<{
  paymentMethods: BffPaymentMethod[];
}>("payment-methods");

export class XenditSessionContextProvider extends HTMLElement {
  static tag = "xendit-session-context-provider" as const;

  private providers = {
    session: provideContext(this, SessionContext),
    business: provideContext(this, BusinessContext),
    customer: provideContext(this, CustomerContext),
    paymentMethods: provideContext(this, PaymentMethodsContext)
  };

  constructor() {
    super();
  }

  setContextData(data: BffResponse) {
    this.providers.session.set(data.session);
    this.providers.business.set(data.business);
    this.providers.customer.set(data.customer);
    this.providers.paymentMethods.set({
      paymentMethods: data.payment_methods
    });
  }
}
