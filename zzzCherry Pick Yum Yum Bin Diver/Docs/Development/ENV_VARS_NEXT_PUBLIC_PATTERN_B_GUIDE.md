# Env Vars + `NEXT_PUBLIC_*` + Vercel + “Pattern B” (Cheat Sheet)

This doc is a **memory aid** for configuring ShoreAgents (local + Vercel) to talk to BPOC without confusion and without leaking secrets.

---

## The 1-minute mental model

There are **two places your Next.js code can run**:

- **Browser (client)**: React components, hooks, anything with `"use client"`.
  - Users can see these values in DevTools / bundled JS.
- **Server**: Next.js Route Handlers (`/app/api/**/route.ts`), server components, server actions.
  - Secrets can live here.

---

## What `NEXT_PUBLIC_*` really means

`NEXT_PUBLIC_*` means: **“This environment variable is exposed to browser JavaScript.”**

It does **NOT** mean “API” or “backend.”

### Rules

- **If browser code needs it** → name must start with **`NEXT_PUBLIC_`**
- **If it’s a secret** → do **NOT** use `NEXT_PUBLIC_` (server-only)

### Safe to be `NEXT_PUBLIC_*` (usually)

- **URLs** (API base URL, site URL)
- Feature flags
- Public IDs (analytics IDs, pixel IDs)

### Never `NEXT_PUBLIC_*` (secrets)

- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DAILY_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any secret “server API key”

If a secret is `NEXT_PUBLIC_*`, assume it’s effectively **public**.

---

## `.env` vs `.env.local` (local dev)

In local dev, Next.js loads env files; **`.env.local` overrides `.env`**.

- **`.env`**: shared defaults (often committed), should NOT contain secrets
- **`.env.local`**: your machine + secrets + local overrides (NOT committed)

### Important

After changing env vars, **restart `npm run dev`** to be safe.

---

## Vercel env vars (prod/preview)

Vercel environment variables are like hosted `.env` values.

Next.js rules still apply:
- `NEXT_PUBLIC_*` → exposed to the browser bundle
- no prefix → server-only

### Important

Changes to `NEXT_PUBLIC_*` often require a **redeploy** to show up in the frontend.

---

## Localhost + deployed sites (the “localhost trap”)

- **Local ShoreAgents** can call `http://localhost:3001` (your laptop).
- **ShoreAgents on Vercel cannot call `localhost:3001`**, because from Vercel “localhost” means **their own server**, not your computer.

So:
- **Local**: `NEXT_PUBLIC_BPOC_API_URL=http://localhost:3001/api/v1`
- **Vercel**: `NEXT_PUBLIC_BPOC_API_URL=https://www.bpoc.io/api/v1` (or a staging domain)

---

## Pattern A vs Pattern B (what we mean)

### Pattern A (direct from browser → BPOC)

Browser calls BPOC directly:

```
ShoreAgents Browser  ──fetch──>  BPOC API
```

Works fine **only if** BPOC endpoints don’t require secrets from the browser.

If BPOC requires `X-API-Key`, Pattern A forces you to expose that key to the browser (bad).

---

### Pattern B (recommended): browser → ShoreAgents server → BPOC

Browser calls ShoreAgents server, which calls BPOC with server-only secrets:

```
ShoreAgents Browser ──fetch──> ShoreAgents /api/* (server) ──fetch──> BPOC API
                                               (adds X-API-Key)
```

Why Pattern B is better:
- You can keep `BPOC_API_KEY` **server-only**
- You can log, retry, validate, rate limit
- You can swap BPOC base URL per env without touching browser code

---

## Pattern B: exact implementation plan (ShoreAgents)

### 1) Add env vars in ShoreAgents

**Local (ShoreAgents repo) `.env.local`:**

```env
# Server-only (no NEXT_PUBLIC)
BPOC_API_URL=http://localhost:3001/api/v1
BPOC_API_KEY=bpoc_********

# ShoreAgents site/app url (optional, but should be 3000 locally)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Vercel (ShoreAgents project settings):**

- `BPOC_API_URL` = `https://www.bpoc.io/api/v1`
- `BPOC_API_KEY` = `bpoc_********`

Do **NOT** set `NEXT_PUBLIC_BPOC_API_KEY`.

> If you currently have `NEXT_PUBLIC_BPOC_API_KEY` in Vercel, remove it and rotate the key.

---

### 2) Create a ShoreAgents server route that proxies to BPOC

Example: `ShoreAgents/src/app/api/bpoc/notifications/call/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const baseUrl = process.env.BPOC_API_URL;
  const apiKey = process.env.BPOC_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { error: "Missing BPOC_API_URL or BPOC_API_KEY" },
      { status: 500 }
    );
  }

  const resp = await fetch(`${baseUrl}/notifications/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}
```

---

### 3) Update ShoreAgents UI to call its own server route

Instead of:

```ts
fetch("https://www.bpoc.io/api/v1/notifications/call", ...)
```

Use:

```ts
fetch("/api/bpoc/notifications/call", { method: "POST", body: JSON.stringify(payload) })
```

Now the browser never needs to know BPOC base URL or API key.

---

## How to debug in 30 seconds

Open Chrome DevTools → Network tab → trigger Quick Call.

### If you see a request to `www.bpoc.io`
You still have:
- a hardcoded URL, or
- a fallback like `|| "https://www.bpoc.io"`, or
- a missing env var and it’s defaulting to prod.

### If you implemented Pattern B correctly
You should see browser request go to:
- `http://localhost:3000/api/bpoc/notifications/call`

And then the ShoreAgents server logs show it forwarding to:
- `http://localhost:3001/api/v1/notifications/call`

---

## Practical “do this, not that”

- ✅ **Do**: Put local overrides in `.env.local`
- ❌ **Don’t**: hardcode domains like `https://www.bpoc.io` in React code
- ✅ **Do**: Keep secrets server-only (no `NEXT_PUBLIC_`)
- ❌ **Don’t**: ship `NEXT_PUBLIC_*` secrets to the browser
- ✅ **Do**: restart dev servers after changing env vars

---

## FAQ

### “So `NEXT_PUBLIC_*` is never for APIs?”
Wrong framing.

`NEXT_PUBLIC_*` is for **browser-visible config**. If the browser must know an API base URL, that’s fine.
What’s not fine is putting **secret keys** in `NEXT_PUBLIC_*`.

### “Why can’t Vercel use my localhost?”
Because Vercel runs on their servers. Their `localhost` is not your laptop.


