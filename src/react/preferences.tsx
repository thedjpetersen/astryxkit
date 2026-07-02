// A settings surface generated entirely from declared schemas: groups come
// from `host.settingsGroups()`, controls are chosen by schema type
// (boolean -> switch, enum -> selector, otherwise a text input), and each
// row leans on `usePreferenceInspection` to show where its value really
// comes from. Nothing here is configured per-product — declare a schema
// and the panel renders it.

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Divider } from "@astryxdesign/core/Divider";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Layout, LayoutContent, LayoutPanel } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Section } from "@astryxdesign/core/Section";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useMemo, useState } from "react";
import type { ShellHost } from "../core/host";
import type {
  PreferenceRing,
  PreferenceSchema,
  PreferenceScope,
  PreferenceValue,
  SettingsGroup,
} from "../core/shell-sdk";
import { usePreferenceInspection, useSettingsGroups } from "./react-bindings";

const styles = stylex.create({
  contentHeader: {
    minWidth: 0,
  },
  groupList: {
    minWidth: 0,
  },
  row: {
    minWidth: 0,
    padding: "var(--spacing-4)",
  },
  settingList: {
    backgroundColor: "var(--color-background-card)",
    borderColor: "var(--color-border)",
    borderRadius: "var(--radius-container)",
    borderStyle: "solid",
    borderWidth: "var(--border-width)",
    overflow: "hidden",
  },
  settingMeta: {
    minWidth: 0,
  },
  valueControl: {
    minWidth: "min(calc(var(--size-element-lg) * 7), 100%)",
  },
});

export function ShellPreferencesPanel({
  host,
  showHeader = true,
}: {
  host: ShellHost;
  showHeader?: boolean;
}) {
  const groups = useSettingsGroups(host);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const activeAppId = host.getShell().context.get<string>("appActive");
  const preferredGroup = preferredSettingsGroup(groups, activeAppId);
  const selectedGroup =
    groups.find((group) => group.id === selectedGroupId) ?? preferredGroup;
  const groupsByRing = useMemo(() => groupSettingsByRing(groups), [groups]);

  // The panel follows the user: when the active app changes, selection
  // jumps to that app's settings — but only then. A group the user picked
  // by hand stays put until the app context actually moves.
  useEffect(() => {
    if (groups.length === 0) {
      setSelectedGroupId("");
      return;
    }

    if (
      preferredGroup &&
      (!selectedGroup ||
        (activeAppId &&
          selectedGroup.appId !== activeAppId &&
          preferredGroup.appId === activeAppId))
    ) {
      setSelectedGroupId(preferredGroup.id);
    }
  }, [activeAppId, groups, preferredGroup, selectedGroup]);

  if (groups.length === 0 || !selectedGroup) {
    return null;
  }

  return (
    <Section padding={0} variant="transparent">
      <Layout
        height="auto"
        start={
          <LayoutPanel
            width={260}
            padding={3}
            hasDivider
            role="navigation"
            label="Preference scopes"
            isScrollable={false}
          >
            <VStack gap={4}>
              {groupsByRing.map(({ ring, groups: ringGroups }) => (
                <List
                  key={ring}
                  density="compact"
                  xstyle={styles.groupList}
                  header={
                    <VStack gap={0}>
                      <Text type="label">{ringLabel(ring)}</Text>
                      <Text type="supporting">
                        {ringGroups.length}{" "}
                        {ringGroups.length === 1 ? "group" : "groups"}
                      </Text>
                    </VStack>
                  }
                >
                  {ringGroups.map((group) => (
                    <ListItem
                      key={group.id}
                      label={group.label}
                      description={group.scope}
                      isSelected={group.id === selectedGroup.id}
                      startContent={
                        <Icon
                          icon={ringIcon(group.ring)}
                          color={
                            group.id === selectedGroup.id ? "accent" : "secondary"
                          }
                        />
                      }
                      endContent={
                        <Badge
                          label={String(group.settings.length)}
                          variant={
                            group.id === selectedGroup.id ? "blue" : "neutral"
                          }
                        />
                      }
                      onClick={() => setSelectedGroupId(group.id)}
                    />
                  ))}
                </List>
              ))}
            </VStack>
          </LayoutPanel>
        }
        content={
          <LayoutContent
            padding={showHeader ? 4 : 3}
            isScrollable={false}
            label="Preference settings"
          >
            <VStack gap={showHeader ? 5 : 4}>
              {showHeader ? (
                <HStack justify="between" align="end" gap={4} wrap="wrap">
                  <VStack gap={1} xstyle={styles.contentHeader}>
                    <Heading level={2}>Preferences</Heading>
                    <Text type="supporting">
                      Settings resolve through user, feature, application,
                      product, platform, then schema defaults.
                    </Text>
                  </VStack>
                  <Badge label={`${groups.length} groups`} variant="blue" />
                </HStack>
              ) : null}

              <PreferenceGroupContent group={selectedGroup} host={host} />
            </VStack>
          </LayoutContent>
        }
      />
    </Section>
  );
}

