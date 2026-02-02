# Unreleased

No unreleased changes.

# 0.0.11

### Notable

Added support for installment plan selector in channel forms.

Disabled Google Translate using the `translate=no` attribute as it causes issues.

Added new public method `pollImmediately` to immediently check for updates.

Changed the layout of the default action container.

## Bug fixes

- Fixed UX bugs in the dropdown widget.
- Prevent auto-updating the phone number country code if the user already typed a phone number.

# 0.0.10

## Bug fixes

Fixed npm publish.

# 0.0.9

## Bug fixes

Missing `.d.ts` file is restored.

# 0.0.8

### Notable

- Channels other than `"CARDS"` are disabled for the initial release.
- `sessionClientKey` is renamed to `componentsSdkKey`

### New features

Support searching channels by channel code to `getActiveChannels`:

```typescript
const cardsComponent = components.getActiveChannels({ filter: "CARDS" })[0];
```

The layout of the default action container component and the mock iframe action have been improved.

### Bug fixes

- Prevent channel picker from sometimes collapsing the cards group while typing a card number
- Fix missing types in the `.d.ts` file
- In mock mode, mock channels now use an appropriate action type based on their channel type
- The module can now be imported in Node.js. It asserts it's running on a browser in the `XenditComponents` constructor instead.

# 0.0.7

Initial release.

This release contains credit card payment and tokenization flows.

```typescript
const components: XenditComponents = new XenditComponents({
  componentsSdkKey: componentsSdkKeyFromYourServer,
});

const cardsChannel = components.getActiveChannels({ filter: "CARDS" })[0];
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
