import { Text } from "@astryxdesign/core";
import {
  borderVars,
  radiusVars,
  spacingVars,
  textSizeVars,
  typographyVars,
} from "@astryxdesign/core/theme/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { symbolIndex } from "./source-data";

export type CodeLanguage = "bash" | "text" | "ts" | "tsx";

export type CodeListingProps = {
  code: string;
  language?: CodeLanguage;
  title?: string;
  hasLineNumbers?: boolean;
  isWrapped?: boolean;
  maxHeight?: number;
  /** 1-based lines to emphasize, relative to the rendered snippet. */
  highlightLines?: number[];
  /** Display number of the first line (annotated source excerpts). */
  startLine?: number;
  /** Suppresses the self-link on a symbol's own definition line. */
  currentModuleId?: string;
  /** When set, every line span gets id `${lineIdPrefix}${displayNumber}`. */
  lineIdPrefix?: string;
  /** "card" draws the dark framed panel; "bare" renders lines only. */
  frame?: "bare" | "card";
  width?: number | string;
  xstyle?: StyleXStyles;
};

type TokenKind =
  | "comment"
  | "constant"
  | "function"
  | "keyword"
  | "number"
  | "plain"
  | "property"
  | "string"
  | "tag"
  | "type"
  | "variable";

type Token = {
  kind: TokenKind;
  text: string;
};

const TS_KEYWORDS = new Set([
  "abstract", "any", "as", "async", "await", "boolean", "break", "case",
  "catch", "class", "const", "continue", "declare", "default", "delete",
  "do", "else", "enum", "export", "extends", "finally", "for", "from",
  "function", "get", "if", "implements", "import", "in", "infer",
  "instanceof", "interface", "is", "keyof", "let", "namespace", "never",
  "new", "number", "of", "override", "private", "protected", "public",
  "readonly", "return", "satisfies", "set", "static", "string", "super",
  "switch", "throw", "try", "type", "typeof", "unknown", "var", "void",
  "while", "yield",
]);

const TS_CONSTANTS = new Set(["false", "null", "this", "true", "undefined"]);

