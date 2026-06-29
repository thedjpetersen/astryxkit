import {
  AppShell,
  Badge,
  Button,
  Card,
  Code,
  CodeBlock,
  Grid,
  Heading,
  HStack,
  Icon,
  Link,
  Section,
  SideNav,
  SideNavItem,
  SideNavSection,
  Text,
  TopNav,
  TopNavHeading,
  TopNavItem,
  VStack,
  type BadgeVariant,
  type CardVariant,
  type IconName,
} from "@astryxdesign/core";
import { AstryxKitProvider } from "../../src/design-system";

const packageExports = [
  {
    name: "astryxkit/core",
    label: "Core runtime",
    variant: "blue",
    badge: "blue",
    icon: "wrench",
    summary:
      "Commands, context keys, events, import maps, app manifests, activation lifecycle, and preference resolution.",
  },
  {
    name: "astryxkit/react",
    label: "React shell",
    variant: "teal",
    badge: "teal",
    icon: "menu",
    summary:
      "Shell frame, app outlet, command palette, preferences panel, and hooks for runtime state.",
  },
  {
    name: "astryxkit/design-system",
    label: "Design system",
    variant: "purple",
    badge: "purple",
    icon: "checkDouble",
    summary:
      "Astryx theme wrapper, appearance storage helpers, and shared defaults for shell products.",
  },
  {
    name: "astryxkit/worker",
    label: "Worker helpers",
    variant: "green",
    badge: "green",
    icon: "info",
    summary:
      "Small HTTP and D1 helpers for Cloudflare Workers APIs that need explicit request boundaries.",
  },
] satisfies Array<{
  name: string;
  label: string;
  variant: CardVariant;
  badge: BadgeVariant;
  icon: IconName;
  summary: string;
}>;

const architectureRows = [
  {
    title: "Shell-first composition",
    badge: "Runtime",
    badgeVariant: "info",
    body: "A ShellHost owns registration, routing, command visibility, app lifecycle, and workspace context.",
  },
  {
    title: "Layered preferences",
    badge: "State",
    badgeVariant: "purple",
    body: "Preference defaults resolve across system, workspace, team, user, and runtime layers without leaking product policy into views.",
  },
  {
    title: "Cloudflare portability",
    badge: "Workers",
    badgeVariant: "green",
    body: "Worker utilities stay intentionally narrow so applications can keep bindings, schemas, and deployment topology explicit.",
  },
] satisfies Array<{
  title: string;
  badge: string;
  badgeVariant: BadgeVariant;
  body: string;
}>;

const generatorRows = [
  {
    command: "ak g shell <product-name>",
    title: "Shell",
    variant: "blue",
    badge: "blue",
    icon: "menu",
    path: "src/shell",
    body: "Creates the host ShellHost, AstryxKitProvider, ShellFrame, and app outlet wiring for a product shell.",
  },
  {
    command: "ak g app <app-name>",
    title: "Micro-app",
    variant: "teal",
    badge: "teal",
    icon: "viewColumns",
    path: "src/apps",
    body: "Creates a manifest, lazy activation function, default commands, a starter preference, and an Astryx UI view.",
  },
  {
    command: "ak g command <app-id>.<name>",
    title: "Command",
    variant: "purple",
    badge: "purple",
    icon: "check",
    path: "src/commands",
    body: "Creates a CommandContribution and a handler binder that can be attached during app activation.",
  },
  {
    command: "ak g preference <app-id>.<name>",
    title: "Preference",
    variant: "green",
    badge: "green",
    icon: "wrench",
    path: "src/preferences",
    body: "Creates a PreferenceSchema ready to include in a ShellAppManifest settings surface.",
  },
  {
    command: "ak g worker-route <route-name>",
    title: "Worker route",
    variant: "orange",
    badge: "orange",
    icon: "externalLink",
    path: "src/worker/routes",
    body: "Creates a Cloudflare WorkerRoute module using AstryxKit JSON response helpers.",
  },
  {
    command: "ak g d1-repository <resource-name>",
    title: "D1 repository",
    variant: "cyan",
    badge: "cyan",
    icon: "info",
    path: "src/worker/repositories",
    body: "Creates a small D1 repository around requireD1Database, prepared statements, and batch helpers.",
  },
] satisfies Array<{
  command: string;
  title: string;
  variant: CardVariant;
  badge: BadgeVariant;
  icon: IconName;
  path: string;
  body: string;
}>;

