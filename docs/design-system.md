# Design System

AstryxKit composes the Astryx design system instead of replacing it.

## Principles

- Use `AppShell` for the application frame.
- Use `TopNav` for product identity and short product-level navigation.
- Use `SideNav` for app/module navigation.
- Use `Section` for page regions.
- Use `Card` only for independently meaningful items.
- Use `xstyle` for custom styling.
- Use semantic tokens from Astryx docs instead of hardcoded values.
- Prefer neutral documentation surfaces over pastel card grids.
- Use color as metadata: badges, icon accents, and status text. Avoid colored
  edge strips as a layout device.
- Build higher-order surfaces with StyleX when the base component library does
  not encode the documentation pattern directly.

## Provider

`AstryxKitProvider` wraps `@astryxdesign/core/theme` with a small default theme
created through `defineTheme()` and persists the appearance mode:

```tsx
import { AstryxKitProvider } from "astryxkit/design-system";

export function Root() {
  return (
    <AstryxKitProvider>
      <App />
    </AstryxKitProvider>
  );
}
```

The provider accepts controlled `appearance` and `onAppearanceChange` props when
the host app wants to own that state. It also accepts a `theme` prop for apps
that use a generated or brand-specific Astryx theme.

## Documentation Surface Rules

The docs site is allowed to be more composed than raw Astryx examples, but it
still follows the same system contract:

- no raw `div` elements in UI source;
- no inline style props;
- no hardcoded spacing, radius, border, or color values when a token exists;
- no pastel cards as the default way to create hierarchy;
- no nested decorative cards;
- no one-off Cloudflare platform claims without checking current docs.

Good docs surfaces should feel like product infrastructure: dense, scannable,
token-driven, and anchored by real code.
