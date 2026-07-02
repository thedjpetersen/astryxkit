import type { WorkspaceContext } from "./host";

export type WorkspaceEntityKind = {
  id: string;
  label: string;
  pluralLabel: string;
  accent?: string;
};

export type WorkspaceEntityRef = {
  kind: string;
  route: string;
  title: string;
  appId?: string;
  code?: string;
  /**
   * Stable identity for rich-text mentions. Defaults to `route`; set it when
   * several entities share one route (for example people who all resolve to
   * a shared directory page).
   */
  mentionId?: string;
  owner?: string;
  subtitle?: string;
};

export type WorkspaceEntityCorpusEntry = {
  /** Serialized rich-text body that mention references are scanned from. */
  content: string;
  label: string;
  route: string;
};

export type WorkspaceEntityContribution = {
  entities: WorkspaceEntityRef[];
  corpus?: WorkspaceEntityCorpusEntry[];
};

export type WorkspaceEntityQuery = {
  workspace: WorkspaceContext;
};

export type WorkspaceEntitySource = {
  id: string;
  appId: string;
  label: string;
  kinds: WorkspaceEntityKind[];
  list: (
    query: WorkspaceEntityQuery,
  ) => Promise<WorkspaceEntityContribution> | WorkspaceEntityContribution;
};

export type WorkspaceEntityIndex = {
  corpus: WorkspaceEntityCorpusEntry[];
  entities: WorkspaceEntityRef[];
  failedSourceIds: string[];
};

/**
 * Aggregate every registered source into one workspace-wide index. Sources
 * fail independently: a broken app degrades to its entities being absent and
 * its id landing in `failedSourceIds`, never to a rejected index.
 */
export async function buildWorkspaceEntityIndex(
  sources: WorkspaceEntitySource[],
  query: WorkspaceEntityQuery,
): Promise<WorkspaceEntityIndex> {
  const settled = await Promise.allSettled(
    sources.map(async (source) => {
      const contribution = await source.list(query);

      return { contribution, source };
    }),
  );

  const index: WorkspaceEntityIndex = {
    corpus: [],
    entities: [],
    failedSourceIds: [],
  };

  settled.forEach((result, position) => {
    if (result.status === "rejected") {
      index.failedSourceIds.push(sources[position].id);
      return;
    }

    const { contribution, source } = result.value;

    for (const entity of contribution.entities) {
      index.entities.push({ appId: source.appId, ...entity });
    }

    index.corpus.push(...(contribution.corpus ?? []));
  });

  return index;
}

/**
 * Relevance filter for mention popups and entity explorers. Title prefix
 * beats title substring beats code substring; ties break alphabetically.
 */
export function filterWorkspaceEntities(
  entities: WorkspaceEntityRef[],
  rawQuery: string,
  limit = 8,
): WorkspaceEntityRef[] {
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return entities.slice(0, limit);
  }

  const scored: Array<{ entity: WorkspaceEntityRef; score: number }> = [];

  for (const entity of entities) {
    const title = entity.title.toLowerCase();
    const code = entity.code?.toLowerCase() ?? "";
    const score = title.startsWith(query)
      ? 3
      : title.includes(query)
        ? 2
        : code.includes(query)
          ? 1
          : 0;

    if (score > 0) {
      scored.push({ entity, score });
    }
  }

  return scored
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.entity.title.localeCompare(right.entity.title),
    )
    .slice(0, limit)
    .map((item) => item.entity);
}

/** Unique owner names across an entity set, sorted for stable display. */
export function collectEntityOwners(
  entities: WorkspaceEntityRef[],
): string[] {
  const owners = new Set<string>();

  for (const entity of entities) {
    const owner = entity.owner?.trim();

    if (owner) {
      owners.add(owner);
    }
  }

  return Array.from(owners).sort((left, right) => left.localeCompare(right));
}

export function entityMentionId(entity: WorkspaceEntityRef): string {
  return entity.mentionId ?? entity.route;
}

export function findEntityByMentionId(
  entities: WorkspaceEntityRef[],
  mentionId: string,
): WorkspaceEntityRef | undefined {
  return entities.find((entity) => entityMentionId(entity) === mentionId);
}

/**
 * Where is this entity mentioned? Scans corpus entries for the serialized
 * mention node (`"id":"<mentionId>"`), skipping the entity's own body.
 */
export function findEntityReferences(
  entity: WorkspaceEntityRef,
  corpus: WorkspaceEntityCorpusEntry[],
): WorkspaceEntityCorpusEntry[] {
  const needle = `"id":${JSON.stringify(entityMentionId(entity))}`;

  return corpus.filter(
    (entry) => entry.route !== entity.route && entry.content.includes(needle),
  );
}
