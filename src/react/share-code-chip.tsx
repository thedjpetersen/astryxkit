// The display half of the short-link contract (`astryxkit/worker` owns
// generation and redirects). Design intent: codes are load-bearing
// identifiers, so the chip is quiet — monospace text, hairline border —
// and the tooltip carries the explanation. Clicking copies the absolute
// URL; the border flipping to the success color is the only celebration.

import { Icon } from "@astryxdesign/core/Icon";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

// Long enough to read "Copied", short enough that the chip is ready for
// the next artifact before the user is.
const COPIED_RESET_MS = 2000;

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: {
      default: "var(--color-background-card)",
      ":hover": {
        default: "var(--color-background-card)",
        "@media (hover: hover)": "var(--color-overlay-hover)",
      },
    },
    borderColor: "var(--color-border)",
    borderRadius: "var(--radius-element)",
    borderStyle: "solid",
    borderWidth: "var(--border-width)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    display: "inline-flex",
    gap: "var(--spacing-1)",
    height: 24,
    maxWidth: "100%",
    paddingInline: "var(--spacing-1-5)",
    transitionDuration: {
      default: "var(--duration-fast)",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: "var(--ease-standard)",
  },
  copied: {
    borderColor: "var(--color-success)",
    color: "var(--color-success)",
  },
  code: {
    fontFamily: "var(--font-family-code)",
    fontSize: "var(--font-size-sm)",
    lineHeight: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

export type ShareCodeChipProps = {
  /** The short code text shown in the chip (e.g. "DLNCHBRF", "kfq4-x2mh"). */
  code: string;
  /** Absolute path of the short link (e.g. "/d/DLNCHBRF"). */
  sharePath: string;
  /** Host shown in the tooltip when rendering off-DOM. @default "" */
  fallbackHost?: string;
  /** What the link opens, for the tooltip and aria label. @default "Share link" */
  label?: string;
  xstyle?: StyleXStyles;
};

/**
 * The platform-wide short-link affordance: a quiet monospace chip showing an
 * artifact's code. Hover explains what it is (full share URL + "click to
 * copy"); click copies the absolute URL and flips the tooltip to "Copied".
 * Codes are load-bearing — the chip never truncates them by design intent.
 */
export function ShareCodeChip({
  code,
  fallbackHost = "",
  label = "Share link",
  sharePath,
  xstyle,
}: ShareCodeChipProps) {
  const [isCopied, setIsCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current != null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  // The visible host keeps the tooltip honest in every environment: the
  // deployed apex in prod, 127.0.0.1 during development.
  const shareHost =
    typeof window !== "undefined" ? window.location.host : fallbackHost;
  const shareDisplay = `${shareHost}${sharePath}`;

  function copyShareUrl() {
    const absolute = `${window.location.origin}${sharePath}`;

    navigator.clipboard
      ?.writeText(absolute)
      .then(() => {
        setIsCopied(true);

        if (resetTimerRef.current != null) {
          window.clearTimeout(resetTimerRef.current);
        }
        resetTimerRef.current = window.setTimeout(() => {
          resetTimerRef.current = null;
          setIsCopied(false);
        }, COPIED_RESET_MS);
      })
      .catch(() => {
        // Clipboard unavailable (permissions/insecure context): no-op; the
        // tooltip still shows the URL so it can be copied by hand.
      });
  }

  return (
    <Tooltip
      content={
        isCopied
          ? "Copied to clipboard"
          : `${label} · ${shareDisplay} — click to copy`
      }
    >
      <button
        type="button"
        aria-label={`${label} ${code}. Copy ${shareDisplay}.`}
        onClick={copyShareUrl}
        {...stylex.props(styles.root, isCopied && styles.copied, xstyle)}
      >
        <Icon
          icon={isCopied ? "check" : "copy"}
          size="xsm"
          color="inherit"
          aria-hidden="true"
        />
        <span {...stylex.props(styles.code)}>{code}</span>
      </button>
    </Tooltip>
  );
}
