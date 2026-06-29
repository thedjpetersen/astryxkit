export type Disposable = {
  dispose: () => void;
};

export type PreferenceValue = string | number | boolean;

export type PreferenceRing = "platform" | "product" | "app" | "feature";

export type CommandRing = PreferenceRing;

export type CommandKind = "action" | "entity" | "help" | "page";

export type CommandVisibility = "self" | "product";

export type PreferenceScope =
  | "default"
  | "platform"
  | "product"
  | "app"
  | "feature"
  | "user";

export type PreferenceValueLayer = "seed" | "user";

export type RingContext = {
  platform?: string;
  product?: string;
  app?: string;
  feature?: string;
  currentRing?: PreferenceRing;
};

export type ContextValue = string | number | boolean | null | undefined;

export type ContextSnapshot = ReadonlyMap<string, ContextValue>;

export type CommandExecutionContext = {
  command: CommandContribution;
  shell: ShellSDK;
};

export type CommandHandler = (
  context: CommandExecutionContext
) => Promise<void> | void;

export type CommandShortcut = {
  key: string;
  modifiers?: Array<"alt" | "ctrl" | "meta" | "shift">;
};

export type CommandEntity = {
  id: string;
  label: string;
  description?: string;
};

export type CommandContribution = {
  id: string;
  appId: string;
  category: string;
  title: string;
  childCount?: number;
  children?: CommandContribution[];
  description?: string;
  entity?: CommandEntity;
  featureId?: string;
  handler?: CommandHandler;
  href?: string;
  icon?: string;
  kind?: CommandKind;
  keywords?: string[];
  paletteHidden?: boolean;
  parentId?: string;
  priority?: number;
  ring?: CommandRing;
  route?: string;
  section?: string;
  shortcut?: CommandShortcut;
  sourceId?: string;
  sourceLabel?: string;
  target?: "_blank" | "_self";
  visibility?: CommandVisibility;
  when?: string;
};

export type CommandSourceContribution = {
  id: string;
  appId: string;
  label: string;
  commands: CommandContribution[];
  priority?: number;
  ring: CommandRing;
};

export type CommandPrefixMode = {
  filter: (command: CommandContribution) => boolean;
  icon?: string;
  label: string;
  placeholder?: string;
  prefix: string;
};

export type RankedCommandResult = {
  command: CommandContribution;
  isRecent: boolean;
  matchRanges: Array<[number, number]>;
  prefix?: CommandPrefixMode;
  ringScore: number;
  source: {
    id: string;
    label: string;
    ring: CommandRing;
  };
  textScore: number;
};

export type CommandHistoryEntry = {
  actionId: string;
  actionLabel: string;
  actionUrl?: string;
  icon?: string;
  invokedAt: number;
  ring: CommandRing;
  scope: string;
};

export type PreferenceOption = {
  label: string;
  value: PreferenceValue;
};

export type PreferenceSchema = {
  key: string;
  appId: string;
  category: string;
  defaultValue: PreferenceValue;
  description?: string;
  featureId?: string;
  label: string;
  options?: PreferenceOption[];
  productId?: string;
  ring?: PreferenceRing;
  scope?: string;
  type: "boolean" | "enum" | "number" | "string";
  when?: string;
  migrations?: Record<string, PreferenceValue>;
  schemaVersion?: number;
};

export type PreferenceValueRecord = {
  key: string;
  ring: PreferenceRing;
  scope: string;
  value: PreferenceValue;
  layer?: PreferenceValueLayer;
  schemaVersion?: number;
};

export type PreferenceSource = {
  ring: PreferenceScope;
  scope: string;
  layer?: PreferenceValueLayer;
};

export type ResolvedPreference = {
  key: string;
  schema?: PreferenceSchema;
  value?: PreferenceValue;
  source: PreferenceSource;
  scope: PreferenceScope;
  isDefault: boolean;
  isInherited: boolean;
  hasUserOverride: boolean;
  layers: {
    app?: PreferenceValue;
    default?: PreferenceValue;
    feature?: PreferenceValue;
    platform?: PreferenceValue;
    product?: PreferenceValue;
    user?: PreferenceValue;
  };
};

export type PreferenceInspection = ResolvedPreference;

export type SettingsGroup = {
  id: string;
  appId: string;
  category: string;
  featureId?: string;
  label: string;
  ring: PreferenceRing;
  scope: string;
  settings: PreferenceSchema[];
};

