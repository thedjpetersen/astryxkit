import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Section } from "@astryxdesign/core/Section";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { createRoot } from "react-dom/client";
import {
  AstryxKitProvider,
  ShellAppOutlet,
  ShellFrame,
  ShellHost,
  type ShellAppActivationContext,
  type ShellAppInstance,
  type ShellAppManifest,
} from "astryxkit";

const workspace = {
  name: "Northstar",
  slug: "northstar",
};

const host = new ShellHost({
  defaultDocsRoute: "/docs",
});

const catalogManifest: ShellAppManifest = {
  id: "catalog",
  name: "Catalog",
  description: "A small example app module.",
  entryUrl: "/src/main.tsx",
  ownerTeam: "Platform",
  route: "/app/catalog",
  icon: "viewColumns",
  commands: [
    {
      id: "catalog.open",
      appId: "catalog",
      category: "Apps",
      title: "Open Catalog",
      route: "/app/catalog",
      icon: "viewColumns",
      kind: "page",
    },
    {
      id: "catalog.refresh",
      appId: "catalog",
      category: "Catalog",
      title: "Refresh Catalog",
      icon: "check",
      when: "appActive == 'catalog'",
    },
  ],
  preferences: [
    {
      key: "catalog.density",
      appId: "catalog",
      category: "Display",
      label: "Density",
      description: "Controls how much spacing the catalog app uses.",
      type: "enum",
      defaultValue: "comfortable",
      options: [
        { label: "Compact", value: "compact" },
        { label: "Comfortable", value: "comfortable" },
        { label: "Spacious", value: "spacious" },
      ],
    },
  ],
  load: async () => ({
    activate,
  }),
};

host.register(catalogManifest);

function activate(context: ShellAppActivationContext): ShellAppInstance {
  context.disposeWithApp(
    context.shell.commands.bind("catalog.refresh", () => {
      context.shell.events.emit("catalog.refreshed", {
        refreshedAt: new Date().toISOString(),
      });
    })
  );

  return {
    dispose() {},
    render: () => <CatalogApp />,
  };
}

function CatalogApp() {
  return (
    <Section padding={6} variant="transparent">
      <VStack gap={5}>
        <VStack gap={1}>
          <Heading level={1}>Catalog</Heading>
          <Text type="supporting">
            This example app is registered by manifest, activated lazily, and
            controlled through the shared shell runtime.
          </Text>
        </VStack>
        <HStack gap={2} align="center" wrap="wrap">
          <Button
            label="Run refresh command"
            variant="primary"
            onClick={() => void host.runCommand("catalog.refresh")}
          />
          <Button
            label="Open preferences"
            variant="secondary"
            onClick={() => void host.runCommand("platform.openPreferences")}
          />
        </HStack>
      </VStack>
    </Section>
  );
}

function App() {
  return (
    <AstryxKitProvider>
      <ShellFrame
        host={host}
        workspace={workspace}
        brandName="AstryxKit"
        currentPathname="/app/catalog"
      >
        <ShellAppOutlet
          appId="catalog"
          host={host}
          workspace={workspace}
          route={{ pathname: "/app/catalog", slug: "catalog" }}
          navigate={(href) => host.navigate(href)}
        />
      </ShellFrame>
    </AstryxKitProvider>
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

createRoot(root).render(<App />);
