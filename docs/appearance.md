# Appearance

## CSS Variables

The Xendit Components SDK is customizable by overriding its CSS. The SDK inserts its CSS above any other CSS at the time of loading to allow it to be easily overridden.

CSS variables can be overridden to change styles across all components.

The following variables are available:

| Variable                          | Description                                  | Default Value                                                                      | Usage                                  |
| :-------------------------------- | :------------------------------------------- | :--------------------------------------------------------------------------------- | :------------------------------------- |
| **Typography**                    |                                              |                                                                                    |                                        |
| `--xendit-font-family`            | Font family applied to all Xendit components | `"Proxima Nova", sans-serif`                                                       | All text elements                      |
| **Colors**                        |                                              |                                                                                    |                                        |
| `--xendit-color-primary`          | Primary brand color for interactive elements | `#1762ee`                                                                          | Buttons, focus states, active channels |
| `--xendit-color-text`             | Primary text color                           | `#252525`                                                                          | Headings, labels, main text            |
| `--xendit-color-text-secondary`   | Secondary text color for supporting content  | `#585858`                                                                          | Descriptions, helper text              |
| `--xendit-color-text-placeholder` | Placeholder text color                       | `#7d7d7d`                                                                          | Input placeholders                     |
| `--xendit-color-disabled`         | Background color for disabled elements       | `#f7f7f7`                                                                          | Disabled buttons, inactive fields      |
| `--xendit-color-danger`           | Error color for validation messages          | `#d1414d`                                                                          | Error borders, error text              |
| `--xendit-color-background`       | Background color for components              | `#ffffff`                                                                          | Cards, dropdowns, dialogs              |
| **Borders**                       |                                              |                                                                                    |                                        |
| `--xendit-color-border`           | Light border color for accordion items       | `rgba(0, 0, 0, 0.05)`                                                              | Accordion borders, subtle divisions    |
| `--xendit-color-border-subtle`    | Subtle border color for form elements        | `rgba(243, 243, 243)`                                                              | Input borders, dropdown borders        |
| `--xendit-color-border-default`   | Default border color for logos and cards     | `#ededed`                                                                          | Channel logos, card brand logos        |
| **Visual Effects**                |                                              |                                                                                    |                                        |
| `--xendit-focus-shadow`           | Box shadow for focused elements              | `0px 0px 0px 2px color-mix(in srgb, var(--xendit-color-primary) 15%, transparent)` | Focus indicators                       |
| `--xendit-animation-duration`     | Duration for UI animations                   | `0.3s`                                                                             | Accordion expand/collapse              |
| `--xendit-animation-ease`         | Easing function for animations               | `ease-in-out`                                                                      | Smooth transitions                     |
| `--xendit-radius-1`               | Border radius for components                 | `8px`                                                                              | Buttons, cards, inputs                 |
| `--xendit-z-index-focus`          | Z-index for focused elements                 | `2`                                                                                | Focus layer management                 |

### Customization Examples

**Basic theme customization:**

```css
:root {
  --xendit-color-primary: #6366f1; /* Custom purple brand color */
  --xendit-font-family: "Inter", sans-serif;
  --xendit-radius-1: 12px; /* More rounded corners */
}
```

**Dark theme:**

```css
:root {
  --xendit-color-background: #1f2937;
  --xendit-color-text: #f9fafb;
  --xendit-color-text-secondary: #d1d5db;
  --xendit-color-border-subtle: rgba(75, 85, 99, 0.3);
  --xendit-color-disabled: #374151;
}
```

**Custom focus styling:**

```css
:root {
  --xendit-focus-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  --xendit-animation-duration: 0.15s;
  --xendit-animation-ease: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Appearance of Iframe fields

Some form fields (credit card inputs) are implemented inside iframes to protect the user's information.

Regular CSS doesn't apply inside iframes. The SDK instead provides overrides in the constructor which
it applies to the iframe fields.

```typescript
const sdk = new XenditSessionSdk({
  sessionClientKey: "your-session-client-key",
  appearance: {
    inputFieldProperties: {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "1.5",
      letterSpacing: "0.5px",
      color: "#333333",
      backgroundColor: "#ffffff",
    },
  },
});
```

### Available Input Field Properties

The `inputFieldProperties` object accepts the following CSS properties for styling iframe-based input fields:

| Property          | Type     | Description                | Example Values                                             |
| ----------------- | -------- | -------------------------- | ---------------------------------------------------------- |
| `fontFamily`      | `string` | Font family for input text | `"Arial, sans-serif"`, `"'Roboto', sans-serif"`            |
| `fontSize`        | `string` | Font size with units       | `"14px"`, `"1rem"`, `"12pt"`                               |
| `fontWeight`      | `string` | Font weight                | `"400"`, `"bold"`, `"600"`                                 |
| `lineHeight`      | `string` | Line height                | `"1.2"`, `"20px"`, `"normal"`                              |
| `letterSpacing`   | `string` | Letter spacing             | `"0.5px"`, `"0.1em"`, `"normal"`                           |
| `color`           | `string` | Text color                 | `"#333333"`, `"rgb(51, 51, 51)"`, `"rgba(0, 0, 0, 0.8)"`   |
| `backgroundColor` | `string` | Background color           | `"#ffffff"`, `"transparent"`, `"rgba(255, 255, 255, 0.9)"` |

**Allowed formats:**

- **Font families**: Standard font names, quoted families, and fallback stacks
- **Sizes**: `px`, `em`, `rem`, `%`, `pt`, `vw`, `vh`, `vmin`, `vmax` units
- **Colors**: Hex (`#ff0000`), RGB/RGBA, HSL/HSLA, named colors, `transparent`
- **Font weights**: Numeric (`100`-`900`) or keywords (`normal`, `bold`, `lighter`, `bolder`)

### Usage Examples

**Basic styling:**

```typescript
const sdk = new XenditSessionSdk({
  sessionClientKey: sessionKey,
  appearance: {
    inputFieldProperties: {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "16px",
      color: "#2d3748",
    },
  },
});
```

**Custom theme:**

```typescript
const sdk = new XenditSessionSdk({
  sessionClientKey: sessionKey,
  appearance: {
    inputFieldProperties: {
      fontFamily: "'Inter', sans-serif",
      fontSize: "14px",
      fontWeight: "500",
      lineHeight: "1.4",
      letterSpacing: "0.025em",
      color: "#1a202c",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
    },
  },
});
```

**Dark mode styling:**

```typescript
const sdk = new XenditSessionSdk({
  sessionClientKey: sessionKey,
  appearance: {
    inputFieldProperties: {
      fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
      fontSize: "15px",
      color: "#f7fafc",
      backgroundColor: "#2d3748",
    },
  },
});
```

Note: These styles only affect the secure iframe input fields (credit card number, expiry, CVN). Other UI components use the CSS variables documented above.
