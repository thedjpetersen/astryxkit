import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import {
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type {
  MicroAppRoute,
  ShellAppRenderProps,
  ShellHost,
  ShellTopNavMountArea,
  WorkspaceContext,
} from "../core/host";
import {
  shell,
  type CommandContribution,
  type CommandSourceContribution,
  type ShellSDK,
} from "../core/shell-sdk";

export function useVisibleCommands(host: ShellHost): CommandContribution[] {
  const version = useHostVersion(host);

  return useMemo(() => host.paletteItems(), [host, version]);
}

export function useCommandSource(
  source: CommandSourceContribution,
  sdk: ShellSDK = shell()
) {
  useEffect(() => {
    const registration = sdk.commands.registerSource(source);

    return () => {
      registration.dispose();
    };
  }, [sdk, source]);
}

export function useEntityActions({
  appId,
  entities,
  id,
  label,
  priority,
  sdk = shell(),
}: {
  appId: string;
  entities: CommandContribution[];
  id: string;
  label: string;
  priority?: number;
  sdk?: ShellSDK;
}) {
  const source = useMemo<CommandSourceContribution>(
    () => ({
      id,
      appId,
      label,
      commands: entities,
      priority,
      ring: "feature",
    }),
    [appId, entities, id, label, priority]
  );

  useCommandSource(source, sdk);
}

export function useSettingsGroups(host: ShellHost) {
  const version = useHostVersion(host);

  return useMemo(() => host.settingsGroups(), [host, version]);
}

export function useShellTopNavMounts(
  host: ShellHost,
  area?: ShellTopNavMountArea,
) {
  const version = useHostVersion(host);

  return useMemo(() => host.topNavMounts(area), [area, host, version]);
}

export function useShellTopNavMount({
  appId,
  area,
  content,
  host,
  id,
  order,
}: {
  appId?: string;
  area: ShellTopNavMountArea;
  content: ReactNode;
  host: ShellHost;
  id: string;
  order?: number;
}) {
  useEffect(() => {
    const registration = host.mountTopNav({
      appId,
      area,
      content,
      id,
      order,
    });

    return () => {
      registration.dispose();
    };
  }, [appId, area, host, id, order]);

  useEffect(() => {
    host.updateTopNavMount({
      appId,
      area,
      content,
      id,
      order,
    });
  }, [appId, area, content, host, id, order]);
}

export function useShellSideNavMounts(host: ShellHost) {
  const version = useHostVersion(host);

  return useMemo(() => host.sideNavMounts(), [host, version]);
}

export function useShellSideNavMount({
  appId,
  content,
  host,
  id,
  order,
}: {
  appId?: string;
  content: ReactNode;
  host: ShellHost;
  id: string;
  order?: number;
}) {
  useEffect(() => {
    const registration = host.mountSideNav({
      appId,
      content,
      id,
      order,
    });

    return () => {
      registration.dispose();
    };
  }, [appId, host, id, order]);

  useEffect(() => {
    host.updateSideNavMount({
      appId,
      content,
      id,
      order,
    });
  }, [appId, content, host, id, order]);
}

export function useShellTopNavHeader({
  appId,
  content,
  host,
  id,
  order,
}: {
  appId?: string;
  content: ReactNode;
  host: ShellHost;
  id: string;
  order?: number;
}) {
  useShellTopNavMount({
    appId,
    area: "header",
    content,
    host,
    id,
    order,
  });
}

export function useHostVersion(host: ShellHost) {
  return useSyncExternalStore(
    (listener) => host.subscribe(listener).dispose,
    () => host.snapshotVersion(),
    () => host.snapshotVersion()
  );
}

function usePreferenceVersion(sdk: ShellSDK) {
  return useSyncExternalStore(
    (listener) => sdk.preferences.subscribe(listener).dispose,
    () => sdk.preferences.snapshotVersion(),
    () => sdk.preferences.snapshotVersion()
  );
}

export function usePreferenceInspection(key: string, sdk: ShellSDK = shell()) {
  const version = usePreferenceVersion(sdk);

  return useMemo(() => sdk.preferences.inspect(key), [key, sdk, version]);
}

export function useContextKey<TValue>(
  key: string,
  fallback: TValue,
  sdk: ShellSDK = shell()
): TValue {
  return useSyncExternalStore(
    (listener) => sdk.context.subscribe(listener).dispose,
    () => {
      const value =
        sdk.context.get<TValue & (string | number | boolean | null)>(key);
      return value === undefined ? fallback : (value as TValue);
    },
    () => fallback
  );
}

export function ShellAppOutlet({
  appId,
  host,
  navigate,
  route,
  workspace,
}: {
  appId: string;
  host: ShellHost;
  navigate: (href: string) => void;
  route: MicroAppRoute;
  workspace: WorkspaceContext;
}) {
  const hostVersion = useHostVersion(host);
  const activeApp = useSyncExternalStore(
    (listener) => host.subscribe(listener).dispose,
    () => host.activeApp(),
    () => host.activeApp()
  );

  useEffect(() => {
    let isCancelled = false;

    void host.activate(appId).catch(() => {
      if (!isCancelled) {
        host.deactivate(appId);
      }
    });

    return () => {
      isCancelled = true;
      host.deactivate(appId);
    };
  }, [appId, host]);

  const manifest = useMemo(
    () => host.getManifest(appId),
    [appId, host, hostVersion]
  );

  if (!manifest) {
    return (
      <Card padding={5} variant="muted">
        <VStack gap={2}>
          <Heading level={2}>App module unavailable</Heading>
          <Text type="supporting">
            This app is in the catalog, but it has not been registered with the shell.
          </Text>
        </VStack>
      </Card>
    );
  }

  if (activeApp?.manifest.id !== appId) {
    return (
      <Card padding={4} variant="muted">
        <HStack justify="between" align="center" gap={3}>
          <VStack gap={0}>
            <Text type="label">Loading {manifest.name}</Text>
            <Text type="supporting">{manifest.ownerTeam}</Text>
          </VStack>
          <Badge label="Module" variant="neutral" />
        </HStack>
      </Card>
    );
  }

  const renderProps: ShellAppRenderProps = {
    host,
    manifest,
    navigate,
    route,
    shell: host.getShell(),
    workspace,
  };

  return activeApp.instance.render ? activeApp.instance.render(renderProps) : null;
}
