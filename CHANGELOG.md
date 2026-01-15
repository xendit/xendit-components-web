# Unreleased

Initial release.

This release contains credit card payment and tokenization flows.

```typescript
const components: XenditComponents = new XenditComponents({
  componentsSdkKey: componentsSdkKeyFromYourServer,
});

const cardsChannel = components.getActiveChannels("CARDS")[0];
const channelPicker: HTMLElement =
  components.createChannelComponent(cardsChannel);

myCheckoutPage.replaceChildren(channelPicker);

mySubmitButton.addEventListener("click", () => {
  components.submit();
});

components.addEventListener("session-complete", () => {
  alert("Payment Success");
});
components.addEventListener("session-expired-or-canceled", () => {
  alert("Payment cancelled or expired");
});
```