export type ShellEvent<TPayload = unknown> = {
  type: string;
  payload: TPayload;
  timestamp: number;
};

export type ShellSDKOptions = {
  instanceId?: string;
  platformId?: string;
};

export type ShellSDK = {
  commands: CommandRegistry;
  context: ContextKeyService;
  events: EventBus;
  instanceId: string;
  platformId: string;
  preferences: PreferencesStore;
};

type Listener = () => void;

type ContextChangeListener = (change: {
  key: string;
  nextValue: ContextValue;
  previousValue: ContextValue;
}) => void;

type CommandActivator = (command: CommandContribution) => Promise<void> | void;

const defaultPlatformId = "astryxkit";
const defaultShellInstanceId = "astryxkit-shell-sdk";

export class DisposableStore implements Disposable {
  private disposables = new Set<Disposable>();
  private isDisposed = false;

  add<TDisposable extends Disposable>(disposable: TDisposable): TDisposable {
    if (this.isDisposed) {
      disposable.dispose();
      return disposable;
    }

    this.disposables.add(disposable);
    return disposable;
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
    const pending = Array.from(this.disposables);
    this.disposables.clear();

    for (const disposable of pending) {
      disposable.dispose();
    }
  }
}

export class ContextKeyService {
  private values = new Map<string, ContextValue>();
  private listeners = new Set<ContextChangeListener>();
  private version = 0;

  get<TValue extends ContextValue>(key: string): TValue | undefined {
    return this.values.get(key) as TValue | undefined;
  }

  set(key: string, value: ContextValue) {
    const previousValue = this.values.get(key);

    if (previousValue === value) {
      return;
    }

    if (value === undefined) {
      this.values.delete(key);
    } else {
      this.values.set(key, value);
    }

    this.version += 1;
    this.emit({ key, nextValue: value, previousValue });
  }

  snapshot(): ContextSnapshot {
    return new Map(this.values);
  }

  snapshotVersion(): number {
    return this.version;
  }

  matches(expression?: string): boolean {
    if (!expression) {
      return true;
    }

    return expression
      .split("&&")
      .map((clause) => clause.trim())
      .every((clause) => this.matchesClause(clause));
  }

  subscribe(listener: ContextChangeListener): Disposable {
    this.listeners.add(listener);

    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  private emit(change: {
    key: string;
    nextValue: ContextValue;
    previousValue: ContextValue;
  }) {
    for (const listener of this.listeners) {
      listener(change);
    }
  }

  private matchesClause(clause: string): boolean {
    if (clause.length === 0) {
      return true;
    }

    if (clause.startsWith("!")) {
      const key = clause.slice(1).trim();
      return !Boolean(this.values.get(key));
    }

    const match = clause.match(/^([A-Za-z0-9_.:-]+)\s*(==|!=)\s*(.+)$/);

    if (!match) {
      return Boolean(this.values.get(clause));
    }

    const key = match[1] ?? "";
    const operator = match[2] ?? "==";
    const expected = parseContextLiteral(match[3] ?? "");
    const actual = this.values.get(key);
    const isEqual = actual === expected;

    return operator === "==" ? isEqual : !isEqual;
  }
}

export class CommandRegistry {
  private activator?: CommandActivator;
  private commands = new Map<string, CommandContribution>();
  private handlers = new Map<string, CommandHandler>();
  private history: CommandHistoryEntry[] = [];
  private listeners = new Set<Listener>();
  private declareCount = 0;
  private sourceDisposables = new Map<string, Disposable>();
  private version = 0;

  constructor(private readonly getShell: () => ShellSDK) {}

  declare(command: CommandContribution): Disposable {
    const normalizedCommand = normalizeCommand(command);

    assertNamespaced(normalizedCommand.id, normalizedCommand.appId, "Command id");

    if (this.commands.has(normalizedCommand.id)) {
      throw new Error(`Command already declared: ${normalizedCommand.id}`);
    }

    this.commands.set(normalizedCommand.id, normalizedCommand);
    this.declareCount += 1;
    this.emit();

    return {
      dispose: () => {
        this.commands.delete(normalizedCommand.id);
        this.handlers.delete(normalizedCommand.id);
        this.emit();
      },
    };
  }

