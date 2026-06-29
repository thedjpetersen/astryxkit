export function requireD1Database<Env extends Record<string, unknown>>(
  env: Env,
  binding: keyof Env & string
): D1Database {
  const database = env[binding];

  if (!isD1Database(database)) {
    throw new Error(`Missing D1 database binding: ${binding}`);
  }

  return database;
}

export async function runD1Batch(
  database: D1Database,
  statements: D1PreparedStatement[]
): Promise<D1Result[]> {
  if (statements.length === 0) {
    return [];
  }

  return database.batch(statements);
}

export function prepareD1Statement(
  database: D1Database,
  sql: string,
  ...bindings: unknown[]
): D1PreparedStatement {
  return database.prepare(sql).bind(...bindings);
}

function isD1Database(value: unknown): value is D1Database {
  return (
    typeof value === "object" &&
    value !== null &&
    "prepare" in value &&
    "batch" in value
  );
}
