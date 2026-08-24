# 0.0.28

### Notable

Enabled VA channels.

Added support for recovering from a page being restored from the bfcache (i.e. when we redirect to a partner but the user clicks the browser "back" button).

Action container contents are now destroyed after a delay to allow for fade out animations.

Added automatic retry for GET requests.

Added metrics gathering for merchant insights on the Xendit dashboard.

Improved browser autofill behavior.

Added new public method `redirectToReturnUrl()` to automatically redirect to the session's configured return URLs depending on the session status.

### Bug Fixes

- Fixed fallback redirect URL
- Fixed some confusing error messages

# 0.0.27

### Notable

Added "or" separator below the digital wallet buttons

### Bug Fixes

- Fixed input, textarea, select, and button text color to become `--xendit-color-text`
- Fixed Apple Pay button margins/sizing
- Fixed bug in the Simulate Scenario popover
- Change default credit card placeholder

# 0.0.26

### Notable

Added support for digital wallets. Google Pay and Apple Pay configured on the session are now rendered in the channel picker by default.

Added new Components API methods for digital wallets. Call `getActiveDigitalWallets()` to see which wallets are available on the session, then `createDigitalWalletComponent()` to render one. The buttons can be styled with `GooglePayButtonOptions` or `ApplePayButtonOptions`.

`enablePaylinks` is now a public option. It stays off by default, set it to `true` to opt in.

Card fields now show a loading placeholder while they start up, and an error message if they fail to load.

### Bug Fixes

- Fixed a caching bug in the secure iframe
- Updated the secure iframe Content-Security-Policy so `style-src` allows inline styles and `font-src` allows any `https` url
- Installment options are no longer offered on subscription sessions

# 0.0.25

### Notable

Added support for over the counter (OTC) channels.

Added support for resuming a payment after a redirect. When the customer returns to the `components_configuration.return_url` set on the session, re-initialize the SDK with the new `resume: true` option to continue the payment flow and show the result of the attempt. A new `submission-resume` event fires when the SDK resumes, followed by `session-complete` on success or `submission-end` on failure.

# 0.0.24

### Bug Fixes

- Removed BRI Direct Debit due to a crash in the MM/YY expiry field

# 0.0.23

### Notable

Added support for most channels supported by Xendit (all but over the counter channels).

Cards with a brand not in the merchant's allowed brands list now show a validation error.

Added NMID display on QRIS payment screen.

### Bug Fixes

- Now throws an error if initialized on a null origin page
- Fixed switching payment channels while a submission is in progress
- Fixed redirects after failing a payment in a redirect channel
- Fixed phone input area code width

# 0.0.22

### Notable

Added custom branded layouts for some QR channels.

### Bug fixes

# 0.0.21

### Bug Fixes

- Fixed missing card brand icons in card input

# 0.0.20

### Bug Fixes

- Fixed redirect after ewallet payment

# 0.0.19

### Notable

Added support for E-Wallet channels.

Added custom layouts for more QR screens.

# 0.0.18

### Notable

Simplified the QR action UI, added a custom branded layout for QRIS actions.

Improved the dropdown widget.

Improved the card simulation UI in test mode.

# 0.0.17

### Bug Fixes

- Fixed typescript import resolution

# 0.0.16

### Bug Fixes

- Fixed a bug where affirming payment in test mode does not trigger simulation request
- Fixed CJS/ESM import issues
- Fixed issues with phone number input

# 0.0.15

### Bug Fixes

- Fixed a bug where cards eligible for installments fails to pass validation due to empty string as channel property value

# 0.0.14

### Bug Fixes

- Fixed a bug in the publish workflow
- Fixed a bug where the channel picker dropdown was not disabled when there was only one channel

# 0.0.13

### Notable

Added support for QR channels (QRIS, QR_PH, PROMPTPAY, SGQR)

Added support for the installment selection UI in the Cards channel (only affects merchants with that feature enabled)

### Bug fixes

- Fixed bug where phone number field is not marked as touched on blur

# 0.0.12

### Bug fixes

- Fixed a bug where the credit card expiry field would not insert a slash if the user pasted the expiry date without a slash.
- Fixed poor UX when typing a slash in the credit card expiry field.
- Allow card expiry up to 2099

# 0.0.11

### Notable

Disabled Google Translate using the `translate=no` attribute as it causes issues.

Added new public method `pollImmediately` to immediently check for updates.

Changed the layout of the default action container.

### Bug fixes

- Fixed UX bugs in the dropdown widget.
- Prevent auto-updating the phone number country code if the user already typed a phone number.

# 0.0.10

### Bug fixes

Fixed npm publish.

# 0.0.9

### Bug fixes

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
