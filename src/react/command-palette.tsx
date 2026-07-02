// The palette is a Dialog over `host.paletteResults()` — all ranking,
// prefix parsing, and recents live in the shell SDK, so this component
// only owns interaction state: the query, the keyboard selection, and
// `drillParent` for descending into a command's children. Enter runs or
// drills, ArrowRight drills, Backspace on an empty query backs out.

import { CommandPaletteFooter } from "@astryxdesign/core/CommandPalette";
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
import { useEffect, useMemo, useState } from "react";
import type { ShellHost } from "../core/host";
import type {
  CommandContribution,
  CommandShortcut,
  RankedCommandResult,
} from "../core/shell-sdk";
import { useVisibleCommands } from "./react-bindings";

type ShellCommandItem = {
  command: CommandContribution;
  description: string;
  group: string;
  id: string;
  isBackItem?: boolean;
  label: string;
  result?: RankedCommandResult;
  shortcut?: CommandShortcut;
};

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
}: {
  host: ShellHost;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const visibleCommands = useVisibleCommands(host);
  const [query, setQuery] = useState("");
  const [drillParent, setDrillParent] = useState<CommandContribution>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const items = useMemo(
    () => buildCommandItems(host, query, drillParent),
    [drillParent, host, query, visibleCommands],
  );
  const groups = useMemo(() => groupCommandItems(items), [items]);
  const placeholder = drillParent
    ? `Search ${drillParent.title} actions`
    : "Search actions, pages, entities";

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    } else {
      setDrillParent(undefined);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex((currentIndex) =>
      items.length === 0 ? 0 : Math.min(currentIndex, items.length - 1),
    );
  }, [items.length]);

  // Selection resolves to one of three intents: the synthetic back row
  // pops the drill, a command with children pushes into it, and anything
  // else closes the palette and runs. Query and cursor reset on every
  // level change so each list starts fresh.
  function executeItem(item: ShellCommandItem | undefined) {
    if (!item) {
      return;
    }

    if (item.isBackItem) {
      setDrillParent(undefined);
      setQuery("");
      setSelectedIndex(0);
      return;
    }

    if (item.command.children && item.command.children.length > 0) {
      setDrillParent(item.command);
      setQuery("");
      setSelectedIndex(0);
      return;
    }

    onOpenChange(false);
    void host.runCommand(item.command.id);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((currentIndex) =>
        items.length === 0 ? 0 : Math.min(currentIndex + 1, items.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "ArrowRight") {
      const item = items[selectedIndex];

      if (item?.command.children?.length) {
        event.preventDefault();
        executeItem(item);
      }

      return;
    }

    if (event.key === "ArrowLeft") {
      if (drillParent) {
        event.preventDefault();
        setDrillParent(undefined);
        setQuery("");
        setSelectedIndex(0);
      }

      return;
    }

    if (event.key === "Backspace" && query.length === 0 && drillParent) {
      event.preventDefault();
      setDrillParent(undefined);
      setSelectedIndex(0);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      executeItem(items[selectedIndex]);
      return;
    }

    if (event.key === "Escape") {
      if (drillParent) {
        event.preventDefault();
        setDrillParent(undefined);
        setQuery("");
        setSelectedIndex(0);
        return;
      }

      onOpenChange(false);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      width="min(760px, calc(100vw - var(--spacing-8)))"
      maxHeight="min(680px, calc(100vh - var(--spacing-8)))"
      purpose="info"
      aria-label="Workspace command palette"
    >
      <VStack gap={0} onKeyDown={handleKeyDown}>
        <Section padding={3} variant="transparent" xstyle={styles.header}>
          <TextInput
            label="Command palette search"
            value={query}
            onChange={setQuery}
            placeholder={placeholder}
            startIcon={drillParent ? "chevronRight" : "search"}
            hasAutoFocus
            hasClear
            isLabelHidden
          />
        </Section>

        <Section padding={2} variant="transparent">
          <VStack gap={3} xstyle={styles.results}>
            {groups.length > 0 ? (
              groups.map((group) => (
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
                      isSelected={items[selectedIndex]?.id === item.id}
                      onSelect={() => executeItem(item)}
                    />
                  ))}
                </List>
              ))
            ) : (
              <VStack gap={2} align="center">
                <Icon icon="search" color="secondary" />
                <Text type="label">No matching commands</Text>
                <Text type="supporting">
                  Try a different action, page, or entity.
                </Text>
              </VStack>
            )}
          </VStack>
        </Section>

        <Section padding={0} variant="transparent">
          <CommandPaletteFooter xstyle={styles.footer}>
            <ShellCommandPaletteFooter isDrilling={drillParent != null} />
          </CommandPaletteFooter>
        </Section>
      </VStack>
    </Dialog>
  );
}