const apiRows = [
  {
    title: "ShellHost",
    packageName: "astryxkit/core",
    badge: "Runtime",
    badgeVariant: "blue",
    body: "Owns app registration, activation, command routing, feature context keys, workspace navigation, and host events.",
  },
  {
    title: "ShellAppManifest",
    packageName: "astryxkit/core",
    badge: "Apps",
    badgeVariant: "teal",
    body: "Describes a micro-app: route, entry URL, commands, features, preferences, owner team, and lazy module loader.",
  },
  {
    title: "ShellFrame",
    packageName: "astryxkit/react",
    badge: "React",
    badgeVariant: "purple",
    body: "Renders the Astryx shell with navigation, command palette, preferences panel, app list, and active app content.",
  },
  {
    title: "createWorkerRouter",
    packageName: "astryxkit/worker",
    badge: "Workers",
    badgeVariant: "green",
    body: "Composes explicit WorkerRoute handlers, optional health checks, asset fallback, and JSON not-found responses.",
  },
] satisfies Array<{
  title: string;
  packageName: string;
  badge: string;
  badgeVariant: BadgeVariant;
  body: string;
}>;

const installSnippet = `npm install astryxkit @astryxdesign/core @stylexjs/stylex react react-dom`;

const cliSnippet = `ak generators
ak g shell Northstar
ak g app Catalog
ak g command catalog.refresh
ak g preference catalog.density
ak g worker-route catalog
ak g d1-repository customer`;

const runtimeSnippet = `import { ShellHost, createShellSDK } from "astryxkit/core";

const sdk = createShellSDK({ platformId: "ops-platform" });
const host = new ShellHost({
  shell: sdk,
  preferencesRoute: "/preferences",
  docsRoute: "/docs",
});

host.register({
  id: "tasks",
  name: "Tasks",
  ownerTeam: "Operations",
  route: "/app/tasks",
  entryUrl: "/app/modules/tasks.js",
  icon: "checkDouble",
  commands: [
    {
      id: "tasks.open",
      appId: "tasks",
      category: "Apps",
      title: "Open Tasks",
      route: "/app/tasks",
    },
  ],
  load: () => import("@app/tasks"),
});`;

const reactSnippet = `import { ShellAppOutlet, ShellFrame } from "astryxkit/react";

export function App() {
  return (
    <ShellFrame
      host={host}
      workspace={{ name: "Northstar", slug: "northstar" }}
      currentPathname="/app/tasks"
      brandName="Northstar">
      <ShellAppOutlet
        appId="tasks"
        host={host}
        workspace={{ name: "Northstar", slug: "northstar" }}
        route={{ pathname: "/app/tasks", slug: "tasks" }}
        navigate={(href) => host.navigate(href)}
      />
    </ShellFrame>
  );
}`;

function TopNavigation() {
  return (
    <TopNav
      label="AstryxKit documentation"
      heading={
        <TopNavHeading
          logo={<Icon icon="wrench" color="accent" />}
          heading="AstryxKit"
          subheading="Framework docs"
          headingHref="#overview"
        />
      }
      startContent={
        <>
          <TopNavItem label="Overview" href="#overview" isSelected />
          <TopNavItem label="Install" href="#install" />
          <TopNavItem label="CLI" href="#cli" />
          <TopNavItem label="APIs" href="#exports" />
          <TopNavItem label="Cloudflare" href="#cloudflare" />
        </>
      }
      endContent={
        <Button
          label="GitHub"
          href="https://github.com/thedjpetersen/astryxkit"
          target="_blank"
          rel="noreferrer"
          variant="ghost"
          icon={<Icon icon="externalLink" size="sm" />}
        />
      }
    />
  );
}

