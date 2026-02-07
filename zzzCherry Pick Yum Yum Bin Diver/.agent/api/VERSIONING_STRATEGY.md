# BPOC API Versioning Strategy

## Overview

BPOC API uses **URL-based versioning** to ensure stable, predictable integrations while allowing the platform to evolve.

## Version Format

```
https://bpoc.io/api/{version}/{endpoint}
```

**Current Version:** `v1`

## Versioning Principles

### 1. Breaking Changes Require New Version

A breaking change is any change that could cause existing integrations to fail:

- Removing or renaming fields
- Changing field types
- Changing authentication methods
- Removing endpoints
- Changing error response format
- Changing status codes for existing behaviors

### 2. Non-Breaking Changes Stay in Current Version

Non-breaking changes that enhance functionality without affecting existing code:

- Adding new endpoints
- Adding new optional fields
- Adding new error codes
- Adding new enum values (with fallback)
- Improving performance
- Bug fixes

### 3. Version Support Timeline

| Version | Status | Support End Date | Notes |
|---------|--------|------------------|-------|
| v1 | **Current** | N/A | Active development |
| v2 | Planned | Q3 2026 | GraphQL support |

**Support Policy:**
- Current version: Indefinite support
- Previous version: 12 months after new version release
- Deprecated: 6 months notice before shutdown

## Current Version (v1)

### Base URL
```
https://bpoc.io/api/v1
```

### Status
✅ **Stable** - Production ready

### Key Features
- REST architecture
- JSON request/response
- API key authentication
- Rate limiting by tier
- CORS support
- Consistent error codes

### Recent Changes (January 2026)

**Non-Breaking:**
- ✅ Added POST /api/v1/candidates
- ✅ Added PUT /api/v1/candidates/:id
- ✅ Added GET /api/v1/candidates/:id
- ✅ Added rate limiting headers
- ✅ Added consistent error codes
- ✅ Standardized all responses to camelCase

**Migration Notes:**
- Input remains flexible (both camelCase and snake_case accepted)
- Output now consistently uses camelCase
- Agencies should update response parsers

## Deprecation Process

When a feature or version is deprecated:

### Step 1: Announcement (T-12 months)
- Email all API users
- Update API docs with deprecation notices
- Add `X-API-Deprecated` header to affected endpoints

### Step 2: Warnings (T-6 months)
- Add `X-API-Deprecation-Warning` header
- Log deprecation events
- Provide migration guides

### Step 3: Sunset (T+0)
- Remove deprecated functionality
- Return 410 Gone for removed endpoints
- Redirect to current version docs

## Version Migration Guide

### When v2 is Released

**Automatic Compatibility:**
- v1 endpoints continue working unchanged
- No forced migration
- 12 months to migrate at your pace

**Migration Steps:**
1. Review v2 breaking changes document
2. Test integration against v2 sandbox
3. Update code for v2 changes
4. Switch base URL to `/api/v2`
5. Monitor for issues

**Example Migration:**

```javascript
// v1 (current)
const baseUrl = 'https://bpoc.io/api/v1';

// v2 (when ready)
const baseUrl = 'https://bpoc.io/api/v2';
```

## Version Detection

Check your current API version:

```bash
curl -I "https://bpoc.io/api/v1/clients" \
  -H "X-API-Key: YOUR_KEY"
```

Response headers:
```
X-API-Version: v1
X-API-Version-Status: stable
```

## Future Versions

### v2 (Planned Q3 2026)

**Possible Features:**
- GraphQL endpoint alongside REST
- Webhook management API
- Batch operations
- Real-time subscriptions
- Enhanced filtering syntax
- Improved pagination (cursor-based)

**Breaking Changes Under Consideration:**
- Remove snake_case input support
- Require HTTPS for all requests
- Stricter validation rules
- New authentication flow (OAuth 2.0)

### v3 (Future)

**Considerations:**
- gRPC support
- Streaming responses
- Native SDKs for all major languages

## Best Practices for Version Stability

### 1. Always Specify Version in URLs
❌ **Bad:**
```javascript
const url = 'https://bpoc.io/api/clients';
```

✅ **Good:**
```javascript
const url = 'https://bpoc.io/api/v1/clients';
```

### 2. Don't Hardcode Field Names
❌ **Bad:**
```javascript
const name = response.first_name;
```

✅ **Good:**
```javascript
interface Candidate {
  firstName: string;
  lastName: string;
}
const name = (response as Candidate).firstName;
```

### 3. Handle Unknown Fields Gracefully
```javascript
// Ignore fields you don't recognize
const { firstName, lastName, ...rest } = response;
```

### 4. Check API Version Header
```javascript
const apiVersion = response.headers.get('X-API-Version');
if (apiVersion !== 'v1') {
  console.warn('Unexpected API version:', apiVersion);
}
```

### 5. Subscribe to Updates
Sign up for API change notifications:
https://bpoc.io/developers/notifications

## Version-Specific Documentation

Each version maintains its own documentation:

- **v1 Docs:** https://bpoc.io/docs/api/v1
- **v2 Docs (when available):** https://bpoc.io/docs/api/v2

## Questions?

- **General questions:** api@bpoc.io
- **Version roadmap:** https://bpoc.io/developers/roadmap
- **Status page:** https://status.bpoc.io

## Changelog

### January 2026
- ✅ Implemented consistent camelCase responses
- ✅ Added rate limiting
- ✅ Added error codes
- ✅ Added candidate CRUD endpoints

### December 2025
- ✅ v1 declared stable
- ✅ Documented all endpoints
- ✅ Added CORS support

### November 2025
- ✅ v1 beta release
- ✅ Initial API key authentication
- ✅ Core endpoints (clients, jobs, applications)
