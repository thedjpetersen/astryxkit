import { beforeEach, describe, expect, it } from "vitest";
import {
  ShellHost,
  buildWorkspaceEntityIndex,
  collectEntityOwners,
  entityMentionId,
  filterWorkspaceEntities,
  findEntityByMentionId,
  findEntityReferences,
  normalizeAiAttribution,
  resetShellForTests,
  type ShellAppManifest,
  type WorkspaceEntityRef,
  type WorkspaceEntitySource,
} from "../src/core";

const workspace = { name: "Northstar", slug: "northstar" };

function createSource(
  overrides: Partial<WorkspaceEntitySource> = {},
): WorkspaceEntitySource {
  return {
    id: "tasks:entities",
    appId: "tasks",
    label: "Tasks",
    kinds: [{ id: "task", label: "Task", pluralLabel: "Tasks" }],
    list: () => ({
      entities: [
        {
          kind: "task",
          route: "/app/tasks/T1",
          title: "Fix login",
          code: "T1",
          owner: "Ada",
        },
      ],
    }),
    ...overrides,
  };
}

describe("workspace entity index", () => {
  it("aggregates sources and stamps the contributing appId", async () => {
    const docsSource = createSource({
      id: "docs:entities",
      appId: "docs",
      label: "Docs",
      kinds: [{ id: "doc", label: "Document", pluralLabel: "Documents" }],
      list: () => ({
        entities: [
          { kind: "doc", route: "/app/docs/d/D1", title: "Spec", owner: "Grace" },
        ],
        corpus: [{ label: "Spec", route: "/app/docs/d/D1", content: "{}" }],
      }),
    });

    const index = await buildWorkspaceEntityIndex(
      [createSource(), docsSource],
      { workspace },
    );

    expect(index.entities).toHaveLength(2);
    expect(index.entities.map((entity) => entity.appId)).toEqual([
      "tasks",
      "docs",
    ]);
    expect(index.corpus).toHaveLength(1);
    expect(index.failedSourceIds).toEqual([]);
  });

  it("degrades per source instead of rejecting", async () => {
    const broken = createSource({
      id: "loom:entities",
      appId: "loom",
      list: () => Promise.reject(new Error("api down")),
    });

    const index = await buildWorkspaceEntityIndex([broken, createSource()], {
      workspace,
    });

    expect(index.failedSourceIds).toEqual(["loom:entities"]);
    expect(index.entities).toHaveLength(1);
  });
});

describe("entity helpers", () => {
  const entities: WorkspaceEntityRef[] = [
    { kind: "task", route: "/t/1", title: "Ship analytics", code: "T1", owner: "Ada" },
    { kind: "task", route: "/t/2", title: "Analytics audit", code: "T2", owner: "Grace" },
    { kind: "doc", route: "/d/1", title: "Roadmap", code: "DXANA", owner: "Ada" },
    { kind: "person", route: "/people", title: "Ada", mentionId: "person:Ada" },
  ];

  it("ranks title prefix over substring over code matches", () => {
    const hits = filterWorkspaceEntities(entities, "ana");

    expect(hits.map((entity) => entity.title)).toEqual([
      "Analytics audit",
      "Ship analytics",
      "Roadmap",
    ]);
  });

  it("returns the head of the list for an empty query", () => {
    expect(filterWorkspaceEntities(entities, "  ", 2)).toHaveLength(2);
  });

  it("collects unique sorted owners", () => {
    expect(collectEntityOwners(entities)).toEqual(["Ada", "Grace"]);
  });

  it("resolves mention ids, honoring explicit overrides", () => {
    expect(entityMentionId(entities[0])).toBe("/t/1");
    expect(entityMentionId(entities[3])).toBe("person:Ada");
    expect(findEntityByMentionId(entities, "person:Ada")?.title).toBe("Ada");
  });

  it("finds references in the corpus, skipping the entity's own body", () => {
    const corpus = [
      { label: "Own body", route: "/t/1", content: '{"id":"/t/1"}' },
      { label: "Spec", route: "/d/1", content: '{"type":"mention","attrs":{"id":"/t/1"}}' },
      { label: "Unrelated", route: "/d/2", content: '{"id":"/t/2"}' },
    ];

    expect(
      findEntityReferences(entities[0], corpus).map((entry) => entry.label),
    ).toEqual(["Spec"]);
  });
});

describe("host entity sources", () => {
  beforeEach(() => {
    resetShellForTests();
  });

  function createManifest(source: WorkspaceEntitySource): ShellAppManifest {
    return {
      id: source.appId,
      name: source.label,
      entryUrl: `/apps/${source.appId}.js`,
      ownerTeam: "platform",
      route: `/app/${source.appId}`,
      commands: [],
      entitySources: [source],
      load: async () => ({
        activate: () => ({ dispose: () => {} }),
      }),
    };
  }

  it("registers manifest sources and lists workspace entities", async () => {
    const host = new ShellHost();
    host.register(createManifest(createSource()));

    expect(host.entityKinds().map((kind) => kind.id)).toEqual(["task"]);

    const index = await host.listWorkspaceEntities(workspace);

    expect(index.entities.map((entity) => entity.title)).toEqual([
      "Fix login",
    ]);
  });

  it("drops a manifest's sources when the registration is disposed", () => {
    const host = new ShellHost();
    const registration = host.register(createManifest(createSource()));

    expect(host.entitySources()).toHaveLength(1);
    registration.dispose();
    expect(host.entitySources()).toHaveLength(0);
  });

  it("rejects duplicate source ids", () => {
    const host = new ShellHost();
    host.registerEntitySource(createSource());

    expect(() => host.registerEntitySource(createSource())).toThrow(
      /already registered/,
    );
  });
});

describe("normalizeAiAttribution", () => {
  it("passes through null as an explicit clear", () => {
    expect(normalizeAiAttribution(null)).toBeNull();
  });

  it("treats non-strings as not provided", () => {
    expect(normalizeAiAttribution(undefined)).toBeUndefined();
    expect(normalizeAiAttribution(42)).toBeUndefined();
  });

  it("trims, caps, and collapses empty strings to null", () => {
    expect(normalizeAiAttribution("  Workers AI · Whisper  ")).toBe(
      "Workers AI · Whisper",
    );
    expect(normalizeAiAttribution("   ")).toBeNull();
    expect(normalizeAiAttribution("x".repeat(500))).toHaveLength(200);
  });
});