function PreferenceGroupContent({
  group,
  host,
}: {
  group: SettingsGroup;
  host: ShellHost;
}) {
  return (
    <VStack gap={4}>
      <HStack justify="between" align="start" gap={3} wrap="wrap">
        <VStack gap={1}>
          <HStack gap={2} align="center" wrap="wrap">
            <Heading level={3}>{group.label}</Heading>
            <Badge label={ringLabel(group.ring)} variant={ringVariant(group.ring)} />
          </HStack>
          <Text type="supporting">
            {ringLabel(group.ring)} scope - {group.scope}
          </Text>
        </VStack>
        <Badge
          label={`${group.settings.length} ${
            group.settings.length === 1 ? "setting" : "settings"
          }`}
          variant="neutral"
        />
      </HStack>

      <VStack gap={0} xstyle={styles.settingList}>
        {group.settings.map((setting, index) => (
          <VStack key={setting.key} gap={0}>
            <PreferenceRow schema={setting} host={host} />
            {index < group.settings.length - 1 ? <Divider /> : null}
          </VStack>
        ))}
      </VStack>
    </VStack>
  );
}

function PreferenceRow({
  schema,
  host,
}: {
  schema: PreferenceSchema;
  host: ShellHost;
}) {
  const sdk = host.getShell();
  const inspection = usePreferenceInspection(schema.key, sdk);
  const value = inspection.value ?? schema.defaultValue;

  return (
    <HStack justify="between" align="start" gap={4} wrap="wrap" xstyle={styles.row}>
      <VStack gap={1} xstyle={styles.settingMeta}>
        <HStack gap={2} align="center" wrap="wrap">
          <Text type="label">{schema.label}</Text>
          {inspection.scope === "default" ? null : (
            <Badge
              label={scopeLabel(inspection.scope)}
              variant={scopeVariant(inspection.scope)}
            />
          )}
        </HStack>
        <Text type="supporting" maxLines={2}>
          {schema.description ?? schema.key}
        </Text>
        {inspection.hasUserOverride || inspection.isInherited ? (
          <Text type="supporting">{sourceDescription(inspection)}</Text>
        ) : null}
      </VStack>
      <HStack gap={2} align="center" wrap="wrap">
        <PreferenceControl schema={schema} value={value} host={host} />
        {inspection.hasUserOverride ? (
          <Button
            label="Reset"
            variant="ghost"
            size="sm"
            onClick={() => sdk.preferences.reset(schema.key, "user")}
          />
        ) : null}
      </HStack>
    </HStack>
  );
}

