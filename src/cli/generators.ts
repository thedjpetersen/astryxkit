import path from "node:path";
import {
  runGenerator,
  toNameParts,
  toScopedNameParts,
  type GeneratedFile,
  type GeneratorDefinition,
  type GeneratorFilePlan,
  type GeneratorOptions,
} from "app-foundry/generator";

export type GeneratorKind =
  | "app"
  | "command"
  | "d1-repository"
  | "preference"
  | "shell"
  | "worker-route";

export type { GeneratedFile, GeneratorOptions };

export const generatorDefinitions: GeneratorDefinition<GeneratorKind>[] = [
  {
    kind: "shell",
    defaultDir: "src/shell",
    nameFormat: "<product-name>",
    description:
      "Create a host shell entry with ShellHost, ShellFrame, provider, and app outlet wiring.",
    example: "ak g shell Northstar",
  },
  {
    kind: "app",
    defaultDir: "src/apps",
    nameFormat: "<app-name>",
    description:
      "Create a micro-app manifest, activation function, default command, sample preference, and Astryx UI view.",
    example: "ak g app Catalog",
  },
  {
    kind: "command",
    defaultDir: "src/commands",
    nameFormat: "<app-id>.<command-name>",
    description:
      "Create a typed CommandContribution and handler binder for an app command.",
    example: "ak g command catalog.refresh",
  },
  {
    kind: "preference",
    defaultDir: "src/preferences",
    nameFormat: "<app-id>.<preference-name>",
    description:
      "Create a typed PreferenceSchema that can be added to a ShellAppManifest.",
    example: "ak g preference catalog.density",
  },
  {
    kind: "worker-route",
    defaultDir: "src/worker/routes",
    nameFormat: "<route-name>",
    description:
      "Create a WorkerRoute using AstryxKit JSON helpers and explicit request context.",
    example: "ak g worker-route catalog",
  },
  {
    kind: "d1-repository",
    defaultDir: "src/worker/repositories",
    nameFormat: "<resource-name>",
    description:
      "Create a small D1 repository helper around requireD1Database and prepared statements.",
    example: "ak g d1-repository customer",
  },
];

export function getGenerator(kind: string): GeneratorDefinition | undefined {
  return generatorDefinitions.find((generator) => generator.kind === kind);
}

export async function generate(
  kind: GeneratorKind,
  name: string,
  options: GeneratorOptions = {}
): Promise<GeneratedFile[]> {
  const generator = getGenerator(kind);

  if (!generator) {
    throw new Error(`Unknown generator: ${kind}`);
  }

  return runGenerator(
    generator,
    name,
    (recipeName, dir) => buildFilePlans(kind, recipeName, dir),
    options,
  );
}

function buildFilePlans(
  kind: GeneratorKind,
  name: string,
  dir: string,
): GeneratorFilePlan[] {
  switch (kind) {
    case "app":
      return buildApp(name, dir);
    case "command":
      return buildCommand(name, dir);
    case "d1-repository":
      return buildD1Repository(name, dir);
    case "preference":
      return buildPreference(name, dir);
    case "shell":
      return buildShell(name, dir);
    case "worker-route":
      return buildWorkerRoute(name, dir);
  }
}

function buildShell(name: string, dir: string): GeneratorFilePlan[] {
  const product = toNameParts(name);
  const variable = `${product.camel}Host`;

  return [
    {
      relativePath: path.join(dir, `${product.kebab}.tsx`),
      content: `${header("shell", name)}
import { AstryxKitProvider, ShellAppOutlet, ShellFrame, ShellHost } from "astryxkit";

const workspace = {
  name: "${product.title}",
  slug: "${product.kebab}",
};

export const ${variable} = new ShellHost({
  defaultDocsRoute: "/docs",
  preferencesRoute: "/preferences",
});

export function ${product.pascal}Shell({
  appId,
  currentPathname,
}: {
  appId: string;
  currentPathname: string;
}) {
  const route = {
    pathname: currentPathname,
    slug: appId,
  };

  return (
    <AstryxKitProvider>
      <ShellFrame
        host={${variable}}
        workspace={workspace}
        brandName="${product.title}"
        currentPathname={currentPathname}>
        <ShellAppOutlet
          appId={appId}
          host={${variable}}
          workspace={workspace}
          route={route}
          navigate={(href) => ${variable}.navigate(href)}
        />
      </ShellFrame>
    </AstryxKitProvider>
  );
}
`,
    },
  ];
}

