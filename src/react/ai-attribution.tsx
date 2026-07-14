// The visible half of content provenance (`normalizeAiAttribution` in core
// is the data half). The badge is Obsidian-flavored: a small sparkles
// glyph and one quiet line of secondary text, present wherever AI-produced
// text is shown and absent (rendering null) for human-written content.
// Frameworks display provenance; products decide when it is mandatory.

import { Text } from "@astryxdesign/core/Text";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { SVGProps } from "react";
import type { AiAttribution } from "app-foundry/core";

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "inline-flex",
    gap: "var(--spacing-1-5)",
  },
  glyph: {
    color: "var(--color-icon-secondary)",
    flexShrink: 0,
    height: 13,
    width: 13,
  },
});

export type AiAttributionBadgeProps = {
  /** null renders nothing — human-written content carries no badge. */
  attribution: AiAttribution;
  /** Leading phrase before the source name. @default "AI-generated" */
  prefix?: string;
  xstyle?: StyleXStyles;
};

/**
 * Visible provenance for AI-produced text: a quiet sparkles-and-source row
 * (e.g. "AI-generated · Workers AI (Whisper)"). Render it wherever such text
 * appears; pass null for human-written content and it renders nothing.
 */
export function AiAttributionBadge({
  attribution,
  prefix = "AI-generated",
  xstyle,
}: AiAttributionBadgeProps) {
  if (!attribution) {
    return null;
  }

  return (
    <span {...stylex.props(styles.root, xstyle)}>
      <SparklesGlyph aria-hidden="true" {...stylex.props(styles.glyph)} />
      <Text type="supporting" color="secondary">
        {prefix} · {attribution}
      </Text>
    </span>
  );
}

/** Sparkles outline (Heroicons), inlined so the kit adds no icon dependency. */
function SparklesGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}
