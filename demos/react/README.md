# Xendit Components SDK - React Demo

A comprehensive e-commerce demo application showcasing the integration of Xendit Components SDK with React and TypeScript. This demo demonstrates a complete payment flow with a shopping cart, product catalog, and payment processing.

## Demo Features

- Product catalog with multiple currencies (USD, IDR, PHP, THB, VND, SGD)
- Shopping cart with React state management
- Complete payment flow using Xendit Components SDK

## Code Structure

The demo consists of four main components:

- [index.tsx](index.tsx) - Main application with routing and state management
- [store.tsx](store.tsx) - Product catalog and shopping cart components
- [payment.tsx](payment.tsx) - Payment processing with Xendit SDK integration
- [index.html](index.html) - HTML template and styling

## Demo Workflow

1. **Store Page**: Browse products, select currency, add items to cart
2. **Checkout Page**: Review cart items and initiate payment
3. **SDK Initialization**: Enter SDK key (or leave blank for test mode)
4. **Payment Component**: Complete payment using Xendit payment form
5. **Success Page**: Confirmation of successful payment

**Testing Mode**: Leave the SDK key prompt blank to use `XenditSessionTestSdk`
**Currency Support**: USD, IDR, PHP, THB, VND, SGD with real-time conversion

## Core SDK Integration

### 1. SDK Initialization

The demo supports both production and test modes:

```tsx
const Payment: React.FC<{
  onSuccess: () => void;
  onFail: (message: string) => void;
  goToPage: (page: string) => void;
}> = ({ onSuccess, onFail, goToPage }) => {
  const el = useRef<HTMLDivElement | null>(null);
  const sdkRef = useRef<XenditSessionSdk | null>(null);

  useLayoutEffect(() => {
    const sessionClientKey = prompt(
      "Enter your Components SDK Key (or leave blank to use the test SDK):",
    );

    if (sessionClientKey === null) {
      goToPage("store");
      return;
    }

    // Initialize SDK based on input
    let sdk: XenditSessionSdk;
    if (sessionClientKey === "") {
      // Test mode - no credentials needed
      sdk = new XenditSessionTestSdk({});
    } else {
      // Production mode - requires valid session client key
      sdk = new XenditSessionSdk({ sessionClientKey });
    }

    sdkRef.current = sdk;
  }, [goToPage]);
};
```

### 2. Payment Component Creation

Once initialized, create payment components for available channels:

```tsx
// SDK event handling after initialization
sdk.addEventListener("init", () => {
  setLoading(false);

  // Find available payment channels
  const cards = sdk
    .getAvailablePaymentChannels()
    .find((channel) => channel.channelCode === "CARDS");

  if (cards) {
    // Create and mount payment component
    const component = sdk.createPaymentComponentForChannel(cards);
    el.current?.replaceChildren(component);
  }
});
```

### 3. Event-Driven Payment Flow

The SDK uses event listeners for managing the payment lifecycle:

```tsx
// Success handling
useLayoutEffect(() => {
  if (!sdkRef.current) return;

  sdkRef.current.addEventListener("session-complete", onSuccess);
  return () => {
    sdkRef.current?.removeEventListener("session-complete", onSuccess);
  };
}, [onSuccess]);

// Loading state management
sdk.addEventListener("submission-begin", () => setSubmitting(true));
sdk.addEventListener("submission-end", () => setSubmitting(false));

// Payment submission
const onSubmit = useCallback(() => {
  sdkRef.current?.submit();
}, []);
```

### 4. Error Handling

Comprehensive error handling with proper cleanup:

```tsx
// Fatal error handling
useLayoutEffect(() => {
  if (!sdkRef.current) return;

  const handleError = (event: XenditFatalErrorEvent) => {
    onFail(event.message);
  };

  sdkRef.current.addEventListener("fatal-error", handleError);
  return () => {
    sdkRef.current?.removeEventListener("fatal-error", handleError);
  };
}, [onFail]);

// Session management
useLayoutEffect(() => {
  if (!sdkRef.current) return;

  const handleSessionExpired = () => {
    alert("Session has expired or was canceled.");
    goToPage("store");
  };

  sdkRef.current.addEventListener(
    "session-expired-or-canceled",
    handleSessionExpired,
  );
  return () => {
    sdkRef.current?.removeEventListener(
      "session-expired-or-canceled",
      handleSessionExpired,
    );
  };
}, [goToPage]);
```

## Complete Component Example

Here's the essential structure of the Payment component:

```tsx
return (
  <div>
    <div className="xendit-component-container" ref={el}></div>
    <button className="submit" onClick={onSubmit} disabled={submitting}>
      {submitting ? "Processing..." : "Submit Payment"}
    </button>
    {(loading || submitting) && (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    )}
  </div>
);
```

This demo provides a complete reference for integrating Xendit Components SDK with React applications, showcasing best practices for state management, error handling, and component lifecycle management.