function CommandListItem({
  item,
  isSelected,
  onSelect,
}: {
  item: ShellCommandItem;
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

// Two modes, one item shape. Drilled in, the list is a synthetic back row
// plus the parent's ranked children; at the top level it is the ranked
// palette results. Everything downstream (grouping, rendering, keyboard
// movement) is mode-blind.
function buildCommandItems(
  host: ShellHost,
  query: string,
  drillParent?: CommandContribution,
): ShellCommandItem[] {
  if (drillParent) {
    return [
      createBackItem(drillParent),
      ...host
        .paletteChildResults(drillParent.id, query)
        .map((result) => commandToItem(result.command, result, drillParent)),
    ];
  }

  return host
    .paletteResults(query)
    .map((result) => commandToItem(result.command, result));
}

// The back row is a synthetic command that is never executed — `isBackItem`
// short-circuits in `executeItem` — but shaping it like a command lets the
// list render one item type with no special cases.
function createBackItem(parent: CommandContribution): ShellCommandItem {
  const command: CommandContribution = {
    id: "platform.paletteBack",
    appId: "platform",
    category: "Navigation",
    title: "Back to all commands",
    description: parent.title,
    icon: "chevronLeft",
    kind: "action",
  };

  return {
    id: command.id,
    label: command.title,
    command,
    description: parent.title,
    group: `${parent.title} actions`,
    isBackItem: true,
  };
}

function commandToItem(
  command: CommandContribution,
  result: RankedCommandResult,
  drillParent?: CommandContribution,
): ShellCommandItem {
  return {
    id: command.id,
    label: command.title,
    command,
    description: command.description ?? command.id,
    group: groupLabelForResult(result, drillParent),
    result,
    shortcut: command.shortcut,
  };
}

// Grouping preserves rank order twice over: groups appear in the order
// their best item ranked, and items keep their order within each group —
// no re-sorting sneaks in behind the ranking's back.
function groupCommandItems(items: ShellCommandItem[]) {
  const groups: Array<{ label: string; items: ShellCommandItem[] }> = [];

  for (const item of items) {
    const existingGroup = groups.find((group) => group.label === item.group);

    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      groups.push({
        label: item.group,
        items: [item],
      });
    }
  }

  return groups;
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

function groupLabelForResult(
  result: RankedCommandResult,
  drillParent?: CommandContribution,
) {
  if (drillParent) {
    return `${drillParent.title} actions`;
  }

  if (result.isRecent) {
    return "Recent";
  }

  return `${result.source.label} - ${ringLabel(result.source.ring)}`;
}

function ringLabel(ring?: string) {
  if (ring === "feature") {
    return "Feature";
  }

  if (ring === "app") {
    return "App";
  }

  if (ring === "product") {
    return "Product";
  }

  return "Platform";
}

function shortcutToKbd(shortcut: CommandShortcut) {
  return [
    ...(shortcut.modifiers ?? []).map((modifier) =>
      modifier === "meta" ? "mod" : modifier,
    ),
    shortcut.key,
  ].join("+");
}
