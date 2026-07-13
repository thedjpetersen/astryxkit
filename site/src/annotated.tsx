import { Badge, Code, Heading, Link, Text } from "@astryxdesign/core";
import {
  borderVars,
  colorVars,
  radiusVars,
  spacingVars,
} from "@astryxdesign/core/theme/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { Fragment, useEffect, useMemo, useState } from "react";
import { CodeListing } from "./code";
import {
  languageForPath,
  parseAnnotatedSections,
  sourceModules,
  symbolIndex,
  type SourceModule,
} from "./source-data";

const REPO_BLOB_URL = "https://github.com/thedjpetersen/astryxkit/blob/main";

/** `code` backticks in comment prose become inline code. */
function renderInlineCode(text: string) {
  const parts = text.split(/`([^`]+)`/g);

  return parts.map((part, index) =>
    index % 2 === 1 ? <Code key={index}>{part}</Code> : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

function readSymbolFromHash(hash: string): string | undefined {
  const queryStart = hash.indexOf("?");

  if (queryStart < 0) {
    return undefined;
  }

  const params = new URLSearchParams(hash.slice(queryStart + 1));
  const symbol = params.get("s");

  return symbol ?? undefined;
}

/**
 * Docco-style annotated source: comment prose in a left rail, the code it
 * describes in a continuous dark column on the right. Symbols rendered by
 * CodeListing link back into these pages.
 */
export function AnnotatedSource({ module }: { module: SourceModule }) {
  const sections = useMemo(
    () => parseAnnotatedSections(module.raw),
    [module],
  );
  const language = languageForPath(module.path);
  const [targetLine, setTargetLine] = useState<number | undefined>(undefined);

  const moduleSymbols = useMemo(
    () =>
      Array.from(symbolIndex.entries())
        .filter(([, location]) => location.moduleId === module.id)
        .sort(([, left], [, right]) => left.line - right.line)
        .map(([name, location]) => ({ line: location.line, name })),
    [module.id],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const scrollToSymbol = () => {
      const symbol = readSymbolFromHash(window.location.hash);
      const location = symbol ? symbolIndex.get(symbol) : undefined;

      if (!location || location.moduleId !== module.id) {
        setTargetLine(undefined);
        return;
      }

      setTargetLine(location.line);

      // Two frames after a settle delay so this outlives the router's own
      // scroll-to-section pass on first render of a large module.
      window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            document
              .getElementById(`${module.id}-line-${location.line}`)
              ?.scrollIntoView({ block: "center" });
          });
        });
      }, 150);
    };

    scrollToSymbol();
    window.addEventListener("hashchange", scrollToSymbol);

    return () => {
      window.removeEventListener("hashchange", scrollToSymbol);
    };
  }, [module.id, sections]);

  const moduleIndex = sourceModules.findIndex(
    (candidate) => candidate.id === module.id,
  );
  const previousModule = sourceModules[moduleIndex - 1];
  const nextModule = sourceModules[moduleIndex + 1];

  return (
    <section id={module.id} {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <section {...stylex.props(styles.headerInner)}>
          <section {...stylex.props(styles.headerTitleRow)}>
            <Heading level={1} type="display-3">
              {module.title}
            </Heading>
            <Badge label={module.surface} variant="blue" />
          </section>
          <Text as="p" display="block" color="secondary">
            {module.summary}
          </Text>
          <section {...stylex.props(styles.headerMetaRow)}>
            <Code>{module.path}</Code>
            <Link
              href={`${REPO_BLOB_URL}/${module.path}`}
              target="_blank"
              rel="noreferrer"
              isStandalone
            >
              View on GitHub
            </Link>
          </section>
          {moduleSymbols.length > 0 ? (
            <nav
              aria-label="Exported symbols"
              {...stylex.props(styles.symbolRow)}
            >
              {moduleSymbols.map((symbol) => (
                <a
                  key={symbol.name}
                  href={`#/source/${module.id}?s=${encodeURIComponent(symbol.name)}`}
                  {...stylex.props(styles.symbolChip)}
                >
                  {symbol.name}
                </a>
              ))}
            </nav>
          ) : null}
        </section>
      </header>
      <ul {...stylex.props(styles.sections)}>
        {sections.map((section, index) => {
          const codeLineCount = section.code.split("\n").length;
          const highlightLines =
            targetLine != null &&
            targetLine >= section.startLine &&
            targetLine < section.startLine + codeLineCount
              ? [targetLine - section.startLine + 1]
              : [];

          return (
            <li
              key={section.sectionStartLine}
              id={`${module.id}-part-${index}`}
              {...stylex.props(styles.sectionRow)}
            >
              <section {...stylex.props(styles.annotationCell)}>
                {section.annotation.map((paragraph, paragraphIndex) => (
                  <Text
                    key={paragraphIndex}
                    as="p"
                    display="block"
                    type="supporting"
                    color="secondary"
                  >
                    {renderInlineCode(paragraph)}
                  </Text>
                ))}
              </section>
              <section {...stylex.props(styles.codeCell)}>
                {section.code ? (
                  <CodeListing
                    code={section.code}
                    language={language}
                    frame="bare"
                    hasLineNumbers
                    startLine={section.startLine}
                    currentModuleId={module.id}
                    lineIdPrefix={`${module.id}-line-`}
                    highlightLines={highlightLines}
                  />
                ) : null}
              </section>
            </li>
          );
        })}
      </ul>
      <footer {...stylex.props(styles.footer)}>
        {previousModule ? (
          <Link href={`#/source/${previousModule.id}`} isStandalone>
            ← {previousModule.path}
          </Link>
        ) : (
          <span />
        )}
        {nextModule ? (
          <Link href={`#/source/${nextModule.id}`} isStandalone>
            {nextModule.path} →
          </Link>
        ) : (
          <span />
        )}
      </footer>
    </section>
  );
}