  registerSource(source: CommandSourceContribution): Disposable {
    this.sourceDisposables.get(source.id)?.dispose();

    const store = new DisposableStore();
    const registerCommand = (
      command: CommandContribution,
      parent?: CommandContribution
    ) => {
      const normalizedCommand = normalizeCommand({
        ...command,
        appId: command.appId || source.appId,
        category: command.category || source.label,
        parentId: parent?.id ?? command.parentId,
        priority: command.priority ?? source.priority,
        ring: command.ring ?? source.ring,
        sourceId: command.sourceId ?? source.id,
        sourceLabel: command.sourceLabel ?? source.label,
      });

      store.add(this.declare(normalizedCommand));

      if (normalizedCommand.handler) {
        store.add(this.bind(normalizedCommand.id, normalizedCommand.handler));
      }

      for (const child of normalizedCommand.children ?? []) {
        registerCommand(
          {
            ...child,
            appId: child.appId || normalizedCommand.appId,
            category: child.category || normalizedCommand.category,
            paletteHidden: child.paletteHidden ?? true,
            ring: child.ring ?? normalizedCommand.ring,
            sourceId: child.sourceId ?? normalizedCommand.sourceId,
            sourceLabel: child.sourceLabel ?? normalizedCommand.sourceLabel,
          },
          normalizedCommand
        );
      }
    };

    for (const command of source.commands) {
      registerCommand(command);
    }

    const disposable = {
      dispose: () => {
        if (this.sourceDisposables.get(source.id) === disposable) {
          this.sourceDisposables.delete(source.id);
        }

        store.dispose();
      },
    };

    this.sourceDisposables.set(source.id, disposable);
    this.emit();

    return disposable;
  }

  bind(commandId: string, handler: CommandHandler): Disposable {
    if (!this.commands.has(commandId)) {
      throw new Error(`Cannot bind unknown command: ${commandId}`);
    }

    this.handlers.set(commandId, handler);
    this.emit();

    return {
      dispose: () => {
        if (this.handlers.get(commandId) === handler) {
          this.handlers.delete(commandId);
          this.emit();
        }
      },
    };
  }

  get(commandId: string): CommandContribution | undefined {
    return this.commands.get(commandId);
  }

  isBound(commandId: string): boolean {
    return this.handlers.has(commandId);
  }

  paletteItems(context: ContextKeyService): CommandContribution[] {
    return Array.from(this.commands.values())
      .filter((command) => !command.paletteHidden && context.matches(command.when))
      .sort(compareCommands);
  }

  rankedPaletteItems(
    query: string,
    context: ContextKeyService
  ): RankedCommandResult[] {
    const { prefix, query: searchQuery } = parseCommandQuery(query);
    const commands = this.paletteItems(context).filter((command) =>
      prefix ? prefix.filter(command) : true
    );
    const ranked = this.rankCommands(commands, searchQuery, prefix, context);

    if (searchQuery || prefix) {
      return ranked;
    }

    const recent = this.history
      .map((entry) => this.commands.get(entry.actionId))
      .filter((command): command is CommandContribution =>
        Boolean(command && !command.paletteHidden && context.matches(command.when))
      )
      .filter(
        (command, index, commands) =>
          commands.findIndex((item) => item.id === command.id) === index
      )
      .map((command) => ({
        command,
        isRecent: true,
        matchRanges: [],
        ringScore: ringScore(command.ring ?? "app") + 10,
        source: commandSourceForCommand(command),
        textScore: 1,
      }));

    return [...recent, ...ranked];
  }

  rankedChildItems(
    parentId: string,
    query: string,
    context: ContextKeyService
  ): RankedCommandResult[] {
    const parent = this.commands.get(parentId);

    if (!parent) {
      return [];
    }

    const childCommands = (parent.children ?? [])
      .map((child) => this.commands.get(child.id) ?? normalizeCommand(child))
      .filter((command) => context.matches(command.when));
    const { prefix, query: searchQuery } = parseCommandQuery(query);

    return this.rankCommands(
      childCommands.filter((command) => (prefix ? prefix.filter(command) : true)),
      searchQuery,
      prefix,
      context
    );
  }

  prefixModes(): CommandPrefixMode[] {
    return builtInCommandPrefixes;
  }

  async execute(commandId: string): Promise<void> {
    const command = this.commands.get(commandId);

    if (!command) {
      throw new Error(`Unknown command: ${commandId}`);
    }

    let handler = this.handlers.get(commandId);

    if (!handler && this.activator) {
      await this.activator(command);
      handler = this.handlers.get(commandId);
    }

    if (!handler && !command.route && !command.href) {
      throw new Error(`Command has no bound handler: ${commandId}`);
    }

    await handler?.({ command, shell: this.getShell() });
    this.recordHistory(command);
  }

