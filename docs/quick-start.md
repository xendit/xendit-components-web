# Quick Start

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