function PreferenceControl({
  schema,
  value,
  host,
}: {
  schema: PreferenceSchema;
  value: PreferenceValue;
  host: ShellHost;
}) {
  const preferences = host.getShell().preferences;

  if (schema.type === "boolean") {
    return (
      <Switch
        label={schema.label}
        value={Boolean(value)}
        onChange={(checked) => preferences.set(schema.key, checked, "user")}
        isLabelHidden
      />
    );
  }

  if (schema.type === "enum" && schema.options) {
    return (
      <VStack gap={0} xstyle={styles.valueControl}>
        <Selector
          label={schema.label}
          options={schema.options.map((option) => ({
            label: option.label,
            value: String(option.value),
          }))}
          value={String(value)}
          onChange={(nextValue) => {
            const option = schema.options?.find(
              (item) => String(item.value) === nextValue
            );

            if (option) {
              preferences.set(schema.key, option.value, "user");
            }
          }}
          isLabelHidden
          size="sm"
        />
      </VStack>
    );
  }

  return (
    <VStack gap={0} xstyle={styles.valueControl}>
      <TextInput
        label={schema.label}
        value={String(value)}
        onChange={(nextValue) =>
          preferences.set(
            schema.key,
            parsePreferenceValue(schema, nextValue),
            "user"
          )
        }
        isLabelHidden
        size="sm"
      />
    </VStack>
  );
}

// Text inputs hand back strings; numeric schemas coerce, and garbage falls
// back to the schema default rather than throwing mid-keystroke — the
// store's own validation stays the real gate.
function parsePreferenceValue(
  schema: PreferenceSchema,
  value: string
): PreferenceValue {
  if (schema.type === "number") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : schema.defaultValue;
  }

  return value;
}

function groupSettingsByRing(groups: SettingsGroup[]) {
  const orderedRings: PreferenceRing[] = ["platform", "product", "app", "feature"];

  return orderedRings
    .map((ring) => ({
      ring,
      groups: groups.filter((group) => group.ring === ring),
    }))
    .filter((item) => item.groups.length > 0);
}

// The default selection walks from most relevant to most general: the
// active app's app-ring group, any group the active app owns, then the
// first app, product, or platform group the panel has.
function preferredSettingsGroup(groups: SettingsGroup[], activeAppId?: string) {
  if (activeAppId) {
    const activeAppGroup = groups.find(
      (group) => group.appId === activeAppId && group.ring === "app"
    );

    if (activeAppGroup) {
      return activeAppGroup;
    }

    const activeGroup = groups.find((group) => group.appId === activeAppId);

    if (activeGroup) {
      return activeGroup;
    }
  }

  return (
    groups.find((group) => group.ring === "app") ??
    groups.find((group) => group.ring === "product") ??
    groups.find((group) => group.ring === "platform") ??
    groups[0]
  );
}

function scopeLabel(scope: PreferenceScope) {
  if (scope === "default") {
    return "Default";
  }

  if (scope === "user") {
    return "Customized";
  }

  return scope[0].toUpperCase() + scope.slice(1);
}

function scopeVariant(scope: PreferenceScope) {
  if (scope === "user") {
    return "success";
  }

  if (scope === "app") {
    return "blue";
  }

  if (scope === "feature") {
    return "purple";
  }

  if (scope === "product") {
    return "teal";
  }

  if (scope === "platform") {
    return "cyan";
  }

  return "neutral";
}

function ringIcon(ring: PreferenceRing) {
  if (ring === "platform") {
    return "viewColumns";
  }

  if (ring === "product") {
    return "checkDouble";
  }

  if (ring === "feature") {
    return "wrench";
  }

  return "copy";
}

function ringLabel(ring: PreferenceRing) {
  if (ring === "app") {
    return "Application";
  }

  return ring[0].toUpperCase() + ring.slice(1);
}

function ringVariant(ring: PreferenceRing) {
  if (ring === "platform") {
    return "cyan";
  }

  if (ring === "product") {
    return "teal";
  }

  if (ring === "feature") {
    return "purple";
  }

  return "blue";
}

function sourceDescription(
  inspection: ReturnType<typeof usePreferenceInspection>
) {
  if (inspection.hasUserOverride) {
    return `Customized - reset falls back to ${inspection.source.ring}:${inspection.source.scope}`;
  }

  if (inspection.isDefault) {
    return "Using schema default";
  }

  if (inspection.isInherited) {
    return `Inherited from ${inspection.source.ring}:${inspection.source.scope}`;
  }

  return `Set at ${inspection.source.ring}:${inspection.source.scope}`;
}
