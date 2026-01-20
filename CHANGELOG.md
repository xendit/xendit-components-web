# 0.0.8

Features:

- Disable channels other than CARDS
- Support searching channels by channel code to getActiveChannels
- Allow the module to be imported in Node.js (the XenditComponents constructor still throws in Node.js)
- In mock mode, mock channels use an appropriate action based on the channel type (previously all mock channels used iframe actions)
- Improve the layout of the default action container component and the mock iframe action

Bugfixes:

- Fix bug where channel picker sometimes collapses the cards group while typing a card number
- Rename sessionClientKey to componentsSdkKey
- Fix missing types in the .d.ts file

# 0.0.7

Initial release.

This release contains credit card payment and tokenization flows.

```typescript
const components: XenditComponents = new XenditComponents({
  sessionClientKey: componentsSdkKeyFromYourServer,
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
