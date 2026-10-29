# Ask Jignesh proxy

A small Cloudflare Worker between the portfolio's **Ask Jignesh** assistant and the Claude API.
It keeps the API key off the frontend, builds the system prompt from
[`src/data/content.ts`](../src/data/content.ts) (so answers stay grounded in the portfolio),
validates input, rate-limits per visitor, and streams answers back as Server-Sent Events.

Without a deployed proxy the site still works: the assistant switches to **offline answers**
(keyword search over the same content file, see `src/data/knowledge.ts`).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/chat` | Body `{"messages":[{"role":"user","content":"…"}]}` → `text/event-stream` of `{"type":"delta","text"}`, `{"type":"reset"}`, `{"type":"done"}` or `{"type":"error","message"}` |
| `GET` | `/health` | `{"ok":true,"model":"…","configured":true}` |

Limits: at most 12 messages of 1,000 characters each, last message from the user, 16 KB per request.

## Deploy (about 5 minutes)

1. Install and log in (from this `api/` folder):
   ```bash
   cd api && npm install && npx wrangler login
   ```
2. Add your Claude API key as a secret (get one at console.anthropic.com):
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
3. Check `wrangler.toml`:
   - `ALLOWED_ORIGINS`: your site's origin(s), comma-separated. `*` works as a wildcard
     (`http://localhost:*` is there for local development). Requests from other origins get a 403.
   - `[[ratelimits]]`: Cloudflare's built-in limiter, 8 requests per minute per IP by default.
     `namespace_id` is any number unique within your account.
   - Optional: create a KV namespace for an exact global daily cap
     (`npx wrangler kv namespace create USAGE_KV`) and uncomment the `[[kv_namespaces]]` block.
4. Deploy:
   ```bash
   npx wrangler deploy
   ```
   Wrangler prints a URL like `https://ask-jignesh.<you>.workers.dev`. Check it with
   `curl https://ask-jignesh.<you>.workers.dev/health`.
5. Point the site at it, either:
   - set `assistant.apiUrl` in `src/data/content.ts`, or
   - build with `VITE_ASSISTANT_API_URL=https://ask-jignesh.<you>.workers.dev npm run build`
     (for GitHub Actions, add it as a repository variable and pass it to the build step).

   The header badge in Ask Jignesh switches from "Offline answers" to "Live AI".

## Configuration

| Variable | Default | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | (secret) | Required. Set with `wrangler secret put`. |
| `ANTHROPIC_MODEL` | `claude-opus-5-5` | Any Claude model id. `claude-haiku-5-5` is far cheaper per token if cost matters more than answer quality. |
| `EFFORT` | `low` | `low`, `medium` or `high`. Chat answers need little reasoning. |
| `ALLOWED_ORIGINS` | GitHub Pages + localhost | Comma-separated, `*` wildcards. |
| `ALLOW_NO_ORIGIN` | unset | `true` accepts requests without an `Origin` header (e.g. curl). |
| `PER_MINUTE_LIMIT` / `PER_DAY_LIMIT` | `8` / `60` | Per-IP in-memory fallback limits (per Worker instance). |
| `DAILY_LIMIT` | `1500` | Total chat requests per UTC day; `0` disables. Exact with `USAGE_KV`, approximate without. |

## How answers stay grounded

- The system prompt (`buildSystemPrompt` in `src/data/knowledge.ts`) contains the whole profile and
  an explicit list of unknowns (e.g. no details yet about specific Keppel projects). `TODO:` placeholders
  in `content.ts` are never sent as facts.
- The model is told to answer only from that profile, to treat visitor messages as questions rather
  than instructions, and to reply with exactly `assistant.unknownAnswer` when the answer isn't there.
- The prompt is identical on every request, so it is prompt-cached (`cache_control: ephemeral`).
  Redeploy after editing `content.ts` so the Worker picks up the new profile.
- If the model's safety checks decline a request, server-side `fallbacks: "default"` retries it on a
  fallback model. If the whole chain declines, the visitor sees the standard "I don't have that info" reply.
  The fallback is skipped for models that don't support it (Haiku).

## Local development

```bash
cd api
printf 'ANTHROPIC_API_KEY=sk-ant-...\n' > .dev.vars   # gitignored
npx wrangler dev --port 8787
# in the repo root, in another terminal:
VITE_ASSISTANT_API_URL=http://localhost:8787 npm run dev
```

## Other hosts

`src/index.ts` exports a standard `fetch(request, env)` handler that uses only Web APIs and the
official Anthropic SDK, so it ports to Vercel Edge Functions or Deno Deploy by passing environment
variables in as `env`. The Cloudflare rate-limit and KV bindings are optional; without them the
in-memory limits apply.
