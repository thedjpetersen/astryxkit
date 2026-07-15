// The palette is a Dialog over `host.paletteResults()` — all ranking,
// prefix parsing, and recents live in the shell SDK, so this component
// only owns interaction state: the query, the keyboard selection, and
// `drillParent` for descending into a command's children. Enter runs or
// drills, ArrowRight drills, Backspace on an empty query backs out.

import { CommandPaletteFooter } from "@astryxdesign/core/CommandPalette";
import { Button } from "@astryxdesign/core/Button";
import { Dialog } from "@astryxdesign/core/Dialog";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Kbd } from "@astryxdesign/core/Kbd";
import { List, ListItem } from "@astryxdesign/core/List";
import { Section } from "@astryxdesign/core/Section";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import * as stylex from "@stylexjs/stylex";
import {
  type ShellCommandPaletteItem,
  useShellCommandPaletteModel,
} from "app-foundry/react";
import type {
  CommandShortcut,
  ShellHost,
} from "app-foundry/core";

const styles = stylex.create({
  footer: {
    backgroundColor: "var(--color-background-muted)",
    borderBlockStartColor: "var(--color-border)",
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "var(--border-width)",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: "var(--spacing-2)",
  },
  header: {
    borderBlockEndColor: "var(--color-border)",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "var(--border-width)",
  },
  results: {
    maxHeight:
      "min(calc(var(--size-element-lg) * 11), calc(100vh - var(--spacing-12)))",
    minHeight: "calc(var(--size-element-lg) * 5)",
    overflowY: "auto",
  },
  rowMeta: {
    minWidth: 0,
  },
});

export function ShellCommandPalette({
  host,
  isOpen,
  onOpenChange,
  onRouteQuery,
}: {
  host: ShellHost;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRouteQuery?: (query: string) => void;
}) {
  const model = useShellCommandPaletteModel({ host, isOpen, onOpenChange });
  const routeQuery = () => {
    const query = model.query.trim();
    if (!query || !onRouteQuery) return;
    onOpenChange(false);
    onRouteQuery(query);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      width="min(760px, calc(100vw - var(--spacing-8)))"
      maxHeight="min(680px, calc(100vh - var(--spacing-8)))"
      purpose="info"
      aria-label="Workspace command palette"
    >
      <VStack gap={0} onKeyDown={model.handleKeyDown}>
        <Section padding={3} variant="transparent" xstyle={styles.header}>
          <TextInput
            label="Command palette search"
            value={model.query}
            onChange={model.setQuery}
            placeholder={model.placeholder}
            startIcon={model.isDrilling ? "chevronRight" : "search"}
            hasAutoFocus
            hasClear
            isLabelHidden
          />
        </Section>

        <Section padding={2} variant="transparent">
          <VStack gap={3} xstyle={styles.results}>
            {model.groups.length > 0 ? (
              <VStack gap={3}>
                {model.isApproximateResults ? (
                  <VStack gap={0.5}>
                    <Text type="label">No exact command matches</Text>
                    <Text type="supporting">These commands are the closest available actions.</Text>
                  </VStack>
                ) : null}
                {model.groups.map((group) => (
                  <List
                    key={group.label}
                    density="compact"
                    header={
                      <Text type="supporting" weight="medium">
                        {group.label}
                      </Text>
                    }
                  >
                    {group.items.map((item) => (
                      <CommandListItem
                        key={item.id}
                        item={item}
                        isSelected={model.items[model.selectedIndex]?.id === item.id}
                        onSelect={() => model.executeItem(item)}
                      />
                    ))}
                  </List>
                ))}
                {model.isApproximateResults && onRouteQuery ? (
                  <Button
                    label={`Ask Lilo about “${truncateQuery(model.query)}”`}
                    variant="secondary"
                    size="sm"
                    icon={<Icon icon="info" />}
                    onClick={routeQuery}
                  />
                ) : null}
              </VStack>
            ) : (
              <VStack gap={2} align="center">
                <Icon icon="search" color="secondary" />
                <Text type="label">No exact command matches</Text>
                <Text type="supporting">
                  Try another action, or send the query to Lilo.
                </Text>
                {onRouteQuery && model.query.trim() ? (
                  <Button
                    label={`Ask Lilo about “${truncateQuery(model.query)}”`}
                    variant="secondary"
                    size="sm"
                    icon={<Icon icon="info" />}
                    onClick={routeQuery}
                  />
                ) : null}
              </VStack>
            )}
          </VStack>
        </Section>

        <Section padding={0} variant="transparent">
          <CommandPaletteFooter xstyle={styles.footer}>
            <ShellCommandPaletteFooter isDrilling={model.isDrilling} />
          </CommandPaletteFooter>
        </Section>
      </VStack>
    </Dialog>
  );
}

function truncateQuery(query: string) {
  const trimmed = query.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 39)}…` : trimmed;
}

function CommandListItem({
  item,
  isSelected,
  onSelect,
}: {
  item: ShellCommandPaletteItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const childCount =
    item.command.childCount ?? item.command.children?.length ?? 0;
  const endContent =
    item.shortcut || childCount > 0 ? (
      <HStack gap={2} align="center">
        {item.shortcut ? <Kbd keys={shortcutToKbd(item.shortcut)} /> : null}
        {childCount > 0 ? (
          <Icon icon="chevronRight" color="secondary" />
        ) : null}
      </HStack>
    ) : undefined;

  return (
    <ListItem
      label={item.label}
      description={
        <Text type="supporting" maxLines={1} xstyle={styles.rowMeta}>
          {item.description}
        </Text>
      }
      isSelected={isSelected}
      endContent={endContent}
      onClick={onSelect}
    />
  );
}

function ShellCommandPaletteFooter({ isDrilling }: { isDrilling: boolean }) {
  return (
    <HStack justify="between" align="center" gap={3} wrap="wrap" width="100%">
      <HStack gap={4} align="center" wrap="wrap">
        <HStack gap={1} align="center">
          <Kbd keys="up" />
          <Kbd keys="down" />
          <Text type="supporting">Navigate</Text>
        </HStack>
        <HStack gap={1} align="center">
          <Kbd keys="enter" />
          <Text type="supporting">Run</Text>
        </HStack>
        <HStack gap={1} align="center">
          <Kbd keys="escape" />
          <Text type="supporting">{isDrilling ? "Back" : "Close"}</Text>
        </HStack>
        {isDrilling ? (
          <HStack gap={1} align="center">
            <Kbd keys="left" />
            <Text type="supporting">Back</Text>
          </HStack>
        ) : null}
      </HStack>
      <HStack gap={3} align="center" wrap="wrap">
        <HStack gap={1} align="center">
          <Kbd keys=">" />
          <Text type="supporting">Actions</Text>
        </HStack>
        <HStack gap={1} align="center">
          <Kbd keys="/" />
          <Text type="supporting">Pages</Text>
        </HStack>
        <HStack gap={1} align="center">
          <Kbd keys="@" />
          <Text type="supporting">Entities</Text>
        </HStack>
        <HStack gap={1} align="center">
          <Kbd keys="?" />
          <Text type="supporting">Help</Text>
        </HStack>
      </HStack>
    </HStack>
  );
}

function shortcutToKbd(shortcut: CommandShortcut) {
  return [
    ...(shortcut.modifiers ?? []).map((modifier) =>
      modifier === "meta" ? "mod" : modifier,
    ),
    shortcut.key,
  ].join("+");
}
