# xendit-components

The Xendit Components SDK allows you to accept payments directly on your website using the Xendit Sessions API.

This SDK's role is to take a Session (created on your server using the Xendit Sessions API) and render a payment UI, and allow you to customize the UI to match your site's look & feel.

## Table of Contents

### Getting Started

- **[Installation](docs/installation.md)** - Installation options and setup
- **[Sessions](docs/sessions.md)** - Understanding Xendit Sessions API
- **[Quick Start](docs/quick-start.md)** - Get up and running in minutes
- **[Examples](docs/examples.md)** - Complete working examples for different frameworks

### API Reference

- **[SDK API](docs/sdk-api.md)** - Complete SDK methods and configuration
- **[Events](docs/events.md)** - Available SDK events and lifecycle hooks

### Customization

- **[Appearance](docs/appearance.md)** - CSS variables and styling options

## Quick Start

For immediate development, initialize the test SDK:

```typescript
const sdk = new XenditSessionTestSdk({});
const channelPicker = sdk.createChannelPickerComponent();
document.getElementById("checkout-container").appendChild(channelPicker);
```

For production usage, see the [Quick Start](docs/quick-start.md) guide.

## Production Setup

When you're ready to move from test mode to production, you'll need to obtain a session client key from your backend:

### Getting Your Session Client Key

The session client key is obtained from the `components_sdk_key` field when you create or retrieve a session:

```bash
# Create a new session
POST https://api.xendit.co/sessions
{
  "amount": 10000,
  "currency": "IDR",
  "payment_methods": ["CARDS", "EWALLET"]
}

# Response includes the client key
{
  "id": "ses_12345...",
  "components_sdk_key": "your_session_client_key_here",  # ← Use this in your frontend
  ...
}
```

Or retrieve an existing session:

```bash
GET https://api.xendit.co/sessions/{session_id}
```

##### API Documentation:

- [Create Session](https://docs.xendit.co/apidocs/create-session)
- [Get Session](https://docs.xendit.co/apidocs/get-session)

### Frontend Integration

Use the session client key to initialize the production SDK:

```typescript
const sdk = new XenditSessionSdk({
  sessionClientKey: "your_session_client_key_here",
});
```

⚠️ **Security Note:** Never expose your Xendit secret API key in frontend code. Always generate session client keys on your secure backend server.

### Demos

Try our interactive demo applications to see the SDK in action:

- **jQuery Demo** - Complete e-commerce demo with shopping cart and payment processing. For more details, please refer to the [jQuery Demo Document](demos/jquery/README.md).
- **React Demo** - React integration guide with hooks and TypeScript examples. For more details, please refer to the [React Demo Document](demos/react/README.md).

**Running the Demos:**

To set up and start the demo applications, run the demos script from the project root:

```bash
./demos.ts
```

This will build all demo applications and start a local development server where you can interact with working examples of the Xendit Components SDK.

## Support

- Check our [Examples](docs/examples.md) for complete integrations
- Review the [SDK API](docs/sdk-api.md) for method details
- Customize appearance with [CSS variables](docs/appearance.md)

## Further Reading

- **[Xendit Documentation](https://docs.xendit.co/)** - Complete platform documentation and guides
- **[Xendit API Reference](https://docs.xendit.co/apidocs)** - API endpoints and technical specifications