function SideNavigation() {
  return (
    <SideNav>
      <SideNavSection title="Start">
        <SideNavItem label="Overview" href="#overview" icon="info" isSelected />
        <SideNavItem label="Install" href="#install" icon="copy" />
        <SideNavItem label="CLI" href="#cli" icon="menu" />
        <SideNavItem label="Quick start" href="#quick-start" icon="check" />
      </SideNavSection>
      <SideNavSection title="Framework">
        <SideNavItem label="Package exports" href="#exports" icon="menu" />
        <SideNavItem label="Generators" href="#generators" icon="wrench" />
        <SideNavItem label="API reference" href="#api-reference" icon="viewColumns" />
        <SideNavItem label="Architecture" href="#architecture" icon="wrench" />
        <SideNavItem label="Cloudflare" href="#cloudflare" icon="warning" />
      </SideNavSection>
      <SideNavSection title="Reference">
        <SideNavItem label="Design system" href="#design-system" icon="checkDouble" />
        <SideNavItem
          label="Repository"
          href="https://github.com/thedjpetersen/astryxkit"
          icon="externalLink"
        />
      </SideNavSection>
    </SideNav>
  );
}

function ExportCard({
  badge,
  icon,
  label,
  name,
  summary,
  variant,
}: (typeof packageExports)[number]) {
  return (
    <Card variant={variant} padding={4} minHeight={180}>
      <VStack gap={3} width="100%">
        <HStack gap={2} align="center" wrap="wrap">
          <Icon icon={icon} color="primary" />
          <Badge variant={badge} label={label} />
        </HStack>
        <Heading level={3}>
          <Code>{name}</Code>
        </Heading>
        <Text as="p" display="block" color="secondary">
          {summary}
        </Text>
      </VStack>
    </Card>
  );
}

function ArchitectureCard({
  badge,
  badgeVariant,
  body,
  title,
}: (typeof architectureRows)[number]) {
  return (
    <Card padding={4} minHeight={156}>
      <VStack gap={3}>
        <HStack gap={2} align="center" wrap="wrap">
          <Icon icon="check" color="accent" />
          <Badge variant={badgeVariant} label={badge} />
        </HStack>
        <Heading level={3}>{title}</Heading>
        <Text as="p" display="block" color="secondary">
          {body}
        </Text>
      </VStack>
    </Card>
  );
}

function GeneratorCard({
  badge,
  body,
  command,
  icon,
  path,
  title,
  variant,
}: (typeof generatorRows)[number]) {
  return (
    <Card variant={variant} padding={4} minHeight={212}>
      <VStack gap={3}>
        <HStack gap={2} align="center" wrap="wrap">
          <Icon icon={icon} color="primary" />
          <Badge variant={badge} label={title} />
        </HStack>
        <VStack gap={1}>
          <Text as="p" display="block" type="label">
            <Code>{command}</Code>
          </Text>
          <Text as="p" display="block" color="secondary">
            Writes to <Code>{path}</Code>.
          </Text>
        </VStack>
        <Text as="p" display="block">
          {body}
        </Text>
      </VStack>
    </Card>
  );
}

function ApiCard({
  badge,
  badgeVariant,
  body,
  packageName,
  title,
}: (typeof apiRows)[number]) {
  return (
    <Card padding={4} minHeight={172}>
      <VStack gap={3}>
        <HStack gap={2} align="center" wrap="wrap">
          <Badge variant={badgeVariant} label={badge} />
          <Text as="p" display="block" color="secondary">
            <Code>{packageName}</Code>
          </Text>
        </HStack>
        <Heading level={3}>{title}</Heading>
        <Text as="p" display="block" color="secondary">
          {body}
        </Text>
      </VStack>
    </Card>
  );
}

