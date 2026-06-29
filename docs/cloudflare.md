# Cloudflare Notes

Current docs checked on 2026-06-29:

- Workers overview: https://developers.cloudflare.com/workers/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- D1 overview: https://developers.cloudflare.com/d1/
- D1 limits: https://developers.cloudflare.com/d1/platform/limits/

Important current limits from the docs:

- Workers memory per isolate: 128 MB.
- Workers Free CPU time per HTTP request: 10 ms.
- Workers Paid CPU time per HTTP request: up to 5 minutes, default 30 seconds.
- Workers Free daily requests: 100,000/day.
- Workers simultaneous outgoing connections per request: 6.
- D1 maximum database size: 10 GB on Workers Paid, 500 MB on Free.
- D1 maximum bound parameters per query: 100.
- D1 maximum SQL query duration: 30 seconds.

Before changing Worker or D1 behavior, retrieve current docs again.

Do not bake limits into framework behavior unless the limit is part of the
public helper contract and the current product limits page has been checked in
the same change. Prefer linking to Cloudflare limits from documentation and
keeping runtime helpers explicit.
