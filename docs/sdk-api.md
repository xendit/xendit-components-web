# SDK API

## `XenditSessionSdk` and `XenditSessionTestSdk`

### Constructor Options

**Production SDK:**

```typescript
const sdk = new XenditSessionSdk({
  sessionClientKey: "your-session-client-key",
  appearance?: {
    inputFieldProperties?: {
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: string;
      lineHeight?: string;
      letterSpacing?: string;
      color?: string;
      backgroundColor?: string;
    }
  }
});
```

**Development/Testing SDK:**

```typescript
const sdk = new XenditSessionTestSdk({});
// sessionClientKey is ignored, mock data is used
```

**Options:**

- `sessionClientKey` - Required for production. Get this from your session creation endpoint
- `appearance` - Optional styling for secure iframe fields (credit card inputs)

The `XenditSessionTestSdk` uses mock data and doesn't connect to Xendit servers, perfect for development and unit testing.

## `createChannelPickerComponent`

```typescript
const htmlElement = sdk.createChannelPickerComponent();
myContainer.replaceChildren(htmlElement);
```

Creates a UI for the user to select a payment channel and fill any required information.

This returns a `HTMLElement`, which you need to insert into your document.

This method uses caching, it will always return the same channel picker element.
Changing the active channel will update the channel picker UI, even if it's unmounted.
If you don't want this, use `destroyComponent.`

## `getAvailablePaymentChannels`

```typescript
const channels = sdk.getAvailablePaymentChannels();
```

Returns the list of channels available in this session.

## `getAvailablePaymentChannelGroups`

```typescript
const groups = sdk.getAvailablePaymentChannelGroups();
```

Returns a list of channel groups. This can be used to categorize channels by type, if you want to build
your own channel selection UI. Each channel has a `uiGroup` property which matches one group's `id` property.

## Minimal Payment Flow Example

Here's a minimal example showing how to create a container and dynamically replace it with a payment component:

```typescript
// Create a container element for the payment component
const paymentContainer = document.createElement("div");
paymentContainer.id = "payment-container";
paymentContainer.style.minHeight = "300px"; // Reserve space for the component
document.getElementById("checkout-form").appendChild(paymentContainer);

// Get available channels and select one (e.g., credit cards)
const channels = sdk.getAvailablePaymentChannels();
const cardChannel = channels.find((channel) => channel.channelCode === "CARDS");

if (cardChannel) {
  // Create the payment component for the selected channel
  const paymentComponent = sdk.createPaymentComponentForChannel(cardChannel);

  // Replace the container content with the payment component
  paymentContainer.replaceChildren(paymentComponent);

  console.log("Payment component loaded for:", cardChannel.displayName);
}
```

This pattern is useful when you need to dynamically switch between different payment channels or when you want to control exactly when and where the payment component appears in your UI.

## `createPaymentComponentForChannel`

```typescript
const channel = sdk
  .getAvailablePaymentChannels()
  .find((channel) => channel.channelCode === "CARDS");
if (channel) {
  const htmlElement = sdk.createPaymentComponentForChannel(channel);
  myContainer.replaceChildren(htmlElement);
}
```

Selects a payment channel and creates a UI for the user to fill any required information. You
need to pass in the channel you want to use, as returned from getAvailablePaymentChannels.

This returns a `HTMLElement`, which you need to insert into your document.

This method uses caching, it will always return the same element for the same channel, to preserve the
values the user enters into any form fields. If you don't want that, use `destroyComponent`.

## `createActionContainerComponent`

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

## `submit`

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

## `simulatePayment`

```typescript
sdk.simulatePayment();
```

Calls the [simulate payment](https://docs.xendit.co/apidocs/simulate-payment-test-mode) endpoint.

This is only available in test mode sessions. It also requires the payment channel to be a QR, OTC, or VA channel, and it requires an action
to be in-progress.

## `abortSubmission`

```typescript
sdk.abortSubmission();
```

Cancels the current submission, if any.

## `destroyComponent`

```typescript
sdk.destroyComponent(htmlElement);
```

Destroys a component, deleting any cached data and removing the element from the document. Manual cleanup is not normally required,
but is made available if you want it.

## `revealValidationErrors`

```typescript
sdk.revealValidationErrors();
```

Reveals hidden validation errors in the active channel's form, if any.

Validation errors are normally hidden until the user changes and unfocusses the input.

## `getActiveChannel`

```typescript
const channel: XenditPaymentChannel = sdk.getActiveChannel();
```

Returns the currently active channel.

The active channel is the one you or the channel picker component made active by calling `createPaymentComponentForChannel` or `setActiveChannel`.

The active channel:

- Will be used for submission when you call `submit()`
- Is interactive (non-active channel components are disabled)

## `setActiveChannel`

```typescript
const channel = sdk
  .getAvailablePaymentChannels()
  .find((channel) => channel.channelCode === "CARDS");
if (channel) {
  sdk.setActiveChannel(channel);
}
```

Makes the provided channel active.

## Static Utilities

### `XenditSessionSdk.moneyFormat`

```typescript
const formattedAmount = XenditSessionSdk.moneyFormat(100000, "IDR");
// Returns: "Rp100,000"
```

A utility method for formatting monetary amounts according to locale conventions. Useful for displaying prices in your UI.

**Parameters:**

- `amount` (number) - The amount in minor currency units (e.g., cents for USD)
- `currency` (string) - ISO 4217 currency code (e.g., "USD", "IDR")

**Returns:** Formatted currency string
