# Unreleased

Initial release.

This release contains credit card payment and tokenization flows.

```typescript
const sdk: XenditSessionSdk = new XenditSessionSdk({
  sessionClientKey: componentsSdkKeyFromYourServer,
});

const cardsChannel = sdk
  .getAvailablePaymentChannels()
  .find((channel) => channel.channelCode === "CARDS");
const channelPicker: HTMLElement =
  sdk.createPaymentComponentForChannel(cardsChannel);

myCheckoutPage.replaceChildren(channelPicker);

mySubmitButton.addEventListener("click", () => {
  sdk.submit();
});

sdk.addEventListener("session-complete", () => {
  alert("Payment Success");
});
sdk.addEventListener("session-expired-or-canceled", () => {
  alert("Payment cancelled or expired");
});
```