  setActivator(activator: CommandActivator): Disposable {
    this.activator = activator;

    return {
      dispose: () => {
        if (this.activator === activator) {
          this.activator = undefined;
        }
      },
    };
  }

  subscribe(listener: Listener): Disposable {
    this.listeners.add(listener);

    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  debugSnapshot() {
    return {
      boundHandlers: this.handlers.size,
      declaredCommands: this.commands.size,
      declareCalls: this.declareCount,
      dynamicSources: this.sourceDisposables.size,
      historyEntries: this.history.length,
    };
  }

  snapshotVersion(): number {
    return this.version;
  }

  private emit() {
    this.version += 1;
    for (const listener of this.listeners) {
      listener();
    }
  }

  private rankCommands(
    commands: CommandContribution[],
    query: string,
    prefix: CommandPrefixMode | undefined,
    context: ContextKeyService
  ): RankedCommandResult[] {
    return commands
      .filter((command) => context.matches(command.when))
      .map((command) => {
        const match = fuzzyCommandMatch(command, query);

        return {
          command,
          isRecent: false,
          matchRanges: match.ranges,
          prefix,
          ringScore: ringScore(command.ring ?? "app"),
          source: commandSourceForCommand(command),
          textScore: match.score,
        };
      })
      .filter((result) => query.length === 0 || result.textScore > 0)
      .sort(compareRankedCommands);
  }

  private recordHistory(command: CommandContribution) {
    this.history = [
      {
        actionId: command.id,
        actionLabel: command.title,
        actionUrl: command.route ?? command.href,
        icon: command.icon,
        invokedAt: Date.now(),
        ring: command.ring ?? "app",
        scope: command.sourceId ?? command.appId,
      },
      ...this.history.filter((entry) => entry.actionId !== command.id),
    ].slice(0, 5);
    this.emit();
  }
}

export class PreferenceSnapshot {
  private seedValues: ReadonlyMap<string, PreferenceValueRecord>;
  private userValues: ReadonlyMap<string, PreferenceValueRecord>;

  constructor({
    seedValues,
    userValues,
  }: {
    seedValues?: ReadonlyMap<string, PreferenceValueRecord>;
    userValues?: ReadonlyMap<string, PreferenceValueRecord>;
  } = {}) {
    this.seedValues = seedValues ?? new Map();
    this.userValues = userValues ?? new Map();
  }

  get(
    ring: PreferenceRing,
    scope: string,
    key: string
  ): PreferenceValueRecord | null {
    const id = preferenceRecordId(ring, scope, key);
    return this.userValues.get(id) ?? this.seedValues.get(id) ?? null;
  }
}

export function resolvePreference(
  snapshot: PreferenceSnapshot,
  schema: PreferenceSchema,
  context: RingContext,
  platformId = defaultPlatformId
): ResolvedPreference {
  const normalizedSchema = normalizePreferenceSchema(schema, platformId);
  const rings = [
    { ring: "feature", scope: context.feature },
    { ring: "app", scope: context.app },
    { ring: "product", scope: context.product },
    { ring: "platform", scope: context.platform ?? platformId },
  ] as const;

  for (const { ring, scope } of rings) {
    if (!scope) {
      continue;
    }

    const stored = snapshot.get(ring, scope, schema.key);

    if (stored) {
      const migrated = migratePreferenceValue(stored.value, schema);
      const source = {
        ring,
        scope,
        layer: stored.layer,
      };

      return {
        key: schema.key,
        schema,
        value: migrated,
        source,
        scope: stored.layer === "user" ? "user" : ring,
        isDefault: false,
        isInherited: context.currentRing
          ? ring !== context.currentRing
          : ring !== normalizedSchema.ring,
        hasUserOverride: stored.layer === "user",
        layers: {},
      };
    }
  }

  return {
    key: schema.key,
    schema,
    value: normalizedSchema.defaultValue,
    source: {
      ring: "default",
      scope: normalizedSchema.scope,
    },
    scope: "default",
    isDefault: true,
    isInherited: true,
    hasUserOverride: false,
    layers: {},
  };
}

export class PreferencesStore {
  private listeners = new Set<Listener>();
  private schemas = new Map<string, PreferenceSchema>();
  private schemaDeclareCount = 0;
  private seedValues = new Map<string, PreferenceValueRecord>();
  private userValues = new Map<string, PreferenceValueRecord>();
  private version = 0;

