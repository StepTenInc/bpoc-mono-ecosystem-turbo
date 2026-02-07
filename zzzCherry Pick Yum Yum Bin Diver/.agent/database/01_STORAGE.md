# Storage Buckets Configuration

> **Complete Storage Bucket Reference**  
> **Generated**: 2026-01-27 09:17 SGT  
> **Total Buckets**: 7

---

## Storage Buckets Overview

| Bucket | Public | Size Limit | MIME Types | Created |
|--------|--------|------------|------------|---------|
| `admin` | ❌ Private | Unlimited | Any | 2026-01-19 04:47:26 |
| **`candidate`** | ✅ Public | **10 MB** | Images + PDF only | 2026-01-19 04:41:51 |
| `company` | ❌ Private | Unlimited | Any | 2026-01-19 04:47:26 |
| `hero-videos` | ✅ Public | Unlimited | Any | 2026-01-20 05:53:39 |
| `insights-images` | ✅ Public | Unlimited | Any | 2026-01-21 01:37:31 |
| `marketing` | ✅ Public | Unlimited | Any | 2026-01-19 04:47:26 |
| `recruiter` | ✅ Public | Unlimited | Any | 2025-12-08 04:11:00 |

---

## Detailed Bucket Configurations

### `admin`
**Purpose**: Administrative files and documents  
**Public Access**: ❌ No (Private)  
**Size Limit**: None  
**Allowed MIME Types**: Any  
**Created**: 2026-01-19 04:47:26+00  

**Used For**:
- Admin documents
- Internal reports
- Compliance files

**RLS Policies**: Required (admin access only)

---

### `candidate` ⭐
**Purpose**: Candidate files (profile photos, cover photos, resumes)  
**Public Access**: ✅ Yes (Public)  
**Size Limit**: **10,485,760 bytes (10 MB)**  
**Allowed MIME Types**:
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`
- `image/gif`
- `application/pdf`

**Created**: 2026-01-19 04:41:51+00  

**Folder Structure**:
```
candidate/
├── profile_photos/      # Profile pictures
│   └── {userId}-{timestamp}.{ext}
├── cover_photos/        # Cover/banner photos
│   └── {userId}-{timestamp}.{ext}
├── resumes/             # Resume PDFs
│   └── {userId}/
│       └── {filename}.pdf
├── documents/           # Other documents
│   └── {userId}/...
├── employment_contracts/
└── offer_letters/
```

**RLS Policies**: 
- INSERT: Authenticated users can upload their own files
- UPDATE: Users can update their own files
- DELETE: Users can delete their own files  
- SELECT: Public read access

**Critical Notes**:
- ⚠️ 10MB limit enforced at bucket level
- ⚠️ Only images and PDFs allowed
- ✅ Files are publicly accessible once uploaded
- ✅ Profile photos stored at `profile_photos/{userId}-{timestamp}.ext`

---

### `company`
**Purpose**: Company logos, documents, and assets  
**Public Access**: ❌ No (Private)  
**Size Limit**: None  
**Allowed MIME Types**: Any  
**Created**: 2026-01-19 04:47:26+00  

**Used For**:
- Company logos
- Company documents
- Client materials

**RLS Policies**: Required (company/agency access only)

---

### `hero-videos`
**Purpose**: Hero section videos for marketing pages  
**Public Access**: ✅ Yes (Public)  
**Size Limit**: None  
**Allowed MIME Types**: Any  
**Created**: 2026-01-20 05:53:39+00  

**Used For**:
- Homepage hero videos
- Marketing page videos
- Promotional content

**RLS Policies**: Read-only public access

---

### `insights-images`
**Purpose**: Images for blog posts and insights articles  
**Public Access**: ✅ Yes (Public)  
**Size Limit**: None  
**Allowed MIME Types**: Any  
**Created**: 2026-01-21 01:37:31+00  

**Used For**:
- Blog post featured images
- Article inline images
- SEO-optimized images
- Social sharing images

**RLS Policies**: Read-only public access

---

### `marketing`
**Purpose**: Marketing materials and assets  
**Public Access**: ✅ Yes (Public)  
**Size Limit**: None  
**Allowed MIME Types**: Any  
**Created**: 2026-01-19 04:47:26+00  

**Used For**:
- Marketing campaign assets
- Email templates images
- Social media assets
- Promotional materials

**RLS Policies**: Read-only public access

---

### `recruiter`
**Purpose**: Recruiter profile photos and documents  
**Public Access**: ✅ Yes (Public)  
**Size Limit**: None  
**Allowed MIME Types**: Any  
**Created**: 2025-12-08 04:11:00+00  

**Used For**:
- Recruiter profile photos
- Agency staff photos
- Team member assets

**RLS Policies**: Agency isolation (each agency sees only their files)

---

## Storage RLS Policies Summary

### Public Buckets (5)
- `candidate` - Public read, authenticated write
- `hero-videos` - Public read only
- `insights-images` - Public read only
- `marketing` - Public read only
- `recruiter` - Public read, agency-isolated write

### Private Buckets (2)
- `admin` - Admin access only
- `company` - Company/agency access only

---

## File Path Conventions

### Candidate Files
```
profile_photos/{userId}-{timestamp}.ext
cover_photos/{userId}-{timestamp}.ext
resumes/{userId}/{filename}.pdf
documents/{userId}/{filename}
```

### Insights Files
```
insights-images/{slug}/{filename}
insights-images/featured/{slug}.jpg
```

### Marketing Files
```
marketing/campaigns/{campaignId}/{filename}
marketing/emails/{templateId}/{filename}
```

---

## Size Limits Summary

| Bucket | Limit | Enforced At |
|--------|-------|-------------|
| `candidate` | 10 MB | Bucket Level ✅ |
| All Others | None | - |

**Note**: Application-level size limits may also apply beyond bucket limits.

---

## MIME Type Restrictions

**Only `candidate` bucket has restrictions**:
- Images: `jpeg`, `jpg`, `png`, `webp`, `gif`
- Documents: `pdf`

**All other buckets**: No restrictions (any MIME type allowed)

---

## Common Operations

### Upload to Candidate Bucket
```typescript
// Upload profile photo
const { data, error } = await supabase.storage
  .from('candidate')
  .upload(`profile_photos/${userId}-${timestamp}.jpg`, file, {
    contentType: 'image/jpeg',
    upsert: false
  })
```

### Get Public URL
```typescript
const { data } = supabase.storage
  .from('candidate')
  .getPublicUrl('profile_photos/user-123-1234567890.jpg')

console.log(data.publicUrl) 
// https://...supabase.co/storage/v1/object/public/candidate/profile_photos/...
```

### Delete File
```typescript
const { error } = await supabase.storage
  .from('candidate')
  .remove(['profile_photos/user-123-1234567890.jpg'])
```

---

## Important Notes

1. **Candidate Bucket** is the only bucket with enforced limits
2. All **public buckets** serve files via CDN
3. **Private buckets** require signed URLs for access
4. File uploads respect **RLS policies** - check policies before upload
5. **10MB limit** on candidate bucket cannot be bypassed

---

## Related Documentation

- **[06_RLS_POLICIES.md](./06_RLS_POLICIES.md)** - Storage RLS policies
- **[02_TABLES.md](./02_TABLES.md)** - Tables that reference storage URLs
- Profile photo column: `candidates.avatar_url`
-Cover photo column: `candidate_profiles.cover_photo`
