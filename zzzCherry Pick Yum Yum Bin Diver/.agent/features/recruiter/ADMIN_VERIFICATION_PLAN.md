# 📋 ADMIN VERIFICATION SYSTEM - IMPLEMENTATION PLAN

**Date**: 2026-01-28
**Purpose**: Enable BPOC admins to review and approve recruiter verification documents
**Status**: Planning Complete - Ready for Implementation

---

## 🎯 EXECUTIVE SUMMARY

We built a complete recruiter authorization system with document uploads (TIN, DTI, business permit, SEC). Recruiters can now upload documents and wait for admin approval. **However, admins currently have NO WAY to view or approve these documents.**

This plan outlines exactly what needs to be built to complete the workflow.

---

## ✅ WHAT WE ALREADY BUILT (Recruiter Side)

### Database Schema ✅
- `agency_recruiters.verification_status` - Tracks verification state
- `agency_recruiters.invited_by_recruiter_id` - Authorization chain
- `agencies.tin_number`, `dti_certificate_url`, `business_permit_url`, `sec_registration_url` - Document storage
- `agencies.documents_verified`, `documents_verified_at`, `documents_verified_by` - Admin approval tracking

### Frontend Pages ✅
- `/recruiter/signup` - Authorization question ("Are you authorized?")
- `/recruiter/signup/documents` - Upload TIN, DTI, business permit, SEC
- `/recruiter/signup/awaiting-authorization` - Wait for auth head
- `/recruiter/signup/pending-verification` - Wait for admin approval

### Backend APIs ✅
- `POST /api/recruiter/signup` - Creates recruiter with correct verification status
- `POST /api/recruiter/documents/upload` - Uploads documents to Supabase storage
- Storage bucket `agency-documents` created with RLS policies

---

## ❌ WHAT'S MISSING (Admin Side)

### 1. **No Way to View Documents** ❌
- Admin can see recruiter exists
- Admin **CANNOT** see uploaded documents
- Admin **CANNOT** download or preview TIN, DTI, business permit, SEC

### 2. **No Individual Recruiter Detail Page** ❌
- `/admin/recruiters` shows a list
- Clicking a recruiter does nothing
- **NEED**: `/admin/recruiters/[id]` page to show full details + documents

### 3. **Approval Button Doesn't Update Documents** ❌
- Existing "Verify" button only sets `agency_recruiters.is_verified = true`
- Does **NOT** update `agencies.documents_verified = true`
- Does **NOT** track which admin verified

### 4. **No Document Fields in Agency Detail** ❌
- `/admin/agencies/[id]` shows team, clients, jobs
- Does **NOT** show TIN number, document URLs, verification status

### 5. **APIs Return Incomplete Data** ❌
- `GET /api/admin/recruiters` - Missing `verification_status`, document fields
- `GET /api/admin/agencies/[id]` - Missing all document fields
- `PATCH /api/admin/recruiters/[id]/verify` - Doesn't update agency documents

---

## 🎯 IMPLEMENTATION PLAN

### **PHASE 1: Update Backend APIs** (Priority: CRITICAL)

#### Task 1.1: Update Recruiter List API
**File**: `/src/app/api/admin/recruiters/route.ts`

**Changes Needed**:
```typescript
.select(`
  id,
  verification_status,           // ADD - New enum field
  invited_by_recruiter_id,       // ADD - Authorization chain
  profile_completion_percentage, // ADD - Profile progress
  role,                          // ADD - admin/owner/recruiter

  // Existing fields
  is_verified,
  is_active,
  created_at,
  verified_at,
  rejected_at,
  rejection_reason,

  user:users (id, email, created_at, last_sign_in_at),

  agency:agencies (
    id, name, email, logo_url, is_active,

    // ADD DOCUMENT FIELDS
    tin_number,
    dti_certificate_url,
    business_permit_url,
    sec_registration_url,
    documents_uploaded_at,
    documents_verified,
    documents_verified_at,
    documents_verified_by
  ),

  // ADD - Self-join to get who invited this recruiter
  invited_by:agency_recruiters!invited_by_recruiter_id (
    id, first_name, last_name, email
  )
`)
```

**Update filtering** to use `verification_status` instead of just `is_verified`.

---

#### Task 1.2: Create Recruiter Detail API
**File**: `/src/app/api/admin/recruiters/[id]/route.ts` (NEW FILE)

**Purpose**: Get full recruiter details including documents