  constructor(private readonly platformId = defaultPlatformId) {}

  declare(schema: PreferenceSchema): Disposable {
    const normalizedSchema = normalizePreferenceSchema(schema, this.platformId);
    assertNamespaced(
      normalizedSchema.key,
      normalizedSchema.appId,
      "Preference key"
    );

    if (this.schemas.has(normalizedSchema.key)) {
      throw new Error(`Preference already declared: ${normalizedSchema.key}`);
    }

    this.schemas.set(normalizedSchema.key, normalizedSchema);
    this.schemaDeclareCount += 1;
    this.emit();

    return {
      dispose: () => {
        this.schemas.delete(normalizedSchema.key);
        this.deleteValuesForKey(normalizedSchema.key);
        this.emit();
      },
    };
  }

  contributeValue(
    key: string,
    value: PreferenceValue,
    scope: Exclude<PreferenceScope, "default" | "user">
  ): Disposable {
    const target = this.valueTargetForKey(key, scope);
    const recordId = preferenceRecordId(target.ring, target.scope, key);
    const hadPreviousValue = this.seedValues.has(recordId);
    const previousValue = this.seedValues.get(recordId);

    this.validateValue(key, value);
    this.seedValues.set(recordId, {
      key,
      ring: target.ring,
      scope: target.scope,
      value,
      layer: "seed",
      schemaVersion: this.schemas.get(key)?.schemaVersion,
    });
    this.emit();

    return {
      dispose: () => {
        if (hadPreviousValue && previousValue) {
          this.seedValues.set(recordId, previousValue);
        } else {
          this.seedValues.delete(recordId);
        }

        this.emit();
      },
    };
  }

  set(
    key: string,
    value: PreferenceValue,
    scope: Exclude<PreferenceScope, "default">
  ) {
    const target = this.valueTargetForKey(
      key,
      scope === "user" ? undefined : scope
    );
    this.validateValue(key, value);
    this.userValues.set(preferenceRecordId(target.ring, target.scope, key), {
      key,
      ring: target.ring,
      scope: target.scope,
      value,
      layer: "user",
      schemaVersion: this.schemas.get(key)?.schemaVersion,
    });
    this.emit();
  }

  reset(key: string, scope: Exclude<PreferenceScope, "default">) {
    const target = this.valueTargetForKey(
      key,
      scope === "user" ? undefined : scope
    );
    this.userValues.delete(preferenceRecordId(target.ring, target.scope, key));
    this.emit();
  }

  inspect(key: string): PreferenceInspection {
    const schema = this.schemas.get(key);

    if (!schema) {
      return {
        key,
        source: { ring: "default", scope: "unknown" },
        scope: "default",
        isDefault: true,
        isInherited: true,
        hasUserOverride: false,
        layers: {},
      };
    }

    return this.inspectWithContext(
      key,
      contextForSchema(schema, this.platformId)
    );
  }

  inspectWithContext(
    key: string,
    context: RingContext
  ): PreferenceInspection {
    const schema = this.schemas.get(key);

    if (!schema) {
      return {
        key,
        source: { ring: "default", scope: "unknown" },
        scope: "default",
        isDefault: true,
        isInherited: true,
        hasUserOverride: false,
        layers: {},
      };
    }

    const snapshot = this.snapshot();
    const resolved = resolvePreference(snapshot, schema, context, this.platformId);
    const layers = this.layersForKey(key, context, schema);
    const userTarget = this.valueTargetForKey(key);
    const hasUserOverride = this.userValues.has(
      preferenceRecordId(userTarget.ring, userTarget.scope, key)
    );

    return {
      ...resolved,
      key,
      schema,
      scope: resolved.source.layer === "user" ? "user" : resolved.scope,
      hasUserOverride,
      layers,
    };
  }

  snapshot(): PreferenceSnapshot {
    return new PreferenceSnapshot({
      seedValues: this.seedValues,
      userValues: this.userValues,
    });
  }

