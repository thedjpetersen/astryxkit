import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PreferenceSnapshot,
  ShellHost,
  createShellSDK,
  resetShellForTests,
  resolvePreference,
  shell,
  type PreferenceSchema,
  type PreferenceValueRecord,
  type ShellAppManifest,
  type ShellAppModule,
} from "../src/core";

type TestApp = {
  activationCount: () => number;
  disposeCount: () => number;
  manifest: ShellAppManifest;
  runs: string[];
};

describe("astryxkit shell SDK", () => {
  beforeEach(() => {
    resetShellForTests();
  });

  it("adopts the legacy AstryxKit singleton at the compatibility boundary", () => {
    const legacy = createShellSDK({ platformId: "legacy" });
    const globalScope = globalThis as typeof globalThis & {
      __appFoundryShellSdk?: ReturnType<typeof createShellSDK>;
      __astryxkitShellSdk?: ReturnType<typeof createShellSDK>;
    };

    delete globalScope.__appFoundryShellSdk;
    globalScope.__astryxkitShellSdk = legacy;

    expect(shell()).toBe(legacy);
    expect(globalScope.__appFoundryShellSdk).toBe(legacy);
  });

  it("declares commands and preferences before the app loads", () => {
    const host = new ShellHost();
    const app = createTestApp("cold-one");

    host.register(app.manifest);

    expect(app.manifest.load).not.toHaveBeenCalled();
    expect(host.paletteItems().map((item) => item.id)).toContain(
      "cold-one.open",
    );
    expect(
      host
        .settingsGroups()
        .flatMap((group) => group.settings)
        .map((setting) => setting.key),
    ).toContain("cold-one.density");
  });

  it("switching apps disposes previous handlers and hides previous scoped commands", async () => {
    const host = new ShellHost();
    const first = createTestApp("switch-first");
    const second = createTestApp("switch-second");
    host.register(first.manifest);
    host.register(second.manifest);

    await host.activate(first.manifest.id);

    expect(shell().commands.isBound("switch-first.focused")).toBe(true);
    expect(host.paletteItems().map((item) => item.id)).toContain(
      "switch-first.focused",
    );

    await host.activate(second.manifest.id);

    expect(first.disposeCount()).toBe(1);
    expect(shell().commands.isBound("switch-first.focused")).toBe(false);
    expect(host.paletteItems().map((item) => item.id)).not.toContain(
      "switch-first.focused",
    );
    expect(host.paletteItems().map((item) => item.id)).toContain(
      "switch-second.focused",
    );
  });

  it("keeps user overrides across unmounts and reapplies app layers on activation", async () => {
    const host = new ShellHost();
    const first = createTestApp("prefs-first");
    const second = createTestApp("prefs-second");
    host.register(first.manifest);
    host.register(second.manifest);

    await host.activate(first.manifest.id);
    expect(shell().preferences.inspect("prefs-first.density").scope).toBe(
      "app",
    );

    shell().preferences.set("prefs-first.density", "spacious", "user");
    expect(shell().preferences.inspect("prefs-first.density")).toMatchObject({
      scope: "user",
      value: "spacious",
    });

    await host.activate(second.manifest.id);
    expect(shell().preferences.inspect("prefs-first.density")).toMatchObject({
      scope: "user",
      value: "spacious",
    });

    await host.activate(first.manifest.id);
    expect(shell().preferences.inspect("prefs-first.density")).toMatchObject({
      scope: "user",
      value: "spacious",
    });

    shell().preferences.reset("prefs-first.density", "user");
    expect(shell().preferences.inspect("prefs-first.density")).toMatchObject({
      scope: "app",
      value: "compact",
    });
  });

  it("resolves preferences through platform, product, app, and feature rings", () => {
    const schema: PreferenceSchema = {
      key: "ring-app.density",
      appId: "ring-app",
      productId: "ops-suite",
      category: "Display",
      defaultValue: "comfortable",
      label: "Density",
      type: "string",
    };
    const records = new Map<string, PreferenceValueRecord>([
      [
        "platform:astryxkit:ring-app.density",
        {
          key: "ring-app.density",
          ring: "platform",
          scope: "astryxkit",
          value: "comfortable",
          layer: "seed",
        },
      ],
      [
        "product:ops-suite:ring-app.density",
        {
          key: "ring-app.density",
          ring: "product",
          scope: "ops-suite",
          value: "compact",
          layer: "seed",
        },
      ],
      [
        "app:ring-app:ring-app.density",
        {
          key: "ring-app.density",
          ring: "app",
          scope: "ring-app",
          value: "dense",
          layer: "seed",
        },
      ],
      [
        "feature:ring-app.inbox:ring-app.density",
        {
          key: "ring-app.density",
          ring: "feature",
          scope: "ring-app.inbox",
          value: "spacious",
          layer: "seed",
        },
      ],
    ]);

    const resolved = resolvePreference(
      new PreferenceSnapshot({ seedValues: records }),
      schema,
      {
        platform: "astryxkit",
        product: "ops-suite",
        app: "ring-app",
        feature: "ring-app.inbox",
        currentRing: "feature",
      },
    );

    expect(resolved).toMatchObject({
      value: "spacious",
      source: {
        ring: "feature",
        scope: "ring-app.inbox",
      },
      isDefault: false,
      isInherited: false,
    });
  });

  it("supports a custom platform id for preference scope defaults", () => {
    const sdk = createShellSDK({ platformId: "acme" });
    sdk.preferences.declare({
      key: "custom-platform.globalDensity",
      appId: "custom-platform",
      category: "Display",
      defaultValue: "comfortable",
      label: "Global density",
      ring: "platform",
      type: "string",
    });
    sdk.preferences.contributeValue(
      "custom-platform.globalDensity",
      "dense",
      "platform",
    );

    expect(
      sdk.preferences.inspect("custom-platform.globalDensity"),
    ).toMatchObject({
      source: {
        ring: "platform",
        scope: "acme",
      },
      value: "dense",
    });
  });

  it("activates a cold app before running its command", async () => {
    const host = new ShellHost();
    const app = createTestApp("cold-command");
    host.register(app.manifest);

    await host.runCommand("cold-command.open");

    expect(app.activationCount()).toBe(1);
    expect(app.runs).toEqual(["cold-command.open"]);
    expect(host.activeApp()?.manifest.id).toBe("cold-command");
  });

  it("feature toggles change visibility with one context key and no declaration churn", async () => {
    const host = new ShellHost();
    const app = createTestApp("feature-app");
    const changedKeys: string[] = [];
    host.register(app.manifest);
    await host.activate(app.manifest.id);
    shell().context.subscribe((change) => changedKeys.push(change.key));

    const commandDebugBefore = shell().commands.debugSnapshot();
    const preferenceDebugBefore = shell().preferences.debugSnapshot();

    expect(host.paletteItems().map((item) => item.id)).not.toContain(
      "feature-app.assist.run",
    );
    expect(
      host
        .settingsGroups()
        .flatMap((group) => group.settings)
        .map((setting) => setting.key),
    ).not.toContain("feature-app.assist.autoDraft");

    host.setFeatureEnabled("feature-app", "assist", true);

    expect(changedKeys).toEqual(["feature.feature-app.assist"]);
    expect(host.paletteItems().map((item) => item.id)).toContain(
      "feature-app.assist.run",
    );
    expect(
      host
        .settingsGroups()
        .flatMap((group) => group.settings)
        .map((setting) => setting.key),
    ).toContain("feature-app.assist.autoDraft");
    expect(shell().commands.debugSnapshot().declareCalls).toBe(
      commandDebugBefore.declareCalls,
    );
    expect(shell().preferences.debugSnapshot().schemaDeclareCalls).toBe(
      preferenceDebugBefore.schemaDeclareCalls,
    );
  });

  it("keeps selected cross-app domain events in the host event log", () => {
    const host = new ShellHost({ eventTypes: ["invoice.created"] });

    shell().events.emit("invoice.created", {
      invoiceId: "inv_test",
    });

    expect(host.events()).toHaveLength(1);
    expect(host.events()[0]).toMatchObject({
      type: "invoice.created",
      payload: {
        invoiceId: "inv_test",
      },
    });
  });

  it("mounts top nav areas and clears app-scoped mounts on deactivation", async () => {
    const host = new ShellHost();
    const app = createTestApp("chrome-app");
    host.register(app.manifest);

    const globalEndMount = host.mountTopNav({
      id: "global.end",
      area: "end",
      content: "Global",
      order: 20,
    });
    const globalStartMount = host.mountTopNav({
      id: "global.start",
      area: "end",
      content: "First",
      order: 10,
    });
    const globalHeaderMount = host.mountTopNav({
      id: "global.header",
      area: "header",
      content: "Global header",
    });

    expect(host.topNavMounts("end").map((mount) => mount.id)).toEqual([
      "global.start",
      "global.end",
    ]);

    host.updateTopNavMount({
      id: "global.end",
      area: "end",
      content: "Global updated",
      order: 5,
    });

    expect(host.topNavMounts("end").map((mount) => mount.id)).toEqual([
      "global.end",
      "global.start",
    ]);
    expect(host.topNavMounts("end")[0]?.content).toBe("Global updated");

    await host.activate(app.manifest.id);
    host.mountTopNav({
      id: "chrome-app.header",
      appId: app.manifest.id,
      area: "header",
      content: "Chrome app header",
      order: -1,
    });
    host.mountTopNav({
      id: "chrome-app.center",
      appId: app.manifest.id,
      area: "center",
      content: "Chrome app",
    });

    expect(host.topNavMounts("header").map((mount) => mount.id)).toEqual([
      "chrome-app.header",
      "global.header",
    ]);
    expect(host.topNavMounts("center").map((mount) => mount.id)).toEqual([
      "chrome-app.center",
    ]);

    host.deactivate(app.manifest.id);

    expect(host.topNavMounts("header").map((mount) => mount.id)).toEqual([
      "global.header",
    ]);
    expect(host.topNavMounts("center")).toEqual([]);
    expect(host.topNavMounts("end").map((mount) => mount.id)).toEqual([
      "global.end",
      "global.start",
    ]);

    globalHeaderMount.dispose();
    globalStartMount.dispose();
    globalEndMount.dispose();

    expect(host.topNavMounts()).toEqual([]);
  });

  it("ranks command palette results by ring before text relevance", () => {
    const sdk = shell();
    sdk.commands.declare({
      id: "platform.perfectBudgetMatch",
      appId: "platform",
      category: "Platform",
      title: "Budget",
      ring: "platform",
    });
    sdk.commands.declare({
      id: "rank-app.openBudget",
      appId: "rank-app",
      category: "App",
      title: "Open current budget review",
      ring: "app",
    });
    sdk.commands.declare({
      id: "rank-app.ticketRefund",
      appId: "rank-app",
      category: "Feature",
      title: "Refund request",
      keywords: ["budget"],
      ring: "feature",
    });

    const results = sdk.commands.rankedPaletteItems("budget", sdk.context);

    expect(results.map((result) => result.command.id)).toEqual([
      "rank-app.ticketRefund",
      "rank-app.openBudget",
      "platform.perfectBudgetMatch",
    ]);
  });

  it("filters command palette results with built-in prefix modes", () => {
    const sdk = shell();
    sdk.commands.declare({
      id: "prefix-app.openPage",
      appId: "prefix-app",
      category: "Pages",
      title: "Open Page",
      route: "/app/prefix-app",
    });
    sdk.commands.declare({
      id: "prefix-app.runAction",
      appId: "prefix-app",
      category: "Actions",
      title: "Run Action",
    });
    sdk.commands.declare({
      id: "prefix-app.entityInvoice",
      appId: "prefix-app",
      category: "Entities",
      title: "Invoice 42",
      entity: {
        id: "invoice-42",
        label: "Invoice 42",
      },
    });

    expect(
      sdk.commands
        .rankedPaletteItems("/", sdk.context)
        .map((result) => result.command.id),
    ).toEqual(["prefix-app.openPage"]);
    expect(
      sdk.commands
        .rankedPaletteItems(">", sdk.context)
        .map((result) => result.command.id),
    ).toEqual(["prefix-app.runAction"]);
    expect(
      sdk.commands
        .rankedPaletteItems("@", sdk.context)
        .map((result) => result.command.id),
    ).toEqual(["prefix-app.entityInvoice"]);
  });

  it("supports first-class shortcodes for palette search and lookup", () => {
    const sdk = shell();
    sdk.commands.declare({
      id: "tasks.task.pto.open",
      appId: "tasks",
      category: "Tasks",
      title: "PTO reference",
      route: "/app/tasks/T00000A",
      shortcodes: [" T00000A ", "t00000a", "#T00000A"],
    });
    sdk.commands.declare({
      id: "tasks.task.title-match.open",
      appId: "tasks",
      category: "Tasks",
      title: "T00000A migration note",
      route: "/app/tasks/migration-note",
    });

    expect(sdk.commands.get("tasks.task.pto.open")?.shortcodes).toEqual([
      "T00000A",
    ]);
    expect(sdk.commands.findByShortcode("t00000a")?.id).toBe(
      "tasks.task.pto.open",
    );
    expect(sdk.commands.findByShortcode("#T00000A")?.id).toBe(
      "tasks.task.pto.open",
    );

    const host = new ShellHost({ includeDefaultPlatformCommands: false });
    const hostApp = createTestApp("host-shortcodes");
    hostApp.manifest.commands[0] = {
      ...hostApp.manifest.commands[0],
      shortcodes: ["HOST-42"],
    };
    host.register(hostApp.manifest);

    expect(host.commandForShortcode("#host-42")?.id).toBe(
      "host-shortcodes.open",
    );
    expect(
      sdk.commands.rankedPaletteItems("t00000a", sdk.context).map((result) => ({
        id: result.command.id,
        score: result.textScore,
      })),
    ).toEqual([
      { id: "tasks.task.pto.open", score: 1500 },
      { id: "tasks.task.title-match.open", score: 1000 },
    ]);
  });

  it("registers dynamic command sources and disposes them with component lifecycle", () => {
    const sdk = shell();
    const registration = sdk.commands.registerSource({
      id: "feature-source",
      appId: "feature-app",
      label: "Feature source",
      ring: "feature",
      commands: [
        {
          id: "feature-app.contextual",
          appId: "feature-app",
          category: "Feature source",
          title: "Contextual action",
        },
      ],
    });

    expect(
      sdk.commands
        .rankedPaletteItems("", sdk.context)
        .map((result) => result.command.id),
    ).toContain("feature-app.contextual");

    registration.dispose();

    expect(
      sdk.commands
        .rankedPaletteItems("", sdk.context)
        .map((result) => result.command.id),
    ).not.toContain("feature-app.contextual");
  });

  it("records executed commands as recent palette results", async () => {
    const sdk = shell();
    sdk.commands.declare({
      id: "recent-app.run",
      appId: "recent-app",
      category: "Actions",
      title: "Run Recent Action",
    });
    sdk.commands.bind("recent-app.run", () => {});

    await sdk.commands.execute("recent-app.run");

    const [recent] = sdk.commands.rankedPaletteItems("", sdk.context);

    expect(recent).toMatchObject({
      isRecent: true,
      command: {
        id: "recent-app.run",
      },
    });
  });
});

