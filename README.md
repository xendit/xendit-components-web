# xendit-components-web

## Ownership

Team: `p-invoice-dev`

Slack Channel:

Slack Handle: `@troops-invoice`

## Getting Started

The project is divided into two parts: `sdk` and `secure-iframe`.
Each has a build script, but there's also a top-level build script that runs both.

### Prerequisites

1. Install nodejs. Requires version 22+.

### Install

```
pnpm i
```

### Development

This commnad starts a server on https://localhost:4443/ that hosts a test interface for the SDK, and another on https://localhost:4444/ that hosts a test UI for the secure-iframe. (Must be https not http!)

```
pnpm run dev
```

### Build

This commnad creates production builds at `sdk/dist` and `secure-iframe/dist`.

```
pnpm run build
```

### Testing

Automated tests TBD.

## Deployment

Deployment TBD.
