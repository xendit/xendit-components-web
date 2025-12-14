# Xendit Components SDK - jQuery Demo

A comprehensive e-commerce demo application showcasing the integration of Xendit Components SDK with jQuery. This demo demonstrates a complete payment flow with a shopping cart, product catalog, and payment processing.

## Demo Features

- Product catalog with multiple currencies (USD, IDR, PHP, THB, VND, SGD)
- Shopping cart with animated add-to-cart functionality
- Complete payment flow using Xendit Components SDK
- Payment success handling

## Code Structure

The jQuery demo consists of four main files:

- [`index.ts`](index.ts) - Main application entry point and event handlers
- [`store.ts`](store.ts) - Shopping cart and product management
- [`payment.ts`](payment.ts) - Payment processing with Xendit SDK
- [`index.html`](index.html) - HTML template and styling

### Main Application ([index.ts](index.ts))

Handles application initialization, page navigation, and event binding. Key responsibilities:

- Initializes the store page and product display
- Manages currency selection and cart interactions
- Triggers checkout flow and payment submission

### Store Management ([store.ts](store.ts))

Manages the e-commerce functionality including:

- Product catalog display with dynamic pricing
- Shopping cart state management
- Currency conversion using `XenditSessionSdk.moneyFormat()`
- Page navigation between store, checkout, and success pages

### Payment Integration ([payment.ts](payment.ts))

Core Xendit SDK integration with these key features:

- **SDK Initialization**: Supports both `XenditSessionSdk` (production) and `XenditSessionTestSdk` (testing)
- **Payment Component Creation**: Creates card payment components using `sdk.createPaymentComponentForChannel()`
- **Event Handling**: Manages SDK events including `init`, `submission-begin`, `submission-end`, `session-complete`, and `fatal-error`
- **Payment Submission**: Handles payment processing through `sdk.submit()`

## Demo Workflow

1. **Store Page**: Browse products, select currency, add items to cart
2. **Checkout Page**: Review cart items and initiate payment
3. **SDK Initialization**: Enter SDK key (or use test mode)
4. **Payment Component**: Complete payment using Xendit payment form
5. **Success Page**: Confirmation of successful payment

## Testing Mode

The demo includes a test mode that works without a real SDK key:

- Leave the SDK key prompt blank to use `XenditSessionTestSdk`
- Test mode provides a simulated payment experience
- Perfect for development and integration testing

## Currency Support

The demo supports multiple currencies with real-time conversion:

- USD (US Dollar)
- IDR (Indonesian Rupiah)
- PHP (Philippine Peso)
- THB (Thai Baht)
- VND (Vietnamese Dong)
- SGD (Singapore Dollar)

## Quick Start Example

Here's how the jQuery demo implements the complete Xendit SDK integration:

```javascript
import { XenditSessionSdk, XenditSessionTestSdk } from "xendit-components";
import $ from "jquery";

let sdk;

// SDK Initialization (from payment.ts)
function beginCheckout() {
  const sessionClientKey = prompt(
    "Enter your Components SDK Key (or leave blank to use the test SDK):",
  );

  if (sessionClientKey === null) {
    return; // User cancelled
  }

  if (sessionClientKey === "") {
    // Test mode - no credentials needed
    sdk = new XenditSessionTestSdk({});
  } else {
    // Production mode - requires valid session client key
    sdk = new XenditSessionSdk({ sessionClientKey });
  }

  // Event handling using jQuery
  $(sdk).on("init", function () {
    // Create card payment component
    const channel = sdk
      .getAvailablePaymentChannels()
      .find((c) => c.channelCode === "CARDS");

    if (channel) {
      const component = sdk.createPaymentComponentForChannel(channel);
      $(".xendit-component-container")[0].replaceChildren(component);
    }

    $(".loading").hide();
    $(".submit").show();
  });

  // Payment completion
  $(sdk).on("session-complete", () => {
    goToPage(".payment-success");
  });
}

// Submit payment
function submitCheckout() {
  sdk.submit();
}
```

## SDK Credentials Setup

### Development Mode (Recommended for Testing)

The jQuery demo uses `XenditSessionTestSdk` for development which requires **no credentials**:

```javascript
// Simply leave the prompt blank or use directly
const sdk = new XenditSessionTestSdk({});
```

**Test mode features:**

- No backend setup required
- Mock payment data
- Simulated payment flows
- Perfect for learning and development

### Production Mode Setup

For production, you need a **Session Client Key** from your backend.

## Error Handling

The jQuery demo implements comprehensive error handling using jQuery's event system:

### Fatal Error Handling

```javascript
// Handle critical SDK errors
$(sdk).on("fatal-error", function (event) {
  const errorMessage = event.originalEvent.message;
  alert(`Fatal error occurred: ${errorMessage}`);

  // Return to checkout page for retry
  goToPage(".checkout");

  // Log error for debugging
  console.error("Xendit SDK Fatal Error:", {
    message: errorMessage,
    timestamp: new Date().toISOString(),
  });
});
```

### Session Management

```javascript
// Handle session expiration or cancellation
$(sdk).on("session-expired-or-canceled", () => {
  alert("Session has expired or was canceled.");

  // Redirect back to store to restart flow
  goToPage(".store");
});
```

### Loading State Management

```javascript
// Show loading during payment submission
$(sdk).on("submission-begin", function () {
  $(".loading").show();
  $(".submit").prop("disabled", true);
});

// Hide loading when submission completes
$(sdk).on("submission-end", function () {
  $(".loading").hide();
  $(".submit").prop("disabled", false);
});
```

### Complete Error Handling Implementation

Here's how the demo combines all error handling:

```javascript
function beginCheckout() {
  const sdk = initializeSDK();

  // Success flow
  $(sdk).on("session-complete", () => {
    goToPage(".payment-success");
  });

  // Error flows
  $(sdk).on("fatal-error", function (event) {
    handleFatalError(event.originalEvent.message);
  });

  $(sdk).on("session-expired-or-canceled", () => {
    handleSessionExpired();
  });

  // Loading states
  $(sdk).on("submission-begin", showPaymentLoading);
  $(sdk).on("submission-end", hidePaymentLoading);
}

function handleFatalError(message) {
  hidePaymentLoading();

  // Show user-friendly error
  showErrorDialog({
    title: "Payment Error",
    message: "Unable to process payment. Please try again.",
    action: () => goToPage(".checkout"),
  });

  // Log detailed error
  console.error("Payment processing failed:", {
    error: message,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });
}

function handleSessionExpired() {
  showErrorDialog({
    title: "Session Expired",
    message: "Your payment session has expired. Please start over.",
    action: () => goToPage(".store"),
  });
}

function showPaymentLoading() {
  $(".loading").show();
  $(".submit").prop("disabled", true);
  $(".submit").text("Processing...");
}

function hidePaymentLoading() {
  $(".loading").hide();
  $(".submit").prop("disabled", false);
  $(".submit").text("Submit Payment");
}
```

### Error Prevention Best Practices

The demo follows these patterns to prevent common issues:

1. **Check for null/undefined**: Always validate SDK responses
2. **User feedback**: Provide clear loading and error states
3. **Graceful fallbacks**: Allow users to retry or go back
4. **Detailed logging**: Log errors for debugging without exposing sensitive data

This comprehensive error handling ensures a smooth user experience even when things go wrong.