**Query**:
```typescript
export async function GET(req, { params }) {
  const { id } = params;

  const { data: recruiter } = await supabaseAdmin
    .from('agency_recruiters')
    .select(`
      *,
      user:users (id, email, last_sign_in_at, created_at),
      agency:agencies (
        id, name, logo_url, email, phone,
        tin_number,
        dti_certificate_url,
        business_permit_url,
        sec_registration_url,
        documents_uploaded_at,
        documents_verified,
        documents_verified_at,
        documents_verified_by
      ),
      invited_by:agency_recruiters!invited_by_recruiter_id (
        id, first_name, last_name, email, role
      ),
      invited_members:agency_recruiters!invited_by_recruiter_id (
        id, first_name, last_name, email, verification_status, role
      )
    `)
    .eq('id', id)
    .single();

  // Lookup admin who verified documents
  if (recruiter.agency.documents_verified_by) {
    const { data: admin } = await supabaseAdmin
      .from('bpoc_users')
      .select('email, first_name, last_name')
      .eq('id', recruiter.agency.documents_verified_by)
      .single();
    recruiter.agency.verifiedByAdmin = admin;
  }

  return NextResponse.json({ recruiter });
}
```

---

#### Task 1.3: Update Verification API
**File**: `/src/app/api/admin/recruiters/[id]/verify/route.ts`

**Changes Needed**:
```typescript
if (action === 'verify') {
  // 1. Get recruiter details
  const { data: recruiter } = await supabaseAdmin
    .from('agency_recruiters')
    .select('id, role, agency_id, agency:agencies(tin_number, dti_certificate_url, business_permit_url, sec_registration_url)')
    .eq('id', recruiterId)
    .single();

  // 2. Validate documents are uploaded
  const docs = recruiter.agency;
  if (!docs.tin_number || !docs.dti_certificate_url ||
      !docs.business_permit_url || !docs.sec_registration_url) {
    return NextResponse.json({
      error: 'Cannot verify. Agency documents incomplete.'
    }, { status: 400 });
  }

  // 3. Update recruiter
  await supabaseAdmin
    .from('agency_recruiters')
    .update({
      verification_status: 'verified',
      is_verified: true,
      is_active: true,
      verified_at: new Date().toISOString(),
      rejected_at: null,
      rejection_reason: null,
      profile_completion_percentage: 100,
    })
    .eq('id', recruiterId);

  // 4. Update agency document verification
  await supabaseAdmin
    .from('agencies')
    .update({
      documents_verified: true,
      documents_verified_at: new Date().toISOString(),
      documents_verified_by: adminUser.id,  // Track which admin
    })
    .eq('id', recruiter.agency_id);

  // 5. Auto-approve team members waiting for this auth head
  if (recruiter.role === 'admin' || recruiter.role === 'owner') {
    await supabaseAdmin
      .from('agency_recruiters')
      .update({
        verification_status: 'verified',
        is_verified: true,
        is_active: true,
        verified_at: new Date().toISOString(),
      })
      .eq('invited_by_recruiter_id', recruiterId)
      .eq('verification_status', 'pending_authorization_head');
  }

  // 6. Log action...
}
```

---

#### Task 1.4: Update Agency Detail API
**File**: `/src/app/api/admin/agencies/[id]/route.ts`

**Add to response**:
```typescript
const formattedAgency = {
  // ... existing fields ...

  // ADD DOCUMENT FIELDS
  tinNumber: agency.tin_number,
  dtiCertificateUrl: agency.dti_certificate_url,
  businessPermitUrl: agency.business_permit_url,
  secRegistrationUrl: agency.sec_registration_url,
  documentsUploadedAt: agency.documents_uploaded_at,
  documentsVerified: agency.documents_verified,
  documentsVerifiedAt: agency.documents_verified_at,
  documentsVerifiedBy: agency.documents_verified_by,

  // ... rest of fields ...
};
```

---

### **PHASE 2: Build Recruiter Detail Page** (Priority: HIGH)

#### Task 2.1: Create Recruiter Detail Page
**File**: `/src/app/(admin)/admin/recruiters/[id]/page.tsx` (NEW FILE)

