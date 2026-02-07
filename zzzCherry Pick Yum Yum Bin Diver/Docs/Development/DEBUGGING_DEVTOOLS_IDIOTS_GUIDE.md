# Debugging in Chrome DevTools (for “idiots”, aka when you’re pissed off)

This is a **copy/paste mental model** you can use anytime something “crashes”, “doesn’t work”, or “randomly 401s”.

---

## The only thing to remember

Most bugs become obvious if you can answer **three questions**:

1. **What request was made?** (Network tab)
2. **What did the server respond?** (Status + Response body)
3. **Where in code did that request come from?** (Sources / search)

---

## Must-toggle settings (Network tab)

In **DevTools → Network**:

- **Preserve log** ✅
  - Keeps requests even after navigation/refresh/redirect.
- **Disable cache** ✅
  - Stops cached responses from hiding the real current behavior.
  - Only applies while DevTools is open.
- Filter: **Fetch/XHR** ✅
  - Shows API calls (the ones that usually matter).

---

## The “status code” cheat sheet (the one that makes you money)

- **200 OK**: request succeeded
- **204 OK but no body**: succeeded, but server intentionally returned nothing
- **400 Bad Request**: your input is wrong (missing field, wrong type, wrong format)
- **401 Unauthorized**: not logged in / missing token / invalid token
- **403 Forbidden**: logged in but not allowed (permissions / role / RLS / ownership)
- **404 Not Found**: wrong URL, route missing, or bad ID
- **500 Internal Server Error**: server crashed (look at server logs)

### Fast mapping

- **400** = “my fault”
- **401/403** = “auth/permission”
- **404** = “wrong path/id”
- **500** = “server bug or missing DB table/field”

---

## Console tab: what it’s for

Console is for:
- JS errors (crashes)
- quick logs
- seeing errors from React code

### How to use Console correctly

1) Filter to only see the important stuff:
- Click the filter dropdown and enable **Errors** only (or type `-verbose -info` style filters).

2) Find the **first real error**
- The **first red error** is usually the cause.
- Everything after can be cascading noise.

### What to ignore (common spam)

- “Download React DevTools…”
- Deprecated warnings (`atomFamily is deprecated`)
- Analytics `ingest` errors (like `127.0.0.1:7242/ingest … ERR_CONNECTION_REFUSED`)
  - Usually telemetry. Not your core app breaking.

---

## Network tab: the king (this is where you become unstoppable)

When something fails:

1) Network → Fetch/XHR
2) Click the request that failed (red)
3) Read **these 4 things**:

### A) Headers → Request URL
This tells you **where it actually went**.

Examples:
- ✅ `http://localhost:3001/api/v1/...` (local BPOC)
- ❌ `https://www.bpoc.io/api/v1/...` (prod)

### B) Headers → Status Code
Use the cheat sheet above.

### C) Headers → Request Headers (look for these)
- **Authorization**
  - If endpoint is protected, you want:
    - `Authorization: Bearer <token>`
  - Missing → likely **401**
- **Content-Type**
  - For JSON requests:
    - `Content-Type: application/json`

### D) Response / Preview
Read the error JSON.

Example:
- `{ "error": "Unauthorized" }`
- `{ "error": "Missing required fields: roomId, candidateId" }`

The response body usually tells you exactly what to fix.

---

## “Copy as cURL” (pro move)

Right click a failing request in Network:
- **Copy → Copy as cURL**

Paste in terminal and run it.

Why this is huge:
- Removes UI complexity
- Lets you reproduce the bug instantly
- You can tweak one field at a time

---

## The 30-second debugging loop (do this every time)

1. Reproduce bug once.
2. Network → find first failing request.
3. Read:
   - Request URL
   - Status Code
   - Response body
4. Decide:
   - **400** → fix request payload/params
   - **401** → add/refresh token / ensure cookies/headers are sent
   - **403** → permission/role/ownership logic
   - **404** → wrong route or wrong ID
   - **500** → open server logs, find stack trace

---

## Server logs (when you see 500)

If Network shows **500**, you must check server logs.

Typical causes:
- Missing DB table/column
- Bad Prisma query
- Crash during Daily/Stripe/OpenAI call

What you’re looking for:
- Stack trace line showing the file
- Root error message (the first one)

---

## Debugging auth issues (common in modern apps)

### 401 Unauthorized checklist

- Do you have a session?
- Is `Authorization: Bearer ...` present?
- Is the token expired?
- Are you hitting the right origin? (prod vs local)

### 403 Forbidden checklist

- You are logged in, but:
  - wrong role (candidate vs recruiter)
  - wrong row ownership
  - Supabase RLS blocking you

---

## Debugging “it crashes when I click a button”

This is the fastest workflow:

1) Console:
- Look for **Uncaught** errors.
- Click the stack trace → it opens the exact file/line.

2) Network:
- See what request happened on click.
- If request fails, fix request/auth first.

3) If no request happened:
- The crash is purely frontend (null access, undefined, bad state).

---

## Debugging “weird” localhost ports and random ingest calls

If you see something like:
- `http://127.0.0.1:7242/ingest/... ERR_CONNECTION_REFUSED`

That usually means:
- A telemetry tool is trying to send logs to a local collector that isn’t running.

How to confirm:
- Check the request path: `/ingest/` is commonly analytics.
- If your core request is `/api/...` and that works, ignore ingest errors.

---

## Quick glossary

- **Headers**: metadata about the HTTP request/response.
- **Host**: which domain/port you called (e.g. `localhost:3001`).
- **Referer**: which page triggered the request.
- **Origin**: CORS-related domain that initiated the request.
- **Bearer token**: session token used for Authorization.

---

## If you’re stuck: what to paste for help

When asking for help, paste:

1) Network request:
- Request URL
- Status Code
- Response body

2) Console error:
- The first red error + stack trace

That’s enough to diagnose 90% of issues immediately.


