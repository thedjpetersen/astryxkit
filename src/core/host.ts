import type { ReactNode } from "react";
import {
  DisposableStore,
  assertSingleShellInstance,
  shell,
  type CommandContribution,
  type CommandSourceContribution,
  type Disposable,
  type PreferenceRing,
  type PreferenceSchema,
  type PreferenceValue,
  type RankedCommandResult,
  type SettingsGroup,
  type ShellEvent,
  type ShellSDK,
} from "./shell-sdk";

export type WorkspaceContext = {
  name: string;
  slug: string;
};

export type MicroAppRoute = {
  pathname: string;
  slug: string;
};

export type ShellFeatureContribution = {
  id: string;
  label: string;
  contextKey: string;
  description?: string;
};

export type ShellPreferenceDefault = {
  key: string;
  ring: PreferenceRing;
  value: PreferenceValue;
};

export type ShellAppManifest = {
  id: string;
  name: string;
  entryUrl: string;
  ownerTeam: string;
  route: string;
  commands: CommandContribution[];
  description?: string;
  features?: ShellFeatureContribution[];
  icon?: string;
  load: () => Promise<ShellAppModule>;
  preferenceDefaults?: ShellPreferenceDefault[];
  preferences?: PreferenceSchema[];
};

export type ShellAppRenderProps = {
  host: ShellHost;
  manifest: ShellAppManifest;
  route: MicroAppRoute;
  shell: ShellSDK;
  workspace: WorkspaceContext;
  navigate: (href: string) => void;
};

export type ShellAppInstance = Disposable & {
  render?: (props: ShellAppRenderProps) => ReactNode;
};

export type ShellAppModule = {
  activate: (
    context: ShellAppActivationContext
  ) => Promise<ShellAppInstance> | ShellAppInstance;
};

export type ShellAppActivationContext = {
  app: ShellAppManifest;
  disposeWithApp: <TDisposable extends Disposable>(
    disposable: TDisposable
  ) => TDisposable;
  host: ShellHost;
  shell: ShellSDK;
};

export type ShellHostOptions = {
  defaultDocsRoute?: string;
  eventTypes?: string[];
  includeDefaultPlatformCommands?: boolean;
  navigate?: (href: string) => void;
  preferencesRoute?: string;
  shell?: ShellSDK;
};

export type ActiveShellApp = {
  instance: ShellAppInstance;
  manifest: ShellAppManifest;
  store: DisposableStore;
};

type HostListener = () => void;

export class ShellHost implements Disposable {
  private active?: ActiveShellApp;
  private listeners = new Set<HostListener>();
  private manifests = new Map<string, ShellAppManifest>();
  private navigateImpl: (href: string) => void;
  private registrations = new DisposableStore();
  private readonly shellSdk: ShellSDK;
  private readonly hostEvents: ShellEvent[] = [];
  private version = 0;

  constructor(options: ShellHostOptions = {}) {
    this.shellSdk = options.shell ?? shell();
    if (!options.shell) {
      assertSingleShellInstance(this.shellSdk);
    }
    this.navigateImpl = options.navigate ?? defaultNavigate;
    this.registrations.add(
      this.shellSdk.commands.setActivator(async (command) => {
        if (this.manifests.has(command.appId)) {
          await this.activate(command.appId);
        }
      })
    );
    this.registrations.add(this.shellSdk.commands.subscribe(() => this.emit()));
    this.registrations.add(this.shellSdk.preferences.subscribe(() => this.emit()));
    this.registrations.add(this.shellSdk.context.subscribe(() => this.emit()));

    for (const eventType of options.eventTypes ?? []) {
      this.registrations.add(
        this.shellSdk.events.on(eventType, (event) => {
          this.hostEvents.unshift(event);
          this.emit();
        })
      );
    }

    if (options.includeDefaultPlatformCommands !== false) {
      this.registrations.add(
        this.shellSdk.commands.registerSource(
          createPlatformCommandSource({
            docsRoute: options.defaultDocsRoute,
            preferencesRoute: options.preferencesRoute,
          })
        )
      );
    }
  }

  register(manifest: ShellAppManifest): Disposable {
    if (this.manifests.has(manifest.id)) {
      throw new Error(`Micro-app already registered: ${manifest.id}`);
    }

    const store = new DisposableStore();
    this.manifests.set(manifest.id, manifest);

    for (const command of manifest.commands) {
      store.add(this.shellSdk.commands.declare(command));
    }

    for (const preference of manifest.preferences ?? []) {
      store.add(this.shellSdk.preferences.declare(preference));
    }

    for (const preferenceDefault of manifest.preferenceDefaults ?? []) {
      store.add(
        this.shellSdk.preferences.contributeValue(
          preferenceDefault.key,
          preferenceDefault.value,
          preferenceDefault.ring
        )
      );
    }

    this.emit();

    return {
      dispose: () => {
        if (this.active?.manifest.id === manifest.id) {
          this.deactivate(manifest.id);
        }

        store.dispose();
        this.manifests.delete(manifest.id);
        this.emit();
      },
    };
  }

  registerAll(manifests: ShellAppManifest[]): Disposable {
    const store = new DisposableStore();

    for (const manifest of manifests) {
      store.add(this.register(manifest));
    }

    return store;
  }

