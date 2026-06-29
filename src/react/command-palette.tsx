import { Badge } from "@astryxdesign/core/Badge";
import { CommandPaletteFooter } from "@astryxdesign/core/CommandPalette";
import { Dialog } from "@astryxdesign/core/Dialog";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon, type IconColor, type IconName } from "@astryxdesign/core/Icon";
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
  icon: IconName;
  iconColor: IconColor;
  id: string;
  isBackItem?: boolean;
  label: string;
  result?: RankedCommandResult;
  ringLabel: string;
  shortcodes: string[];
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
  glyph: {
    alignItems: "center",
    backgroundColor: "var(--color-background-muted)",
    borderColor: "var(--color-border)",
    borderRadius: "var(--radius-element)",
    borderStyle: "solid",
    borderWidth: "var(--border-width)",
    display: "inline-flex",
    justifyContent: "center",
    minHeight: "var(--size-element-md)",
    minWidth: "var(--size-element-md)",
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
  shortcodeToken: {
    backgroundColor: "var(--color-background-muted)",
    borderColor: "var(--color-border)",
    borderRadius: "var(--radius-inner)",
    borderStyle: "solid",
    borderWidth: "var(--border-width)",
    paddingBlock: "var(--spacing-0-5)",
    paddingInline: "var(--spacing-1)",
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
                    <HStack justify="between" align="center" gap={3}>
                      <Text type="supporting" weight="medium">
                        {group.label}
                      </Text>
                      <Badge
                        label={String(group.items.length)}
                        variant="neutral"
                      />
                    </HStack>
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

  return (
    <ListItem
      label={item.label}
      description={
        <VStack gap={0} xstyle={styles.rowMeta}>
          <Text type="supporting" maxLines={1}>
            {item.description}
          </Text>
          <Text type="code" color="secondary" maxLines={1}>
            {item.command.id}
          </Text>
          {item.shortcodes.length > 0 ? (
            <HStack gap={1} align="center" wrap="wrap">
              {item.shortcodes.map((shortcode) => (
                <Text
                  key={shortcode}
                  type="code"
                  color="secondary"
                  xstyle={styles.shortcodeToken}
                >
                  {shortcode}
                </Text>
              ))}
            </HStack>
          ) : null}
        </VStack>
      }
      isSelected={isSelected}
      startContent={
        <HStack gap={0} xstyle={styles.glyph}>
          <Icon icon={item.icon} color={item.iconColor} size="sm" />
        </HStack>
      }
      endContent={
        <HStack gap={2} align="center">
          {item.shortcut ? <Kbd keys={shortcutToKbd(item.shortcut)} /> : null}
          {childCount > 0 ? (
            <Badge label={`${childCount} actions`} variant="blue" />
          ) : (
            <Badge
              label={item.ringLabel}
              variant={ringVariant(item.command.ring)}
            />
          )}
          {childCount > 0 ? (
            <Icon icon="chevronRight" color="secondary" />
          ) : null}
        </HStack>
      }
      onClick={onSelect}
    />
  );
}

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
    icon: "chevronLeft",
    iconColor: "secondary",
    isBackItem: true,
    ringLabel: "Back",
    shortcodes: [],
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
    icon: toIconName(command.icon),
    iconColor: iconColorForResult(result),
    result,
    ringLabel: ringLabel(result.source.ring),
    shortcodes: command.shortcodes ?? [],
    shortcut: command.shortcut,
  };
}

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

function iconColorForResult(result: RankedCommandResult): IconColor {
  if (result.source.ring === "feature") {
    return "accent";
  }

  if (result.source.ring === "product") {
    return "success";
  }

  return "secondary";
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

function ringVariant(ring?: string) {
  if (ring === "feature") {
    return "purple";
  }

  if (ring === "app") {
    return "blue";
  }

  if (ring === "product") {
    return "teal";
  }

  return "neutral";
}

function shortcutToKbd(shortcut: CommandShortcut) {
  return [
    ...(shortcut.modifiers ?? []).map((modifier) =>
      modifier === "meta" ? "mod" : modifier,
    ),
    shortcut.key,
  ].join("+");
}

function toIconName(icon?: string): IconName {
  const allowedIcons: IconName[] = [
    "arrowDown",
    "arrowUp",
    "arrowsUpDown",
    "calendar",
    "check",
    "checkDouble",
    "chevronDown",
    "chevronLeft",
    "chevronRight",
    "clock",
    "close",
    "copy",
    "error",
    "externalLink",
    "eyeSlash",
    "funnel",
    "info",
    "menu",
    "microphone",
    "moreHorizontal",
    "search",
    "stop",
    "success",
    "viewColumns",
    "warning",
    "wrench",
  ];

  return allowedIcons.includes(icon as IconName)
    ? (icon as IconName)
    : "wrench";
}
