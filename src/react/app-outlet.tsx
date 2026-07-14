import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type {
  MicroAppRoute,
  ShellHost,
  WorkspaceContext,
} from "app-foundry/core";
import {
  ShellAppBoundary,
  type ShellAppErrorViewProps,
  useShellAppOutlet,
} from "app-foundry/react";
import type { ErrorInfo, ReactNode } from "react";

export type ShellAppErrorBoundaryProps = {
  appId: string;
  appName: string;
  children: ReactNode;
  ownerTeam?: string;
  resetKey: string;
  onError?: (error: unknown, info: ErrorInfo) => void;
};

/** AstryxKit's error renderer over App Foundry's neutral error isolation. */
export function ShellAppErrorBoundary(props: ShellAppErrorBoundaryProps) {
  return <ShellAppBoundary {...props} renderError={ShellAppErrorFallback} />;
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
  const state = useShellAppOutlet({ appId, host, navigate, route, workspace });

  if (state.status === "unavailable") {
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

  if (state.status === "loading") {
    return (
      <Card padding={4} variant="muted">
        <HStack justify="between" align="center" gap={3}>
          <VStack gap={0}>
            <Text type="label">Loading {state.manifest.name}</Text>
            <Text type="supporting">{state.manifest.ownerTeam}</Text>
          </VStack>
          <Badge label="Module" variant="neutral" />
        </HStack>
      </Card>
    );
  }

  return (
    <ShellAppErrorBoundary
      appId={state.manifest.id}
      appName={state.manifest.name}
      ownerTeam={state.manifest.ownerTeam}
      resetKey={state.resetKey}
    >
      {state.instance.render?.(state.renderProps) ?? null}
    </ShellAppErrorBoundary>
  );
}

function ShellAppErrorFallback({
  appName,
  error,
  ownerTeam,
  retry,
}: ShellAppErrorViewProps) {
  return (
    <Card padding={5} variant="muted">
      <VStack gap={3}>
        <HStack justify="between" align="center" gap={3} wrap="wrap">
          <VStack gap={0}>
            <Heading level={2}>{appName} failed to render</Heading>
            {ownerTeam ? <Text type="supporting">{ownerTeam}</Text> : null}
          </VStack>
          <Badge label="Render error" variant="error" />
        </HStack>
        <Text type="supporting">
          The app surface crashed. The rest of the shell is still available.
        </Text>
        {error.message ? (
          <Text type="code" maxLines={2}>
            {error.message}
          </Text>
        ) : null}
        <HStack gap={2}>
          <Button label="Retry app" variant="primary" size="sm" onClick={retry} />
        </HStack>
      </VStack>
    </Card>
  );
}
