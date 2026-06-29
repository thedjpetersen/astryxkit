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