  setNavigate(navigate: (href: string) => void) {
    this.navigateImpl = navigate;
  }

  navigate(href: string) {
    this.navigateImpl(href);
  }

  getManifest(appId: string): ShellAppManifest | undefined {
    return this.manifests.get(appId);
  }

  getManifestForPathname(pathname: string): ShellAppManifest | undefined {
    return Array.from(this.manifests.values()).find((manifest) =>
      isRouteMatch(manifest.route, pathname)
    );
  }

  getManifests(): ShellAppManifest[] {
    return Array.from(this.manifests.values());
  }

  getShell(): ShellSDK {
    return this.shellSdk;
  }

  activeApp(): ActiveShellApp | undefined {
    return this.active;
  }

  paletteItems(): CommandContribution[] {
    return this.shellSdk.commands.paletteItems(this.shellSdk.context);
  }

  paletteResults(query = ""): RankedCommandResult[] {
    return this.shellSdk.commands.rankedPaletteItems(
      query,
      this.shellSdk.context
    );
  }

  paletteChildResults(parentId: string, query = ""): RankedCommandResult[] {
    return this.shellSdk.commands.rankedChildItems(
      parentId,
      query,
      this.shellSdk.context
    );
  }

  settingsGroups(): SettingsGroup[] {
    return this.shellSdk.preferences.settingsGroups(this.shellSdk.context);
  }

  events(): ShellEvent[] {
    return [...this.hostEvents];
  }

  snapshotVersion(): number {
    return this.version;
  }

  async activate(appId: string): Promise<ShellAppInstance> {
    if (this.active?.manifest.id === appId) {
      return this.active.instance;
    }

    const manifest = this.manifests.get(appId);

    if (!manifest) {
      throw new Error(`Unknown micro-app: ${appId}`);
    }

    this.deactivate();
    this.shellSdk.context.set("appActive", manifest.id);

    const store = new DisposableStore();
    const module = await manifest.load();
    const instance = await module.activate({
      app: manifest,
      disposeWithApp: (disposable) => store.add(disposable),
      host: this,
      shell: this.shellSdk,
    });

    store.add(instance);
    this.active = { instance, manifest, store };
    this.emit();

    return instance;
  }

  deactivate(appId?: string) {
    const current = this.active;

    if (!current) {
      this.shellSdk.context.set("appActive", undefined);
      return;
    }

    if (appId && current.manifest.id !== appId) {
      return;
    }

    for (const feature of current.manifest.features ?? []) {
      this.shellSdk.context.set(feature.contextKey, false);
    }

    current.store.dispose();
    this.active = undefined;
    this.shellSdk.context.set("appActive", undefined);
    this.emit();
  }

  setFeatureEnabled(appId: string, featureId: string, isEnabled: boolean) {
    const manifest = this.manifests.get(appId);
    const feature = manifest?.features?.find((item) => item.id === featureId);

    if (!feature) {
      throw new Error(`Unknown feature: ${appId}.${featureId}`);
    }

    this.shellSdk.context.set(feature.contextKey, isEnabled);
  }

  async runCommand(commandId: string): Promise<void> {
    const command = this.shellSdk.commands.get(commandId);

    if (!command) {
      throw new Error(`Unknown command: ${commandId}`);
    }

    if (command.route) {
      this.navigate(command.route);
    }

    if (command.href) {
      if (command.target === "_blank") {
        window.open(command.href, "_blank", "noopener,noreferrer");
      } else {
        this.navigate(command.href);
      }
    }

    await this.shellSdk.commands.execute(commandId);
  }

  subscribe(listener: HostListener): Disposable {
    this.listeners.add(listener);

    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  dispose() {
    this.deactivate();
    this.registrations.dispose();
    this.listeners.clear();
  }

  private emit() {
    this.version += 1;
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export function createPlatformCommandSource({
  docsRoute,
  preferencesRoute = "/preferences",
}: {
  docsRoute?: string;
  preferencesRoute?: string;
} = {}): CommandSourceContribution {
  const commands: CommandContribution[] = [
    {
      id: "platform.openPreferences",
      appId: "platform",
      category: "Platform",
      title: "Open Preferences",
      description:
        "Review platform, product, application, and feature settings.",
      icon: "wrench",
      keywords: ["settings", "preferences", "configuration"],
      kind: "page",
      route: preferencesRoute,
      shortcut: {
        modifiers: ["meta"],
        key: ",",
      },
    },
  ];

  if (docsRoute) {
    commands.push({
      id: "platform.openDocs",
      appId: "platform",
      category: "Platform",
      title: "Open Documentation",
      description: "Open the platform documentation surface.",
      icon: "externalLink",
      kind: "page",
      keywords: ["docs", "help", "reference"],
      href: docsRoute,
    });
  }

  return {
    id: "platform:commands",
    appId: "platform",
    label: "Platform",
    ring: "platform",
    commands,
  };
}

function defaultNavigate(href: string) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(href, window.location.origin);

  if (url.origin !== window.location.origin) {
    window.location.assign(url.toString());
    return;
  }

  window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event("astryxkit:navigate"));

  if (url.hash) {
    document.getElementById(url.hash.slice(1))?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  }
}

function isRouteMatch(route: string, pathname: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}