function buildApp(name: string, dir: string): GeneratorFilePlan[] {
  const app = toNameParts(name);
  const manifestName = `${app.camel}Manifest`;
  const openCommandId = `${app.kebab}.open`;
  const refreshCommandId = `${app.kebab}.refresh`;

  return [
    {
      relativePath: path.join(dir, app.kebab, "index.tsx"),
      content: `${header("app", name)}
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Section } from "@astryxdesign/core/Section";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type {
  ShellAppActivationContext,
  ShellAppInstance,
  ShellAppManifest,
  ShellHost,
} from "astryxkit";

export const ${manifestName}: ShellAppManifest = {
  id: "${app.kebab}",
  name: "${app.title}",
  description: "A ${app.title} micro-app.",
  entryUrl: "/src/apps/${app.kebab}/index.tsx",
  ownerTeam: "Platform",
  route: "/app/${app.kebab}",
  icon: "viewColumns",
  commands: [
    {
      id: "${openCommandId}",
      appId: "${app.kebab}",
      category: "Apps",
      title: "Open ${app.title}",
      route: "/app/${app.kebab}",
      icon: "viewColumns",
      kind: "page",
    },
    {
      id: "${refreshCommandId}",
      appId: "${app.kebab}",
      category: "${app.title}",
      title: "Refresh ${app.title}",
      icon: "check",
      when: "appActive == '${app.kebab}'",
    },
  ],
  preferences: [
    {
      key: "${app.kebab}.density",
      appId: "${app.kebab}",
      category: "Display",
      label: "Density",
      description: "Controls how much spacing ${app.title} uses.",
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

export function activate(context: ShellAppActivationContext): ShellAppInstance {
  context.disposeWithApp(
    context.shell.commands.bind("${refreshCommandId}", () => {
      context.shell.events.emit("${app.kebab}.refreshed", {
        refreshedAt: new Date().toISOString(),
      });
    })
  );

  return {
    dispose() {},
    render: ({ host }) => <${app.pascal}App host={host} />,
  };
}

function ${app.pascal}App({ host }: { host: ShellHost }) {
  return (
    <Section padding={6} variant="transparent">
      <VStack gap={5}>
        <VStack gap={1}>
          <Heading level={1}>${app.title}</Heading>
          <Text type="supporting">
            ${app.title} is registered by manifest, activated lazily, and
            controlled through the shared shell runtime.
          </Text>
        </VStack>
        <HStack gap={2} align="center" wrap="wrap">
          <Button
            label="Run refresh command"
            variant="primary"
            onClick={() => void host.runCommand("${refreshCommandId}")}
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
`,
    },
  ];
}

function buildCommand(name: string, dir: string): GeneratorFilePlan[] {
  const scoped = toScopedNameParts(name, "command");
  const commandId = `${scoped.app.kebab}.${scoped.kebab}`;

  return [
    {
      relativePath: path.join(dir, scoped.app.kebab, `${scoped.kebab}.ts`),
      content: `${header("command", name)}
import type { CommandContribution, ShellAppActivationContext } from "astryxkit";

export const ${scoped.camel}Command: CommandContribution = {
  id: "${commandId}",
  appId: "${scoped.app.kebab}",
  category: "${scoped.app.title}",
  title: "${scoped.title}",
  icon: "check",
  when: "appActive == '${scoped.app.kebab}'",
};

export function bind${scoped.pascal}Command(
  context: ShellAppActivationContext,
  handler: () => Promise<void> | void
) {
  return context.disposeWithApp(
    context.shell.commands.bind("${commandId}", handler)
  );
}
`,
    },
  ];
}

function buildPreference(name: string, dir: string): GeneratorFilePlan[] {
  const scoped = toScopedNameParts(name, "preference");

  return [
    {
      relativePath: path.join(dir, scoped.app.kebab, `${scoped.kebab}.ts`),
      content: `${header("preference", name)}
import type { PreferenceSchema } from "astryxkit";

export const ${scoped.camel}Preference: PreferenceSchema = {
  key: "${scoped.app.kebab}.${scoped.kebab}",
  appId: "${scoped.app.kebab}",
  category: "${scoped.app.title}",
  label: "${scoped.title}",
  description: "Controls ${scoped.title.toLowerCase()} for ${scoped.app.title}.",
  type: "boolean",
  defaultValue: true,
};
`,
    },
  ];
}

function buildWorkerRoute(name: string, dir: string): GeneratorFilePlan[] {
  const route = toNameParts(name);

  return [
    {
      relativePath: path.join(dir, `${route.kebab}.ts`),
      content: `${header("worker-route", name)}
import { json, type WorkerRoute } from "astryxkit/worker";

export type ${route.pascal}Env = Record<string, unknown>;

export const ${route.camel}Route: WorkerRoute<${route.pascal}Env> = {
  method: "GET",
  pathname: "/api/${route.kebab}",
  handle: async ({ request }) => {
    return json({
      name: "${route.kebab}",
      requestedAt: new Date().toISOString(),
      url: request.url,
    });
  },
};
`,
    },
  ];
}

function buildD1Repository(name: string, dir: string): GeneratorFilePlan[] {
  const resource = toNameParts(name);

  return [
    {
      relativePath: path.join(dir, `${resource.kebab}-repository.ts`),
      content: `${header("d1-repository", name)}
import {
  prepareD1Statement,
  requireD1Database,
  runD1Batch,
} from "astryxkit/worker";

export type ${resource.pascal}Record = {
  id: string;
  name: string;
  created_at: string;
};

export type ${resource.pascal}RepositoryEnv = Record<string, unknown>;

export function create${resource.pascal}Repository(
  env: ${resource.pascal}RepositoryEnv,
  binding = "DB"
) {
  const database = requireD1Database(env, binding);

  return {
    async list(): Promise<${resource.pascal}Record[]> {
      const result = await database
        .prepare(
          "select id, name, created_at from ${resource.kebab.replace(/-/g, "_")} order by created_at desc"
        )
        .all<${resource.pascal}Record>();

      return result.results;
    },

    async create(record: Pick<${resource.pascal}Record, "id" | "name">) {
      await prepareD1Statement(
        database,
        "insert into ${resource.kebab.replace(/-/g, "_")} (id, name, created_at) values (?, ?, ?)",
        record.id,
        record.name,
        new Date().toISOString()
      ).run();
    },

    async delete(id: string) {
      await runD1Batch(database, [
        prepareD1Statement(
          database,
          "delete from ${resource.kebab.replace(/-/g, "_")} where id = ?",
          id
        ),
      ]);
    },
  };
}
`,
    },
  ];
}

function header(kind: GeneratorKind, name: string) {
  return `// Generated by ak generate ${kind} ${name}
`;
}