const TS_TOKEN_PATTERN =
  /(\/\*[\s\S]*?(?:\*\/|$))|(\/\/[^\n]*)|(`(?:\\[\s\S]|[^`\\])*`?)|('(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?)|(0[xX][0-9a-fA-F_]+|\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\n)|([ \t]+|[^\sA-Za-z_$\d]+)/g;

function classifyIdentifier(
  text: string,
  previous: string,
  next: string,
): TokenKind {
  if (TS_CONSTANTS.has(text)) {
    return "constant";
  }

  if (TS_KEYWORDS.has(text)) {
    return "keyword";
  }

  if (previous === "<" || previous === "</") {
    return "tag";
  }

  if (next.startsWith("(")) {
    return "function";
  }

  if (previous === ".") {
    return "property";
  }

  if (/^[A-Z]/.test(text)) {
    return "type";
  }

  return "variable";
}

function tokenizeTs(code: string): Token[] {
  const tokens: Token[] = [];
  const matches = Array.from(code.matchAll(TS_TOKEN_PATTERN));

  matches.forEach((match, index) => {
    const [text, block, line, template, string, number, identifier] = match;

    if (block !== undefined || line !== undefined) {
      tokens.push({ kind: "comment", text });
      return;
    }

    if (template !== undefined || string !== undefined) {
      tokens.push({ kind: "string", text });
      return;
    }

    if (number !== undefined) {
      tokens.push({ kind: "number", text });
      return;
    }

    if (identifier !== undefined) {
      const previousText = matches[index - 1]?.[0]?.trimEnd() ?? "";
      const previous = previousText.slice(-2) === "</"
        ? "</"
        : previousText.slice(-1);
      let next = "";

      for (let cursor = index + 1; cursor < matches.length; cursor += 1) {
        const candidate = matches[cursor][0];

        if (candidate.trim() !== "") {
          next = candidate.trimStart();
          break;
        }

        if (candidate === "\n") {
          break;
        }
      }

      tokens.push({
        kind: classifyIdentifier(text, previous, next),
        text,
      });
      return;
    }

    tokens.push({ kind: "plain", text });
  });

  return tokens;
}

function tokenizeBash(code: string): Token[] {
  const tokens: Token[] = [];

  for (const rawLine of code.split(/(?<=\n)/)) {
    const commentStart = rawLine.indexOf("#");

    if (commentStart >= 0) {
      if (commentStart > 0) {
        tokens.push({ kind: "plain", text: rawLine.slice(0, commentStart) });
      }

      tokens.push({
        kind: "comment",
        text: rawLine.slice(commentStart).replace(/\n$/, ""),
      });

      if (rawLine.endsWith("\n")) {
        tokens.push({ kind: "plain", text: "\n" });
      }
      continue;
    }

    const command = rawLine.match(/^(\s*)([\w./@-]+)([\s\S]*)$/);

    if (command) {
      if (command[1]) {
        tokens.push({ kind: "plain", text: command[1] });
      }

      tokens.push({ kind: "function", text: command[2] });
      tokens.push({ kind: "plain", text: command[3] });
      continue;
    }

    tokens.push({ kind: "plain", text: rawLine });
  }

  return tokens;
}

function tokenize(code: string, language: CodeLanguage): Token[] {
  if (language === "ts" || language === "tsx") {
    return tokenizeTs(code);
  }

  if (language === "bash") {
    return tokenizeBash(code);
  }

  return [{ kind: "plain", text: code }];
}

/** Split multi-line tokens so every rendered line owns its tokens. */
function buildLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]];

  for (const token of tokens) {
    const parts = token.text.split("\n");

    parts.forEach((part, index) => {
      if (index > 0) {
        lines.push([]);
      }

      if (part !== "") {
        lines[lines.length - 1].push({ kind: token.kind, text: part });
      }
    });
  }

  return lines;
}

const LINKABLE_KINDS = new Set<TokenKind>([
  "function",
  "tag",
  "type",
  "variable",
]);

export function CodeListing({
  code,
  currentModuleId,
  frame = "card",
  hasLineNumbers = false,
  highlightLines = [],
  isWrapped = false,
  language = "text",
  lineIdPrefix,
  maxHeight,
  startLine = 1,
  title,
  width,
  xstyle,
}: CodeListingProps) {
  const lines = buildLines(tokenize(code, language));
  const highlighted = new Set(highlightLines);

  const renderToken = (token: Token, lineNumber: number, key: number) => {
    const location =
      LINKABLE_KINDS.has(token.kind) && token.text.length > 1
        ? symbolIndex.get(token.text)
        : undefined;
    const isDefinitionSite =
      location?.moduleId === currentModuleId && location?.line === lineNumber;

    if (location && !isDefinitionSite) {
      return (
        <a
          key={key}
          href={`#/source/${location.moduleId}?s=${encodeURIComponent(token.text)}`}
          title={`Defined in ${location.path} — view annotated source`}
          {...stylex.props(tokenStyles[token.kind], styles.symbolLink)}
        >
          {token.text}
        </a>
      );
    }

    return (
      <span key={key} {...stylex.props(tokenStyles[token.kind])}>
        {token.text}
      </span>
    );
  };

  const listing = (
    <section
      {...stylex.props(
        styles.scroll,
        maxHeight != null && styles.maxHeight(maxHeight),
      )}
    >
      <pre {...stylex.props(styles.pre)}>
        <code {...stylex.props(styles.code)}>
          {lines.map((tokens, index) => {
            const displayNumber = startLine + index;
            const relativeNumber = index + 1;

            return (
              <span
                key={index}
                id={
                  lineIdPrefix != null
                    ? `${lineIdPrefix}${displayNumber}`
                    : undefined
                }
                {...stylex.props(
                  styles.line,
                  highlighted.has(relativeNumber) && styles.lineHighlight,
                )}
              >
                {hasLineNumbers ? (
                  <span aria-hidden="true" {...stylex.props(styles.lineNumber)}>
                    {displayNumber}
                  </span>
                ) : null}
                <span
                  {...stylex.props(
                    styles.lineText,
                    isWrapped && styles.lineTextWrapped,
                  )}
                >
                  {tokens.map((token, tokenIndex) =>
                    renderToken(token, displayNumber, tokenIndex),
                  )}
                  {"\n"}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
    </section>
  );

  if (frame === "bare") {
    return (
      <section {...stylex.props(styles.bare, xstyle)}>{listing}</section>
    );
  }

  return (
    <section
      {...stylex.props(styles.card, width != null && styles.width(width), xstyle)}
    >
      {title ? (
        <header {...stylex.props(styles.titleBar)}>
          <Text type="supporting" xstyle={styles.titleText}>
            {title}
          </Text>
          <Text type="supporting" xstyle={styles.languageChip}>
            {language}
          </Text>
        </header>
      ) : null}
      {listing}
    </section>
  );
}

const CODE_BACKGROUND = "#1a2652";
const CODE_HEADER_BACKGROUND = "#142046";

const paletteStyles = stylex.create({
  comment: { color: "#b5bdc8", fontStyle: "italic" },
  constant: { color: "#79c0ff" },
  function: { color: "#d2a8ff" },
  keyword: { color: "#ff9b91" },
  number: { color: "#79c0ff" },
  plain: { color: "#c9d1d9" },
  property: { color: "#79c0ff" },
  string: { color: "#a5d6ff" },
  tag: { color: "#7ee787" },
  type: { color: "#ffa657" },
  variable: { color: "#e6edf3" },
});

const tokenStyles: Record<
  TokenKind,
  (typeof paletteStyles)[keyof typeof paletteStyles]
> = paletteStyles;

const styles = stylex.create({
  card: {
    backgroundColor: CODE_BACKGROUND,
    borderColor: CODE_BACKGROUND,
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    boxShadow:
      "0 1px 1px rgba(16, 17, 26, 0.08), 0 8px 24px rgba(60, 66, 87, 0.08)",
    minWidth: 0,
    overflow: "hidden",
  },
  bare: {
    minWidth: 0,
  },
  width: (width: number | string) => ({
    width,
  }),
  titleBar: {
    alignItems: "center",
    backgroundColor: CODE_HEADER_BACKGROUND,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    display: "flex",
    gap: spacingVars["--spacing-3"],
    justifyContent: "space-between",
    paddingBlock: spacingVars["--spacing-2"],
    paddingInline: spacingVars["--spacing-4"],
  },
  titleText: {
    color: "#e6edf3",
    fontFamily: typographyVars["--font-family-code"],
  },
  languageChip: {
    color: "rgba(230, 237, 243, 0.55)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  scroll: {
    overflow: "auto",
  },
  maxHeight: (value: number) => ({
    maxHeight: value,
  }),
  pre: {
    margin: 0,
    minWidth: 0,
  },
  code: {
    display: "block",
    fontFamily: typographyVars["--font-family-code"],
    fontSize: textSizeVars["--font-size-sm"],
    lineHeight: 1.65,
    paddingBlock: spacingVars["--spacing-4"],
    paddingInline: 0,
  },
  line: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    paddingInline: spacingVars["--spacing-4"],
  },
  lineHighlight: {
    backgroundColor: "rgba(121, 192, 255, 0.14)",
    boxShadow: "inset 2px 0 0 #79c0ff",
  },
  lineNumber: {
    color: "rgba(230, 237, 243, 0.65)",
    minWidth: "2.75em",
    paddingInlineEnd: spacingVars["--spacing-3"],
    textAlign: "right",
    userSelect: "none",
  },
  lineText: {
    whiteSpace: "pre",
  },
  lineTextWrapped: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  symbolLink: {
    borderRadius: 3,
    cursor: "pointer",
    textDecorationColor: {
      default: "rgba(230, 237, 243, 0.4)",
      ":hover": "currentColor",
    },
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    textDecorationThickness: "1px",
    textUnderlineOffset: "3px",
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(121, 192, 255, 0.16)",
    },
  },
});
