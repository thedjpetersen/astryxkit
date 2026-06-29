export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = Record<string, JsonValue>;

export type WorkerRequestContext<Env = unknown> = {
  ctx: ExecutionContext;
  env: Env;
  params: Record<string, string>;
  request: Request;
  url: URL;
};

export type WorkerRoute<Env = unknown> = {
  handle: (context: WorkerRequestContext<Env>) => Response | Promise<Response>;
  method?: string | string[];
  pathname: string | RegExp;
};

export type WorkerRouterOptions<Env = unknown> = {
  assets?: (env: Env) => Fetcher | undefined;
  health?: {
    name: string;
    path?: string;
  };
  notFound?: (context: WorkerRequestContext<Env>) => Response | Promise<Response>;
  routes: WorkerRoute<Env>[];
};

export function json<TBody extends JsonValue>(
  body: TBody,
  init: ResponseInit = {}
): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export function jsonError(
  error: string,
  status = 400,
  extras: JsonObject = {}
): Response {
  return json(
    {
      error,
      ...extras,
    },
    { status }
  );
}

export async function readJsonObject(request: Request): Promise<JsonObject> {
  const body = await request.json().catch(() => ({}));

  return isRecord(body) ? (body as JsonObject) : {};
}

export function getText(body: JsonObject, key: string): string | undefined {
  const value = body[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getNullableText(body: JsonObject, key: string): string | null {
  const value = body[key];

  if (value === null) {
    return null;
  }

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function redirectToApex({
  apexHost,
  request,
  wwwHost = `www.${apexHost}`,
}: {
  apexHost: string;
  request: Request;
  wwwHost?: string;
}): Response | null {
  const url = new URL(request.url);

  if (url.hostname !== wwwHost) {
    return null;
  }

  url.hostname = apexHost;
  return Response.redirect(url.toString(), 301);
}

export function createHealthResponse(name: string): Response {
  return json({
    name,
    runtime: "cloudflare-workers",
    status: "ok",
  });
}

export function createWorkerRouter<Env>({
  assets,
  health,
  notFound,
  routes,
}: WorkerRouterOptions<Env>) {
  return async (
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> => {
    const url = new URL(request.url);

    if (health && request.method === "GET" && url.pathname === (health.path ?? "/api/health")) {
      return createHealthResponse(health.name);
    }

    for (const route of routes) {
      const params = matchRoute(route, request.method, url.pathname);

      if (!params) {
        continue;
      }

      return route.handle({
        ctx,
        env,
        params,
        request,
        url,
      });
    }

    const assetFetcher = assets?.(env);

    if (assetFetcher) {
      return assetFetcher.fetch(request);
    }

    return notFound
      ? notFound({ ctx, env, params: {}, request, url })
      : jsonError("Not found", 404);
  };
}

function matchRoute<Env>(
  route: WorkerRoute<Env>,
  method: string,
  pathname: string
): Record<string, string> | null {
  const allowedMethods = Array.isArray(route.method)
    ? route.method
    : route.method
      ? [route.method]
      : undefined;

  if (
    allowedMethods &&
    !allowedMethods.some((allowedMethod) => allowedMethod === method)
  ) {
    return null;
  }

  if (typeof route.pathname === "string") {
    return route.pathname === pathname ? {} : null;
  }

  const match = pathname.match(route.pathname);

  if (!match) {
    return null;
  }

  return {
    ...(match.groups ?? {}),
    ...Object.fromEntries(
      match.slice(1).map((value, index) => [String(index + 1), value])
    ),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