  settingsGroups(context: ContextKeyService): SettingsGroup[] {
    const groups = new Map<string, SettingsGroup>();

    for (const schema of this.schemas.values()) {
      if (!context.matches(schema.when)) {
        continue;
      }

      const normalizedSchema = normalizePreferenceSchema(
        schema,
        this.platformId
      );
      const id = `${normalizedSchema.ring}:${normalizedSchema.scope}:${normalizedSchema.category}`;
      const existingGroup = groups.get(id);

      if (existingGroup) {
        existingGroup.settings.push(schema);
      } else {
        groups.set(id, {
          id,
          appId: schema.appId,
          category: schema.category,
          featureId: schema.featureId,
          label: schema.category,
          ring: normalizedSchema.ring,
          scope: normalizedSchema.scope,
          settings: [schema],
        });
      }
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      settings: group.settings.sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }

  subscribe(listener: Listener): Disposable {
    this.listeners.add(listener);

    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  debugSnapshot() {
    return {
      declaredPreferences: this.schemas.size,
      seedValues: this.seedValues.size,
      schemaDeclareCalls: this.schemaDeclareCount,
      userValues: this.userValues.size,
    };
  }

  snapshotVersion(): number {
    return this.version;
  }

  private emit() {
    this.version += 1;
    for (const listener of this.listeners) {
      listener();
    }
  }

  private deleteValuesForKey(key: string) {
    for (const recordId of this.seedValues.keys()) {
      if (recordId.endsWith(`:${key}`)) {
        this.seedValues.delete(recordId);
      }
    }

    for (const recordId of this.userValues.keys()) {
      if (recordId.endsWith(`:${key}`)) {
        this.userValues.delete(recordId);
      }
    }
  }

  private layersForKey(
    key: string,
    context: RingContext,
    schema: PreferenceSchema
  ): PreferenceInspection["layers"] {
    const layers: PreferenceInspection["layers"] = {
      default: schema.defaultValue,
    };
    const rings = [
      { ring: "platform", scope: context.platform ?? this.platformId },
      { ring: "product", scope: context.product },
      { ring: "app", scope: context.app },
      { ring: "feature", scope: context.feature },
    ] as const;

    for (const { ring, scope } of rings) {
      if (!scope) {
        continue;
      }

      const record = this.snapshot().get(ring, scope, key);

      if (!record) {
        continue;
      }

      layers[ring] = record.value;

      if (record.layer === "user") {
        layers.user = record.value;
      }
    }

    return layers;
  }

  private valueTargetForKey(
    key: string,
    ringOverride?: Exclude<PreferenceScope, "default" | "user">
  ): { ring: PreferenceRing; scope: string } {
    const schema = this.schemas.get(key);

    if (!schema) {
      throw new Error(`Unknown preference: ${key}`);
    }

    const normalizedSchema = normalizePreferenceSchema(schema, this.platformId);
    const ring = ringOverride ?? normalizedSchema.ring;

    return {
      ring,
      scope: scopeForRing(normalizedSchema, ring, this.platformId),
    };
  }

  private validateValue(key: string, value: PreferenceValue) {
    const schema = this.schemas.get(key);

    if (!schema) {
      throw new Error(`Unknown preference: ${key}`);
    }

    if (schema.type === "enum") {
      const allowedValues = schema.options?.map((option) => option.value) ?? [];

      if (!allowedValues.includes(value)) {
        throw new Error(`Preference ${key} does not allow value ${String(value)}`);
      }

      return;
    }

    if (typeof value !== schema.type) {
      throw new Error(
        `Preference ${key} expects ${schema.type}; received ${typeof value}`
      );
    }
  }
}

export class EventBus {
  private listeners = new Map<string, Set<(event: ShellEvent) => void>>();

  emit<TPayload>(type: string, payload: TPayload) {
    const event: ShellEvent<TPayload> = {
      type,
      payload,
      timestamp: Date.now(),
    };
    const listeners = this.listeners.get(type);

    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(event);
    }
  }

  on<TPayload>(
    type: string,
    listener: (event: ShellEvent<TPayload>) => void
  ): Disposable {
    const listeners =
      this.listeners.get(type) ?? new Set<(event: ShellEvent) => void>();
    const wrapped = listener as (event: ShellEvent) => void;

    listeners.add(wrapped);
    this.listeners.set(type, listeners);

    return {
      dispose: () => {
        listeners.delete(wrapped);

        if (listeners.size === 0) {
          this.listeners.delete(type);
        }
      },
    };
  }
}

type ShellGlobal = typeof globalThis & {
  __astryxkitShellSdk?: ShellSDK;
};

export function createShellSDK(options: ShellSDKOptions = {}): ShellSDK {
  const platformId = options.platformId ?? defaultPlatformId;
  let sdk = undefined as ShellSDK | undefined;
  const commands = new CommandRegistry(() => {
    if (!sdk) {
      throw new Error("Shell SDK is not initialized.");
    }

    return sdk;
  });

  sdk = {
    commands,
    context: new ContextKeyService(),
    events: new EventBus(),
    instanceId: options.instanceId ?? defaultShellInstanceId,
    platformId,
    preferences: new PreferencesStore(platformId),
  };

  return sdk;
}

export function shell(options: ShellSDKOptions = {}): ShellSDK {
  const globalScope = globalThis as ShellGlobal;

  if (!globalScope.__astryxkitShellSdk) {
    globalScope.__astryxkitShellSdk = createShellSDK(options);
  }

  return globalScope.__astryxkitShellSdk;
}

export function configureShell(options: ShellSDKOptions = {}): ShellSDK {
  const globalScope = globalThis as ShellGlobal;
  globalScope.__astryxkitShellSdk = createShellSDK(options);
  return globalScope.__astryxkitShellSdk;
}

export function resetShellForTests(options: ShellSDKOptions = {}): ShellSDK {
  return configureShell(options);
}

export function assertSingleShellInstance(candidate: ShellSDK = shell()) {
  if (candidate !== shell()) {
    throw new Error("A second shell SDK instance was detected.");
  }
}

function assertNamespaced(value: string, appId: string, label: string) {
  if (!value.startsWith(`${appId}.`)) {
    throw new Error(`${label} must be namespaced with ${appId}.`);
  }
}

const builtInCommandPrefixes: CommandPrefixMode[] = [
  {
    filter: (command) => commandKind(command) === "action",
    icon: "wrench",
    label: "Actions",
    placeholder: "Search actions",
    prefix: ">",
  },
  {
    filter: (command) => commandKind(command) === "page",
    icon: "externalLink",
    label: "Pages",
    placeholder: "Go to page",
    prefix: "/",
  },
  {
    filter: (command) => commandKind(command) === "entity",
    icon: "search",
    label: "Entities",
    placeholder: "Search entities",
    prefix: "@",
  },
  {
    filter: () => true,
    icon: "check",
    label: "Help",
    placeholder: "Search help",
    prefix: "?",
  },
];

function normalizeCommand(command: CommandContribution): CommandContribution {
  const ring =
    command.ring ?? (command.featureId ? "feature" : defaultCommandRing(command));
  const kind = command.kind ?? commandKind({ ...command, ring });

  return {
    ...command,
    childCount: command.childCount ?? command.children?.length,
    kind,
    ring,
    section: command.section ?? command.category,
    sourceId: command.sourceId ?? `${ring}:${command.appId}`,
    sourceLabel: command.sourceLabel ?? command.category,
  };
}

function defaultCommandRing(command: CommandContribution): CommandRing {
  if (command.appId === "platform") {
    return "platform";
  }

  if (command.appId === "product") {
    return "product";
  }

  return "app";
}

function commandKind(command: CommandContribution): CommandKind {
  if (command.kind) {
    return command.kind;
  }

  if (command.entity) {
    return "entity";
  }

  if (command.route || command.href) {
    return "page";
  }

  return "action";
}

function parseCommandQuery(query: string): {
  prefix?: CommandPrefixMode;
  query: string;
} {
  const trimmed = query.trimStart();
  const prefix = builtInCommandPrefixes.find((mode) =>
    trimmed.startsWith(mode.prefix)
  );

  if (!prefix) {
    return { query: query.trim() };
  }

  return {
    prefix,
    query: trimmed.slice(prefix.prefix.length).trim(),
  };
}

function commandSourceForCommand(command: CommandContribution) {
  const ring = command.ring ?? "app";

  return {
    id: command.sourceId ?? `${ring}:${command.appId}`,
    label: command.sourceLabel ?? command.category,
    ring,
  };
}

function ringScore(ring: CommandRing): number {
  if (ring === "feature") {
    return 4;
  }

  if (ring === "app") {
    return 3;
  }

  if (ring === "product") {
    return 2;
  }

  return 1;
}

function fuzzyCommandMatch(
  command: CommandContribution,
  query: string
): { ranges: Array<[number, number]>; score: number } {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return {
      ranges: [],
      score: 1,
    };
  }