export function DocsApp() {
  return (
    <AstryxKitProvider appearance="system">
      <AppShell
        height="auto"
        variant="elevated"
        contentPadding={0}
        topNav={<TopNavigation />}
        sideNav={<SideNavigation />}>
        <Section id="overview" variant="section" padding={8}>
          <VStack gap={6} width="100%">
            <HStack gap={2} wrap="wrap">
              <Badge variant="blue" label="Micro-app shell" />
              <Badge variant="teal" label="Astryx design system" />
              <Badge variant="green" label="Cloudflare Workers" />
            </HStack>
            <VStack gap={3} width="100%">
              <Heading level={1} type="display-2">
                Build Astryx-designed Workers products from a reusable shell.
              </Heading>
              <Text as="p" type="large" display="block" color="secondary">
                AstryxKit packages the runtime, React shell, design-system
                provider, and Worker helpers needed to turn product-specific
                apps into modules inside one consistent platform frame.
              </Text>
            </VStack>
            <HStack gap={2} wrap="wrap">
              <Button
                label="Install"
                href="#install"
                variant="primary"
                icon={<Icon icon="copy" size="sm" />}
              />
              <Button
                label="Read architecture"
                href="#architecture"
                variant="secondary"
                icon={<Icon icon="wrench" size="sm" />}
              />
              <Button
                label="Open GitHub"
                href="https://github.com/thedjpetersen/astryxkit"
                target="_blank"
                rel="noreferrer"
                variant="ghost"
                icon={<Icon icon="externalLink" size="sm" />}
              />
            </HStack>
          </VStack>
        </Section>

        <Section id="exports" variant="muted" padding={6}>
          <VStack gap={4} width="100%">
            <VStack gap={2}>
              <Heading level={2}>Package exports</Heading>
              <Text as="p" display="block" color="secondary">
                Each export is deliberately scoped so products can adopt the
                framework one layer at a time.
              </Text>
            </VStack>
            <Grid columns={{ minWidth: 240 }} gap={3}>
              {packageExports.map((entry) => (
                <ExportCard key={entry.name} {...entry} />
              ))}
            </Grid>
          </VStack>
        </Section>

        <Section id="install" variant="section" padding={6}>
          <VStack gap={4} width="100%">
            <VStack gap={2}>
              <Heading level={2}>Install</Heading>
              <Text as="p" display="block" color="secondary">
                AstryxKit keeps React, Astryx Core, and StyleX as peer
                dependencies so host applications own their UI runtime.
              </Text>
            </VStack>
            <CodeBlock
              title="npm"
              language="bash"
              code={installSnippet}
              width="100%"
              isWrapped
            />
          </VStack>
        </Section>

        <Section id="cli" variant="muted" padding={6}>
          <VStack gap={4} width="100%">
            <VStack gap={2}>
              <Heading level={2}>CLI</Heading>
              <Text as="p" display="block" color="secondary">
                The package ships an <Code>ak</Code> binary for Rails-like
                generators that create the repeated AstryxKit extension points
                host products need.
              </Text>
            </VStack>
            <CodeBlock
              title="ak"
              language="bash"
              code={cliSnippet}
              width="100%"
              isWrapped
            />
            <HStack gap={2} wrap="wrap">
              <Button
                label="Generator reference"
                href="#generators"
                variant="primary"
                icon={<Icon icon="chevronRight" size="sm" />}
              />
              <Button
                label="CLI source"
                href="https://github.com/thedjpetersen/astryxkit/tree/main/src/cli"
                target="_blank"
                rel="noreferrer"
                variant="ghost"
                icon={<Icon icon="externalLink" size="sm" />}
              />
            </HStack>
          </VStack>
        </Section>

        <Section id="generators" variant="section" padding={6}>
          <VStack gap={4} width="100%">
            <VStack gap={2}>
              <Heading level={2}>Generators</Heading>
              <Text as="p" display="block" color="secondary">
                Generators are scoped to stable framework concepts: shell
                composition, app manifests, command contributions, preferences,
                Worker routes, and D1 repositories.
              </Text>
            </VStack>
            <Grid columns={{ minWidth: 320 }} gap={3}>
              {generatorRows.map((entry) => (
                <GeneratorCard key={entry.command} {...entry} />
              ))}
            </Grid>
          </VStack>
        </Section>

        <Section id="quick-start" variant="muted" padding={6}>
          <VStack gap={4} width="100%">
            <VStack gap={2}>
              <Heading level={2}>Quick start</Heading>
              <Text as="p" display="block" color="secondary">
                Register modules in the runtime, then render the shell frame and
                current app outlet from the React package.
              </Text>
            </VStack>
            <Grid columns={{ minWidth: 420 }} gap={4}>
              <CodeBlock
                title="Shell runtime"
                language="ts"
                code={runtimeSnippet}
                width="100%"
                isWrapped
                maxHeight={620}
              />
              <CodeBlock
                title="React shell"
                language="tsx"
                code={reactSnippet}
                width="100%"
                isWrapped
                maxHeight={620}
              />
            </Grid>
          </VStack>
        </Section>

        <Section id="api-reference" variant="section" padding={6}>
          <VStack gap={4} width="100%">
            <VStack gap={2}>
              <Heading level={2}>API reference</Heading>
              <Text as="p" display="block" color="secondary">
                The public API is split by runtime boundary so host apps can
                adopt only the pieces they need.
              </Text>
            </VStack>
            <Grid columns={{ minWidth: 280 }} gap={3}>
              {apiRows.map((entry) => (
                <ApiCard key={entry.title} {...entry} />
              ))}
            </Grid>
          </VStack>
        </Section>

        <Section id="architecture" variant="section" padding={6}>
          <VStack gap={4} width="100%">
            <VStack gap={2}>
              <Heading level={2}>Architecture</Heading>
              <Text as="p" display="block" color="secondary">
                The framework separates platform orchestration from product
                modules, while keeping UI and Worker boundaries explicit.
              </Text>
            </VStack>
            <Grid columns={{ minWidth: 280 }} gap={3}>
              {architectureRows.map((entry) => (
                <ArchitectureCard key={entry.title} {...entry} />
              ))}
            </Grid>
          </VStack>
        </Section>

        <Section id="design-system" variant="muted" padding={6}>
          <VStack gap={4} width="100%">
            <VStack gap={2}>
              <Heading level={2}>Design system</Heading>
              <Text as="p" display="block" color="secondary">
                The React shell is built from Astryx components and exposes an
                AstryxKit provider for theme and appearance-mode consistency.
              </Text>
            </VStack>
            <Grid columns={{ minWidth: 260 }} gap={3}>
              <Card variant="blue" padding={4}>
                <VStack gap={2}>
                  <Badge variant="blue" label="Theme" />
                  <Text as="p" display="block">
                    Use <Code>AstryxKitProvider</Code> around host apps to share
                    the default theme and mode persistence behavior.
                  </Text>
                </VStack>
              </Card>
              <Card variant="teal" padding={4}>
                <VStack gap={2}>
                  <Badge variant="teal" label="Shell UI" />
                  <Text as="p" display="block">
                    Compose platform navigation, preferences, and command
                    surfaces with Astryx layout and navigation primitives.
                  </Text>
                </VStack>
              </Card>
              <Card variant="green" padding={4}>
                <VStack gap={2}>
                  <Badge variant="green" label="Docs" />
                  <Text as="p" display="block">
                    Keep product docs, API examples, and implementation notes in
                    one deployable static site.
                  </Text>
                </VStack>
              </Card>
            </Grid>
          </VStack>
        </Section>

        <Section id="cloudflare" variant="section" padding={6}>
          <VStack gap={4} width="100%">
            <VStack gap={2}>
              <Heading level={2}>Cloudflare Workers boundary</Heading>
              <Text as="p" display="block" color="secondary">
                Worker helpers are intentionally small. Check current
                Cloudflare documentation before changing Workers, D1, KV, R2,
                Durable Objects, Queues, Vectorize, Workers AI, or Agents SDK
                behavior.
              </Text>
            </VStack>
            <HStack gap={2} wrap="wrap">
              <Button
                label="Workers docs"
                href="https://developers.cloudflare.com/workers/"
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                icon={<Icon icon="externalLink" size="sm" />}
              />
              <Button
                label="Workers limits"
                href="https://developers.cloudflare.com/workers/platform/limits/"
                target="_blank"
                rel="noreferrer"
                variant="ghost"
                icon={<Icon icon="externalLink" size="sm" />}
              />
              <Button
                label="D1 docs"
                href="https://developers.cloudflare.com/d1/"
                target="_blank"
                rel="noreferrer"
                variant="ghost"
                icon={<Icon icon="externalLink" size="sm" />}
              />
            </HStack>
            <Text as="p" display="block" color="secondary">
              Reference notes are kept in{" "}
              <Link href="https://github.com/thedjpetersen/astryxkit/blob/main/docs/cloudflare.md">
                docs/cloudflare.md
              </Link>
              .
            </Text>
          </VStack>
        </Section>
      </AppShell>
    </AstryxKitProvider>
  );
}
