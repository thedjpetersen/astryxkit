import * as stylex from "@stylexjs/stylex";

/**
 * Shared capability and breakpoint queries for StyleX conditions, so apps
 * stop re-declaring `const REDUCE = "@media (prefers-reduced-motion: ...)"`
 * in every component. Usage:
 *
 * ```ts
 * import { mediaQueries } from "astryxkit/design-system";
 *
 * const styles = stylex.create({
 *   thumb: {
 *     transitionDuration: {
 *       default: "var(--duration-fast)",
 *       [mediaQueries.reducedMotion]: "0ms",
 *     },
 *   },
 * });
 * ```
 *
 * Consuming builds must resolve StyleX constants across packages
 * (`unstable_moduleResolution` in the Babel plugin config).
 */
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