function createTestApp(id: string): TestApp {
  let activationCount = 0;
  let disposeCount = 0;
  const runs: string[] = [];
  const module: ShellAppModule = {
    activate: (context) => {
      activationCount += 1;
      context.disposeWithApp(
        context.shell.commands.bind(`${id}.open`, ({ command }) => {
          runs.push(command.id);
          context.host.navigate(context.app.route);
        }),
      );
      context.disposeWithApp(
        context.shell.commands.bind(`${id}.focused`, ({ command }) => {
          runs.push(command.id);
        }),
      );

      return {
        dispose: () => {
          disposeCount += 1;
        },
      };
    },
  };
  const manifest: ShellAppManifest = {
    id,
    name: id,
    ownerTeam: "Test",
    route: `/app/${id}`,
    entryUrl: `/app/modules/${id}.js`,
    commands: [
      {
        id: `${id}.open`,
        appId: id,
        category: "Apps",
        title: `Open ${id}`,
        route: `/app/${id}`,
      },
      {
        id: `${id}.focused`,
        appId: id,
        category: "Focused",
        title: `Focused ${id}`,
        when: `appActive == '${id}'`,
      },
      {
        id: `${id}.assist.run`,
        appId: id,
        category: "Assist",
        title: "Run assist",
        featureId: "assist",
        when: `feature.${id}.assist`,
      },
    ],
    features: [
      {
        id: "assist",
        label: "Assist",
        contextKey: `feature.${id}.assist`,
      },
    ],
    preferenceDefaults: [
      {
        key: `${id}.density`,
        ring: "app",
        value: "compact",
      },
    ],
    preferences: [
      {
        key: `${id}.density`,
        appId: id,
        category: "Display",
        defaultValue: "comfortable",
        label: "Density",
        type: "string",
      },
      {
        key: `${id}.assist.autoDraft`,
        appId: id,
        category: "Assist",
        defaultValue: false,
        featureId: "assist",
        label: "Auto draft",
        type: "boolean",
        when: `feature.${id}.assist`,
      },
    ],
    load: vi.fn(async () => module),
  };

  return {
    activationCount: () => activationCount,
    disposeCount: () => disposeCount,
    manifest,
    runs,
  };
}