**Layout Structure**:
```tsx
<div className="grid lg:grid-cols-3 gap-6">

  {/* LEFT COLUMN - Main Info */}
  <div className="lg:col-span-2 space-y-6">

    {/* Recruiter Info Card */}
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar />
          <div>
            <h2>{recruiter.firstName} {recruiter.lastName}</h2>
            <p>{recruiter.email}</p>
            <Badge>{recruiter.verificationStatus}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt>Role</dt>
            <dd>{recruiter.role}</dd>
          </div>
          <div>
            <dt>Agency</dt>
            <dd><Link to={`/admin/agencies/${recruiter.agency.id}`}>{recruiter.agency.name}</Link></dd>
          </div>
          <div>
            <dt>Join Date</dt>
            <dd>{formatDate(recruiter.createdAt)}</dd>
          </div>
          <div>
            <dt>Profile Completion</dt>
            <dd>{recruiter.profileCompletionPercentage}%</dd>
          </div>
        </dl>
      </CardContent>
    </Card>

    {/* Agency Documents Card */}
    <Card>
      <CardHeader>
        <CardTitle>Agency Documents</CardTitle>
        {recruiter.agency.documentsVerified ? (
          <Badge variant="success">Verified</Badge>
        ) : (
          <Badge variant="warning">Awaiting Verification</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">

        {/* TIN Number */}
        <div>
          <label className="text-sm text-gray-500">TIN Number</label>
          <p className="font-mono">{recruiter.agency.tinNumber || 'Not provided'}</p>
        </div>

        {/* DTI Certificate */}
        <div>
          <label className="text-sm text-gray-500">DTI Certificate</label>
          {recruiter.agency.dtiCertificateUrl ? (
            <div className="flex items-center gap-2">
              <a href={recruiter.agency.dtiCertificateUrl} target="_blank" className="text-cyan-400">
                View Document
              </a>
              <Badge variant="outline">{formatDate(recruiter.agency.documentsUploadedAt)}</Badge>
            </div>
          ) : (
            <p className="text-gray-500">Not uploaded</p>
          )}
        </div>

        {/* Business Permit */}
        <div>
          <label className="text-sm text-gray-500">Business Permit</label>
          {recruiter.agency.businessPermitUrl ? (
            <a href={recruiter.agency.businessPermitUrl} target="_blank" className="text-cyan-400">
              View Document
            </a>
          ) : (
            <p className="text-gray-500">Not uploaded</p>
          )}
        </div>

        {/* SEC Registration */}
        <div>
          <label className="text-sm text-gray-500">SEC Registration</label>
          {recruiter.agency.secRegistrationUrl ? (
            <a href={recruiter.agency.secRegistrationUrl} target="_blank" className="text-cyan-400">
              View Document
            </a>
          ) : (
            <p className="text-gray-500">Not uploaded</p>
          )}
        </div>

        {/* Verification Info */}
        {recruiter.agency.documentsVerified && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Verified by {recruiter.agency.verifiedByAdmin?.email} on {formatDate(recruiter.agency.documentsVerifiedAt)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Approval Actions */}
    {recruiter.verificationStatus === 'pending_admin_review' && (
      <Card>
        <CardHeader>
          <CardTitle>Review Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={handleApprove}
              className="bg-green-500"
              disabled={approving}
            >
              {approving ? 'Approving...' : 'Approve Documents'}
            </Button>
            <Button
              onClick={() => setShowRejectModal(true)}
              variant="destructive"
            >
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    )}

  </div>

  {/* RIGHT COLUMN - Sidebar */}
  <div className="space-y-6">

    {/* Authorization Chain */}
    {recruiter.invitedBy && (
      <Card>
        <CardHeader>
          <CardTitle>Invited By</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Avatar />
            <div>
              <p className="font-medium">{recruiter.invitedBy.firstName} {recruiter.invitedBy.lastName}</p>
              <p className="text-sm text-gray-500">{recruiter.invitedBy.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Team Members They Invited */}
    {recruiter.invitedMembers?.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Team Members Invited</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recruiter.invitedMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{member.firstName} {member.lastName}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <Badge>{member.verificationStatus}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Activity Log */}
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-gray-500">Account Created</p>
            <p>{formatDate(recruiter.createdAt)}</p>
          </div>
          {recruiter.agency.documentsUploadedAt && (
            <div>
              <p className="text-gray-500">Documents Uploaded</p>
              <p>{formatDate(recruiter.agency.documentsUploadedAt)}</p>
            </div>
          )}
          {recruiter.verifiedAt && (
            <div>
              <p className="text-gray-500">Verified</p>
              <p>{formatDate(recruiter.verifiedAt)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

  </div>
</div>
```

**Handler Functions**:
```typescript
const handleApprove = async () => {
  setApproving(true);
  try {
    const response = await fetch(`/api/admin/recruiters/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify' }),
    });

    if (!response.ok) throw new Error('Approval failed');

    toast.success('Recruiter verified successfully');
    router.refresh();
  } catch (error) {
    toast.error(error.message);
  } finally {
    setApproving(false);
  }
};
```

---

#### Task 2.2: Update Recruiter List to Link to Detail
**File**: `/src/app/(admin)/admin/recruiters/page.tsx`

**Change**:
```tsx
// Current: Just displays recruiter card
<div className="p-4 bg-white rounded-lg border">
  {/* recruiter info */}
</div>

// Update to: Make card clickable
<Link href={`/admin/recruiters/${recruiter.id}`}>
  <div className="p-4 bg-white rounded-lg border hover:border-cyan-500 cursor-pointer transition">
    {/* recruiter info */}
  </div>
