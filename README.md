# xendit-components-web

Xendit Components allows you to accept payments directly on your website using the Xendit Sessions API.

This SDK's role is to take a Session (created on your server using the Xendit Sessions API) and render a payment UI, and allow you to customize the UI to match your site's look & feel.

## Installation

Install using npm:

```sh
npm install xendit-components-web --save
```

Or load it directly from our CDN:

```html
<script src="https://assets.xendit.co/components/VERSION_NUMBER_HERE/index.umd.js"></script>
```

Our npm package includes TypeScript types. If you're using the CDN, download type declarations from `https://assets.xendit.co/components/VERSION_NUMBER_HERE/index.d.ts`

## Sessions

The Xendit Session API is an abstraction over the Xendit Payments API, representing one transaction (or tokenization). Using one session, a user can make any number
of attempts to pay, one of which can be successful. A successful payment completes the session.

Sessions also abstract away any differences between channels, allowing you to write once, and accept payments from any channel Xendit supports.

Two types of sessions are available:

- `PAY` sessions collect a payment and optionally save a payment token for later use
- `SAVE` sessions save a payment token

## Quick Start

First, initialize the SDK either with either:

- `XenditComponentsTest` for frontend development or unit tests
- `XenditComponents`, for production, which requires a `componentsSdkKey`. That key comes from the session object you create on your server. Make an endpoint that creates a session for the user's current transaction, return the `components_sdk_key` to the client, and pass it into the constructor.

```typescript
// For frontend development, use XenditComponentsTest
const components: XenditComponents = new XenditComponentsTest({});
// For production or e2e testing, use XenditComponents, passing in the components_sdk_key from the Session object
const components: XenditComponents = new XenditComponents({ componentsSdkKey });

// Create a channel picker component
const channelPicker: HTMLElement = components.createChannelPickerComponent();

// Insert the channel picker into your document
myCheckoutPage.replaceChildren(channelPicker);

// Call submit() when the user clicks your submit button
mySubmitButton.addEventListener("click", () => {
  components.submit();
});

// Listen to the status of the session
components.addEventListener("session-complete", () => {
  alert("Payment Success");
});
components.addEventListener("session-expired-or-canceled", () => {
  alert("Payment cancelled or expired");
});
```

## Components API

### `XenditComponents` and `XenditComponentsTest`

The constructor.

For production and e2e testing, you need to pass the `componentsSdkKey`, which you can get when you create a Session on your server.

For development and unit testing, use `XenditComponentsTest`, which uses mock data and doesn't connect to Xendit servers.

### `createChannelPickerComponent`

```typescript
const htmlElement = components.createChannelPickerComponent();
myContainer.replaceChildren(htmlElement);
```

Creates a UI for the user to select a payment channel and fill any required information.

This returns a `HTMLElement`, which you need to insert into your document.

This method uses caching, it will always return the same channel picker element.
Changing the current channel will update the channel picker UI, even if it's unmounted.
If you don't want this, use `destroyComponent.`

### `getActiveChannels`

```typescript
const channels = components.getActiveChannels();
```

Returns the list of channels available in this session.

### `getActiveChannelGroups`

```typescript
const groups = components.getActiveChannelGroups();
```

Returns a list of channel groups. This can be used to categorize channels by type, if you want to build
your own channel selection UI. Each channel has a `uiGroup` property which matches one group's `id` property.

### `createChannelComponent`

```typescript
const channel = components.getActiveChannels({ filter: "CARDS" })[0];
if (channel) {
  const htmlElement = components.createChannelComponent(channel);
  myContainer.replaceChildren(htmlElement);
}
```

Selects a payment channel and creates a UI for the user to fill any required information. You
need to pass in the channel you want to use, as returned from getActiveChannels.

This returns a `HTMLElement`, which you need to insert into your document.

This method uses caching, it will always return the same element for the same channel, to preserve the
values the user enters into any form fields. If you don't want that, use `destroyComponent`.

### `createActionContainerComponent`

```typescript
components.addEventListener("action-begin", () => {
  const htmlElement = components.createActionContainerComponent();
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
  components.submit();
}
```

Begins submission for the active payment channel.

Call this from the click event of your submit button.

Submission is only available when the session is active, a channel is made current by creating a channel component, any required information is collected, and
another submission is not in progress. Use the `submission-ready` and `submission-not-ready` events to know when submission is available.

This calls the [create payment request](https://docs.xendit.co/apidocs/create-payment-request)
or [create payment token](https://docs.xendit.co/apidocs/create-payment-token) endpoint depending on the session type. You
may listen to the corresponding webhooks on your server.

### `simulatePayment`

```typescript
components.simulatePayment();
```

Calls the [simulate payment](https://docs.xendit.co/apidocs/simulate-payment-test-mode) endpoint.

This is only available in test mode sessions. It also requires the payment channel to be a QR, OTC, or VA channel, and it requires an action
to be in-progress.

### `abortSubmission`

```typescript
components.abortSubmission();
```

Cancels the current submission, if any.

### `destroyComponent`

```typescript
components.destroyComponent(htmlElement);
```

Destroys a component, deleting any cached data and removing the element from the document. Manual cleanup is not normally required,
but is made available if you want it.

### `showValidationErrors`

```typescript
components.showValidationErrors();
```

Reveals hidden validation errors in the current channel's form, if any.

Validation errors are normally hidden until the user changes and unfocusses the input.

### `getCurrentChannel`

```typescript
const channel: XenditChannel = components.getCurrentChannel();
```

Returns the current channel.

The current channel is the one you or the channel picker component selected by calling `createChannelComponent` or `setCurrentChannel`.

The current channel:

- Will be used for submission when you call `submit()`
- Is interactive (other channel components are disabled)

### `setCurrentChannel`

```typescript
const channel = components.getActiveChannels({ filter: "CARDS" })[0];
if (channel) {
  components.setCurrentChannel(channel);
}
```

Makes the provided channel the current channel.

### `pollImmediately`

```typescript
components.pollImmediately();
```

Request an immediate poll for session status. Useful for handling payment affirmation (e.g. I have made the payment) by the user. The session must still be active.

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
| --xendit-color-border | Border color used on accordions, input fields, and logos |
| --xendit-color-background | Background color of input fields |
| --xendit-focus-shadow | Box-shadow applied to elements with focus |
| --xendit-animation-duration | Duration of animations (affects the channel picker accordion) |
| --xendit-animation-ease | Ease function of animations |
| --xendit-radius-1 | Border radius applied to some components |
| --xendit-z-index-focus | Z-index applied to focused fields |

### Appearance of Iframe fields

Some form fields (credit card inputs) are implemented inside iframes to protect the user's information.

You can't override the CSS inside the iframe fields. Instead, you can pass some limited styles to the constructor
which we'll pass along to the iframes.

```typescript
const sdk = new XenditComponents({
  iframeFieldAppearance: {
    inputStyles: {
      // apply styles to inputs within iframe fields
      color: "#000",
    },
    placeholderStyles: {
      // apply styles to input placeholders in iframe fields
      color: "#ccc",
    },
    fontFace: {
      // insert a @font-face rule inside iframe fields
      source: "url(https://example.com/my-font-file) format(woff2)",
      descriptors: { display: "swap" },
    },
  },
});
```