const ANNOTATION_BREAK = "@media (min-width: 1100px)";

const styles = stylex.create({
  page: {
    backgroundColor: colorVars["--color-background-surface"],
    scrollMarginTop: `calc(${spacingVars["--spacing-12"]} + ${spacingVars["--spacing-8"]})`,
  },
  header: {
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    paddingBlock: spacingVars["--spacing-8"],
    paddingInline: {
      default: spacingVars["--spacing-5"],
      "@media (min-width: 760px)": spacingVars["--spacing-8"],
    },
  },
  headerInner: {
    display: "grid",
    gap: spacingVars["--spacing-3"],
    justifyItems: "start",
    marginInline: "auto",
    maxWidth: 1400,
    width: "100%",
  },
  headerTitleRow: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: spacingVars["--spacing-3"],
  },
  headerMetaRow: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: spacingVars["--spacing-4"],
  },
  symbolRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: spacingVars["--spacing-2"],
    marginTop: spacingVars["--spacing-2"],
  },
  symbolChip: {
    backgroundColor: {
      default: colorVars["--color-background-muted"],
      ":hover": colorVars["--color-overlay-hover"],
    },
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-full"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    color: colorVars["--color-text-primary"],
    fontFamily: "var(--font-family-code)",
    fontSize: "12px",
    paddingBlock: "2px",
    paddingInline: spacingVars["--spacing-3"],
    textDecorationLine: "none",
  },
  sections: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    marginInline: "auto",
    maxWidth: 1400,
    padding: 0,
    width: "100%",
  },
  sectionRow: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [ANNOTATION_BREAK]: "minmax(260px, 340px) minmax(0, 1fr)",
    },
    scrollMarginTop: `calc(${spacingVars["--spacing-12"]} + ${spacingVars["--spacing-8"]})`,
  },
  annotationCell: {
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    display: "grid",
    alignContent: "start",
    gap: spacingVars["--spacing-2"],
    paddingBlock: spacingVars["--spacing-4"],
    paddingInline: {
      default: spacingVars["--spacing-5"],
      "@media (min-width: 760px)": spacingVars["--spacing-8"],
    },
  },
  codeCell: {
    backgroundColor: "#1a2652",
    borderBottomColor: "rgba(255, 255, 255, 0.07)",
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    minWidth: 0,
  },
  footer: {
    alignItems: "center",
    borderTopColor: colorVars["--color-border"],
    borderTopStyle: "solid",
    borderTopWidth: borderVars["--border-width"],
    display: "flex",
    justifyContent: "space-between",
    marginInline: "auto",
    maxWidth: 1400,
    paddingBlock: spacingVars["--spacing-6"],
    paddingInline: {
      default: spacingVars["--spacing-5"],
      "@media (min-width: 760px)": spacingVars["--spacing-8"],
    },
    width: "100%",
  },
});
