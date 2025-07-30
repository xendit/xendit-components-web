import {
  BffBusiness,
  BffCustomer,
  BffPaymentMethod,
  BffPaymentMethodGroup,
  BffResponse,
  BffSession
} from "../bff-types";
import { createContext, provideContext } from "../context";

export const SessionContext = createContext<BffSession>(Symbol("session"));
export const BusinessContext = createContext<BffBusiness>(Symbol("business"));
export const CustomerContext = createContext<BffCustomer>(Symbol("customer"));
export const PaymentMethodsContext = createContext<BffPaymentMethod[]>(
  Symbol("payment-methods")
);
export const PaymentMethodGroupsContext = createContext<
  BffPaymentMethodGroup[]
>(Symbol("payment-methods-groups"));

export class XenditSessionContextProvider extends HTMLElement {
  static tag = "xendit-session-context-provider" as const;

  private providers = {
    session: provideContext(this, SessionContext),
    business: provideContext(this, BusinessContext),
    customer: provideContext(this, CustomerContext),
    paymentMethods: provideContext(this, PaymentMethodsContext),
    paymentMethodGroups: provideContext(this, PaymentMethodGroupsContext)
  };

  constructor() {
    super();
  }

  setContextData(data: BffResponse) {
    this.providers.session.set(data.session);
    this.providers.business.set(data.business);
    this.providers.customer.set(data.customer);
    this.providers.paymentMethods.set(data.payment_methods);
    this.providers.paymentMethodGroups.set(data.payment_methods_groups);
  }
}
