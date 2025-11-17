# xendit-components-web

The Xendit Components SDK allows you to accept payments directly on your website using the Xendit Sessions API.

This SDK's role is to take a Session (created on your server using the Xendit Sessions API) and render a payment UI, and allow you to customize the UI to match your site's look & feel.

## Installation

Install using npm:

```sh
npm install xendit-components-web --save
```

Or load it directly from our CDN:

```html
<script src="TBD"></script>
```

## Sessions

The Xendit Session API is an abstraction over the Xendit Payments API, representing one transaction (or tokenization). Using one session, a user can make any number
of attempts to pay, one of which can be successful. A successful payment completes the session.

Sessions also abstract away any differences between channels, allowing you to write once, and accept payments from any channel Xendit supports.

Two types of sessions are available:

- `PAY` sessions collect a payment and optionally save a payment token for later use
- `SAVE` sessions save a payment token

## Quick Start

First, initialize the SDK either with either:

- `XenditSessionTestSdk` for frontend development or unit tests
- `XenditSessionSdk`, for production, which requires a `sessionClientKey`, which comes from the Session object, which you need to create on your server. Make an endpoint that creates a session for the user's current transaction, return the `session_sdk_key` to the client, and pass it into the constructor.

```typescript
// For frontend development, use XenditSessionTestSdk
const sdk: XenditSessionSdk = new XenditSessionTestSdk({});
// For production or e2e testing, use XenditSessionSdk, passing in the session_sdk_key from the Session object
// const sdk: XenditSessionSdk = new XenditSessionSdk({ sessionClientKey });

// Create a channel picker component
const channelPicker: HTMLElement = sdk.createChannelPickerComponent();

// Insert the channel picker into your document
myCheckoutPage.replaceChildren(channelPicker);

// Call submit() when the user clicks your submit button
mySubmitButton.addEventListener("click", () => {
  sdk.submit();
});

// Listen to the status of the session
sdk.addEventListener("session-complete", () => {
  alert("Payment Success");
});
sdk.addEventListener("session-expired-or-canceled", () => {
  alert("Payment cancelled or expired");
});
```

## Examples

We provide example code for:

## SDK API

### `XenditSessionSdk` and `XenditSessionTestSdk`

The constructor.

For production and e2e testing, you need to pass the `sessionClientKey`, which you can get when you create a Session on your server.

For development and unit testing, use `XenditSessionTestSdk`, which uses mock data and doesn't connect to Xendit servers.

### `createChannelPickerComponent`

```typescript
const htmlElement = sdk.createChannelPickerComponent();
myContainer.replaceChildren(htmlElement);
```

Creates a UI for the user to select a payment channel and fill any required information.

This returns a `HTMLElement`, which you need to insert into your document.

This method uses caching, it will always return the same channel picker element.
Changing the active channel will update the channel picker UI, even if it's unmounted.
If you don't want this, use `destroyComponent.`

### `getAvailablePaymentChannels`

```typescript
const channels = sdk.getAvailablePaymentChannels();
```

Returns the list of channels available in this session.

### `getAvailablePaymentChannelGroups`

```typescript
const groups = sdk.getAvailablePaymentChannelGroups();
```

Returns a list of channel groups. This can be used to categorize channels by type, if you want to build
your own channel selection UI. Each channel has a `uiGroup` property which matches one group's `id` property.

### `createPaymentComponentForChannel`

```typescript
const channel = sdk
  .getAvailablePaymentChannels()
  .find((channel) => channel.channelCode === "CARDS");
if (channel) {
  const htmlElement = sdk.createChannelPickerComponent(channel);
  myContainer.replaceChildren(htmlElement);
}
```

Selects a payment channel and creates a UI for the user to fill any required information. You
need to pass in the channel you want to use, as returned from getAvailablePaymentChannels.

This returns a `HTMLElement`, which you need to insert into your document.

This method uses caching, it will always return the same element for the same channel, to preserve the
values the user enters into any form fields. If you don't want that, use `destroyComponent`.

### `createActionContainerComponent`

```typescript
sdk.addEventListener("action-begin", () => {
  const htmlElement = sdk.createActionContainerComponent();
  myActionContainer.replaceChildren(htmlElement);
});
```

Creates a container into which any additional actions (e.g. 3DS, QR Codes) will be rendered.

This is optional, if you don't create one, the SDK will create a modal with an action container for you.
You cannot create an action container during an action (i.e. after the `action-begin` event).

This returns a `HTMLElement`, which you need to insert into your document.

