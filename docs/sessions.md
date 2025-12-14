# Sessions

The Xendit Session API is an abstraction over the Xendit Payments API, representing one transaction (or tokenization). Using one session, a user can make any number
of attempts to pay, one of which can be successful. A successful payment completes the session.

Sessions also abstract away any differences between channels, allowing you to write once, and accept payments from any channel Xendit supports.

Two types of sessions are available:

- `PAY` sessions collect a payment and optionally save a payment token for later use
- `SAVE` sessions save a payment token

## Further Reading

- **[Xendit Sessions API](https://docs.xendit.co/apidocs/create-session)**