</Link>
```

---

### **PHASE 3: Update Agency Detail Page** (Priority: MEDIUM)

#### Task 3.1: Add Documents Section
**File**: `/src/app/(admin)/admin/agencies/[id]/page.tsx`

**Add new Card after team members section**:
```tsx
{/* Agency Documents Card */}
<Card className="bg-white/5 border-white/10">
  <CardHeader className="border-b border-white/10">
    <CardTitle className="text-white flex items-center gap-2">
      <FileText className="h-5 w-5 text-purple-400" />
      Agency Documents
      {agency.documentsVerified && (
        <Badge className="bg-emerald-500/20 text-emerald-400">Verified</Badge>
      )}
    </CardTitle>
  </CardHeader>
  <CardContent className="p-4 space-y-4">

    {/* TIN */}
    <div>
      <p className="text-gray-500 text-xs">TIN Number</p>
      <p className="text-white font-mono">{agency.tinNumber || 'Not provided'}</p>
    </div>

    {/* DTI */}
    <div>
      <p className="text-gray-500 text-xs mb-1">DTI Certificate</p>
      {agency.dtiCertificateUrl ? (
        <a href={agency.dtiCertificateUrl} target="_blank" className="text-cyan-400 hover:underline text-sm">
          View Document →
        </a>
      ) : (
        <p className="text-gray-600 text-sm">Not uploaded</p>
      )}
    </div>

    {/* Business Permit */}
    <div>
      <p className="text-gray-500 text-xs mb-1">Business Permit</p>
      {agency.businessPermitUrl ? (
        <a href={agency.businessPermitUrl} target="_blank" className="text-cyan-400 hover:underline text-sm">
          View Document →
        </a>
      ) : (
        <p className="text-gray-600 text-sm">Not uploaded</p>
      )}
    </div>

    {/* SEC */}
    <div>
      <p className="text-gray-500 text-xs mb-1">SEC Registration</p>
      {agency.secRegistrationUrl ? (
        <a href={agency.secRegistrationUrl} target="_blank" className="text-cyan-400 hover:underline text-sm">
          View Document →
        </a>
      ) : (
        <p className="text-gray-600 text-sm">Not uploaded</p>
      )}
    </div>

    {/* Verification Status */}
    {agency.documentsVerified && (
      <div className="pt-3 border-t border-white/10">
        <p className="text-gray-500 text-xs">
          Verified {formatDate(agency.documentsVerifiedAt)} by {agency.verifiedByName}
        </p>
      </div>
    )}
  </CardContent>
</Card>
```

---

### **PHASE 4: Enhancement Features** (Priority: LOW)

#### Task 4.1: Document Preview Modal
Create a modal component to preview PDFs and images inline.

#### Task 4.2: Authorization Chain Tree View
Visual tree showing recruiter hierarchy.

#### Task 4.3: Bulk Approval
Allow admin to approve multiple pending recruiters at once.

---

## 📊 TASK BREAKDOWN

### Phase 1: Backend APIs (4 tasks)
- [ ] Update `/api/admin/recruiters` list API
- [ ] Create `/api/admin/recruiters/[id]` detail API
- [ ] Update `/api/admin/recruiters/[id]/verify` approval API
- [ ] Update `/api/admin/agencies/[id]` to include documents

### Phase 2: Recruiter Detail Page (2 tasks)
- [ ] Create `/admin/recruiters/[id]/page.tsx`
- [ ] Update recruiter list to link to detail page

### Phase 3: Agency Page Enhancement (1 task)
- [ ] Add documents section to `/admin/agencies/[id]/page.tsx`

### Phase 4: Optional Enhancements (3 tasks)
- [ ] Document preview modal component
- [ ] Authorization chain tree visualization
- [ ] Bulk approval feature

---

## 🚀 ESTIMATED EFFORT

| Phase | Tasks | Complexity | Time Estimate |
|-------|-------|------------|---------------|
| Phase 1 | 4 | Medium | 2-3 hours |
| Phase 2 | 2 | Medium | 2-3 hours |
| Phase 3 | 1 | Low | 1 hour |
| Phase 4 | 3 | Low | 2-3 hours |
| **TOTAL** | **10** | **Medium** | **7-10 hours** |

---

## 🎯 SUCCESS CRITERIA

When complete, admin should be able to:
1. ✅ View list of pending recruiters with document status
2. ✅ Click recruiter to see full details
3. ✅ View uploaded TIN, DTI, business permit, SEC documents
4. ✅ Preview/download documents
5. ✅ Approve or reject with one click
6. ✅ See who invited who (authorization chain)
7. ✅ View document verification status on agency page
8. ✅ Track which admin verified which agency

---

## 📝 NOTES

- All database fields already exist (migration ran successfully)
- Storage bucket `agency-documents` already created with RLS policies
- Recruiters can already upload documents - admin UI is the only gap
- Existing admin panel works - we're just adding new fields/pages
- No breaking changes to existing functionality

---

**Ready to implement?** Start with Phase 1 (Backend APIs) since everything else depends on it.
