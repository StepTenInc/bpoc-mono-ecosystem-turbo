# CORS Configuration for BPOC API

## Overview

BPOC API v1 endpoints support configurable CORS (Cross-Origin Resource Sharing) to allow requests from specific domains like ShoreAgents.

---

## Configuration

### Option 1: Environment Variable (Recommended)

Set the `CORS_ORIGINS` environment variable in Vercel:

**For ShoreAgents:**
```
CORS_ORIGINS=https://shoreagents.com,https://www.shoreagents.com
```

**For Multiple Domains:**
```
CORS_ORIGINS=https://shoreagents.com,https://www.shoreagents.com,https://another-domain.com
```

**For Local Development:**
```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://shoreagents.com
```
**Note:** localhost origins (`http://localhost:*` and `http://127.0.0.1:*`) are **automatically allowed in development mode** even if not explicitly listed.

**To Allow All Origins (Default):**
```
CORS_ORIGINS=*
```
Or simply don't set the variable - defaults to `*`

---

## How It Works

1. **If `CORS_ORIGINS` is not set or equals `*`:**
   - API allows requests from **any origin** (current behavior)
   - `Access-Control-Allow-Origin: *`

2. **If `CORS_ORIGINS` is set to specific domains:**
   - API checks the request's `Origin` header
   - If origin matches an allowed domain, returns that origin
   - If origin doesn't match, returns the first allowed origin (or blocks if strict)

3. **Development Mode (NODE_ENV=development):**
   - **localhost origins are automatically allowed** (`http://localhost:*`, `http://127.0.0.1:*`)
   - This enables local development without needing to configure CORS_ORIGINS
   - Production deployments still require explicit configuration

---

## Current Implementation

The CORS system:
- ✅ Supports environment variable configuration
- ✅ Falls back to `*` (allow all) if not configured
- ✅ Validates request origin against allowed list
- ✅ Includes all necessary CORS headers:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Methods`: GET, POST, PATCH, PUT, DELETE, OPTIONS
  - `Access-Control-Allow-Headers`: Content-Type, Authorization, X-API-Key, x-api-key
  - `Access-Control-Max-Age`: 86400
  - `Access-Control-Allow-Credentials`: true

---

## Setup for ShoreAgents

### Step 1: Add Environment Variable in Vercel

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `CORS_ORIGINS`
   - **Value**: `https://shoreagents.com,https://www.shoreagents.com`
   - **Environment**: Production, Preview, Development (select all)
3. Click **Save**

### Step 2: Redeploy

After adding the environment variable, Vercel will automatically redeploy, or you can manually trigger a redeploy.

### Step 3: Test

From ShoreAgents, make a request to BPOC API:
```javascript
fetch('https://bpoc.io/api/v1/candidates/092fd214-03c5-435d-9156-4a533d950cc3/complete', {
  headers: {
    'X-API-Key': 'your-api-key',
  },
})
```

The response should include:
```
Access-Control-Allow-Origin: https://shoreagents.com
```

---

## Testing CORS

### Test from Browser Console (on ShoreAgents)

```javascript
fetch('https://bpoc.io/api/v1/candidates/092fd214-03c5-435d-9156-4a533d950cc3/complete', {
  headers: {
    'X-API-Key': 'your-api-key',
  },
})
  .then(r => r.json())
  .then(data => console.log('Success:', data))
  .catch(err => console.error('CORS Error:', err));
```

### Test with curl

```bash
curl -X GET "https://bpoc.io/api/v1/candidates/092fd214-03c5-435d-9156-4a533d950cc3/complete" \
  -H "X-API-Key: your-api-key" \
  -H "Origin: https://shoreagents.com" \
  -v
```

Look for `Access-Control-Allow-Origin: https://shoreagents.com` in the response headers.

---

## Troubleshooting

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Solution:**
1. Verify `CORS_ORIGINS` environment variable is set in Vercel
2. Check that your domain is included in the comma-separated list
3. Ensure you're using `https://` (not `http://`) in production
4. Redeploy after changing environment variables

### CORS Works Locally But Not in Production

**Solution:**
- Environment variables must be set in Vercel dashboard
- They don't automatically sync from `.env.local`
- Redeploy after adding/changing environment variables

### Still Getting CORS Errors

**Solution:**
- Temporarily set `CORS_ORIGINS=*` to allow all origins (for testing)
- Check browser console for exact error message
- Verify the `Origin` header matches exactly (including `https://`)

---

## Security Notes

- **Production**: Use specific domains (e.g., `https://shoreagents.com`)
- **Development**: Can use `*` for easier testing
- **Credentials**: `Access-Control-Allow-Credentials: true` is set, so cookies/auth headers work
- **Headers**: Only `X-API-Key` and standard headers are allowed

---

## Files Modified

- `src/app/api/v1/cors.ts` - CORS configuration and helper functions
- All API v1 routes use `withCors(response, request)` to add headers

---

**Last Updated:** December 31, 2025