  const label = command.title;
  const labelLower = label.toLowerCase();
  const exactIndex = labelLower.indexOf(normalizedQuery);

  if (exactIndex >= 0) {
    return {
      ranges: [[exactIndex, exactIndex + normalizedQuery.length]],
      score: 1000 - exactIndex,
    };
  }

  const wordStartIndex = labelLower
    .split(/\s+/)
    .findIndex((word) => word.startsWith(normalizedQuery));

  if (wordStartIndex >= 0) {
    return {
      ranges: [],
      score: 750,
    };
  }

  const subsequence = scoreSubsequence(labelLower, normalizedQuery);

  if (subsequence.score > 0) {
    return subsequence;
  }

  const keywordText = [
    command.id,
    command.appId,
    command.category,
    command.description,
    command.entity?.label,
    ...(command.keywords ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  if (keywordText.includes(normalizedQuery)) {
    return {
      ranges: [],
      score: 300,
    };
  }

  return {
    ranges: [],
    score: 0,
  };
}

function scoreSubsequence(
  value: string,
  query: string
): { ranges: Array<[number, number]>; score: number } {
  let queryIndex = 0;
  let firstMatch = -1;
  let lastMatch = -1;
  let previousMatch = -2;
  let contiguousRun = 0;
  let bestRun = 0;
  const ranges: Array<[number, number]> = [];

  for (
    let index = 0;
    index < value.length && queryIndex < query.length;
    index += 1
  ) {
    if (value[index] !== query[queryIndex]) {
      continue;
    }

    if (firstMatch === -1) {
      firstMatch = index;
    }

    if (previousMatch === index - 1) {
      contiguousRun += 1;
    } else {
      contiguousRun = 1;
    }

    bestRun = Math.max(bestRun, contiguousRun);
    lastMatch = index;
    previousMatch = index;
    queryIndex += 1;
    ranges.push([index, index + 1]);
  }

  if (queryIndex !== query.length || firstMatch < 0) {
    return {
      ranges: [],
      score: 0,
    };
  }

  return {
    ranges,
    score: 450 + bestRun * 12 - (lastMatch - firstMatch),
  };
}

function normalizePreferenceSchema(
  schema: PreferenceSchema,
  platformId: string
): PreferenceSchema & {
  ring: PreferenceRing;
  scope: string;
} {
  const ring = schema.ring ?? (schema.featureId ? "feature" : "app");

  return {
    ...schema,
    ring,
    scope: schema.scope ?? scopeForRing(schema, ring, platformId),
  };
}

function contextForSchema(
  schema: PreferenceSchema,
  platformId: string
): RingContext {
  const normalizedSchema = normalizePreferenceSchema(schema, platformId);

  return {
    platform: platformId,
    product: schema.productId,
    app: schema.appId,
    feature: schema.featureId ? `${schema.appId}.${schema.featureId}` : undefined,
    currentRing: normalizedSchema.ring,
  };
}

function scopeForRing(
  schema: PreferenceSchema,
  ring: PreferenceRing,
  platformId: string
): string {
  if (ring === "platform") {
    return platformId;
  }

  if (ring === "product") {
    return schema.productId ?? "workspace";
  }

  if (ring === "feature") {
    return schema.featureId ? `${schema.appId}.${schema.featureId}` : schema.appId;
  }

  return schema.appId;
}

function preferenceRecordId(
  ring: PreferenceRing,
  scope: string,
  key: string
): string {
  return `${ring}:${scope}:${key}`;
}

function migratePreferenceValue(
  value: PreferenceValue,
  schema: PreferenceSchema
): PreferenceValue {
  if (!schema.migrations) {
    return value;
  }

  return schema.migrations[String(value)] ?? value;
}

function parseContextLiteral(raw: string): ContextValue {
  const value = raw.trim();

  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1);
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (value === "null") {
    return null;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric) && value !== "") {
    return numeric;
  }

  return value;
}

function compareCommands(
  first: CommandContribution,
  second: CommandContribution
): number {
  return (
    (second.priority ?? 0) - (first.priority ?? 0) ||
    ringScore(second.ring ?? "app") - ringScore(first.ring ?? "app") ||
    first.title.localeCompare(second.title)
  );
}

function compareRankedCommands(
  first: RankedCommandResult,
  second: RankedCommandResult
): number {
  return (
    second.ringScore - first.ringScore ||
    second.textScore - first.textScore ||
    (second.command.priority ?? 0) - (first.command.priority ?? 0) ||
    first.command.title.localeCompare(second.command.title)
  );
}