This method does not use caching.

### `submit`

```typescript
function onSubmitButtonClick() {
  sdk.submit();
}
```

Begins submission for the active payment channel.

Call this from the click event of your submit button.

Submission is only available when the session is active, a channel is active, any required information is collected, and
another submission is not in progress. Use the `submission-ready` and `submission-not-ready` events to know when submission is available.

This calls the [create payment request](https://docs.xendit.co/apidocs/create-payment-request)
or [create payment token](https://docs.xendit.co/apidocs/create-payment-token) endpoint depending on the session type. You
may listen to the corresponding webhooks on your server.

### `simulatePayment`

```typescript
sdk.simulatePayment();
```

Calls the [simulate payment](https://docs.xendit.co/apidocs/simulate-payment-test-mode) endpoint.

This is only available in test mode sessions. It also requires the payment channel to be a QR, OTC, or VA channel, and it requires an action
to be in-progress.

### `abortSubmission`

```typescript
sdk.abortSubmission();
```

Cancels the current submission, if any.

### `destroyComponent`

```typescript
sdk.destroyComponent(htmlElement);
```

Destroys a component, deleting any cached data and removing the element from the document. Manual cleanup is not normally required,
but is made available if you want it.

### `revealValidationErrors`

```typescript
sdk.revealValidationErrors();
```

Reveals hidden validation errors in the active channel's form, if any.

Validation errors are normally hidden until the user changes and unfocusses the input.

### `getActiveChannel`

```typescript
const channel: XenditChannel = sdk.getActiveChannel();
```

Returns the currently active channel.

The active channel is the one you or the channel picker component made active by calling `createPaymentComponentForChannel` or `setActiveChannel`.

The active channel:

- Will be used for submission when you call `submit()`
- Is interactive (non-active channel components are disabled)

### `setActiveChannel`

```typescript
const channel = sdk
  .getAvailablePaymentChannels()
  .find((channel) => channel.channelCode === "CARDS");
if (channel) {
  sdk.setActiveChannel(channel);
}
```

Makes the provided channel active.

## Events

### `init`

Notifies you when the session information is loaded. Most SDK functions require the session to be loaded and can only be called after this event.

`createChannelPickerComponent` is available before the init event.

### `session-complete` and `session-expired-or-canceled`

Notifies you when the session is in a terminal state.

`session-complete` means the session was successful, `session-expired-or-canceled` means the session was cancelled or expired.

### `submission-ready` and `submission-not-ready`

Notifies you when the user is ready to submit the payment, meaning a channel is selected and all required information is collected.

`submit` will only work in the ready state, or it will throw. Calling it when there are form validation errors will also reveal those errors
to the user.

You might want to disable your submit button when not in the ready state.

### `submission-begin` and `submission-end`

Notifies you when a submission is in progress.

You might want to show a pending state UI when in the submission state.

### `action-begin` and `action-end`

Notifies you when an action is in progress.

You might want to create an action container in the action-begin event.

## Appearance

### CSS Variables

The Xendit Components SDK is customizable by overriding its CSS. The SDK inserts its CSS above any other CSS at the time of loading to allow it to be easily overridden.

CSS variables can be overridden to change styles across all components.

The following variables are available:
| Variable | Description |
| :- | -: |
| --xendit-font-family | Font applied to all xendit components |
| --xendit-color-primary | Accent color |
| --xendit-color-text | Base text color |
| --xendit-color-text-secondary | Lighter text color |
| --xendit-color-text-placeholder | Placeholder color |
| --xendit-color-disabled | Background color of disabled elements |
| --xendit-color-danger | Border color of elements with validation errors and text color of validation errors |
| --xendit-color-border | TODO: remove this |
| --xendit-color-border-subtle | TODO: rename this |
| --xendit-color-border-default | TODO: rename this |
| --xendit-color-background | Background color of elements |
| --xendit-focus-shadow | Box-shadow applied to elements with focus |
| --xendit-animation-duration | Duration of animations (affects the channel picker accordion) |
| --xendit-animation-ease | Ease function of animations |
| --xendit-radius-1 | Border radius applied to some components |
| --xendit-z-index-focus | Z-index applied to focused fields |

### Appearance of Iframe fields

Some form fields (credit card inputs) are implemented inside iframes to protect the user's information.

Regular CSS doesn't apply inside iframes. The SDK instead provides overrides in the constructor which
it applies to the iframe fields.

```typescript
const sdk = new XenditSessionSdk({
  appearance: {
    // TODO
  },
});
```
