// Every app eventually re-declares the same handful of media queries —
// `const REDUCE = "@media (prefers-reduced-motion: reduce)"` copied into
// file after file. These are the shared copies, published as StyleX
// `defineConsts` so they can be used as condition keys in any
// `stylex.create` call: `[mediaQueries.reducedMotion]: "0ms"`.
//
// Two conventions worth adopting with them: hover styles belong behind
// `canHover` (touch devices otherwise get sticky hover states), and
// decorative `transform`/`opacity` transitions should collapse to `0ms`
// under `reducedMotion`.
//
// One build requirement: cross-package StyleX constants resolve only when
// the consuming app's Babel config sets `unstable_moduleResolution`.

import * as stylex from "@stylexjs/stylex";

export const mediaQueries = stylex.defineConsts({
  /** Pointer supports hover — gate hover-only affordances behind this. */
  canHover: "@media (hover: hover)",
  /** User asked for less motion — zero out decorative transitions. */
  reducedMotion: "@media (prefers-reduced-motion: reduce)",
  /** Phone-width viewports. */
  viewportSm: "@media (max-width: 768px)",
  /** Tablet-width viewports. */
  viewportMd: "@media (max-width: 1024px)",
  /** Small desktop viewports. */
  viewportLg: "@media (max-width: 1280px)",
});
