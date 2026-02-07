# BPOC PROJECT INFO

> **Quick Reference Guide**
> 
> Essential information for developers working on BPOC

---

## PROJECT BASICS

**Name**: BPOC (Business Process Outsourcing Careers)  
**Type**: Multi-tenant SaaS Recruitment Platform  
**Tech Stack**: Next.js 14, TypeScript, Supabase, Tailwind CSS  
**Repository**: bpoc-stepten  
**Hosting**: Vercel  
**Database**: Supabase (PostgreSQL)

---

## QUICK START

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, DAILY_API_KEY, OPENAI_API_KEY

# Run development server
npm run dev

# Open browser
http://localhost:3000
```

### Test Credentials

See: `.agent/TESTING_PROTOCOLS.md` or `Docs/platform-testing/TESTING_CREDENTIALS.md`

---

## KEY CONCEPTS (5-Minute Version)

### 1. Multi-Tenant Platform
Each agency has isolated data. Candidates and jobs are shared across agencies in the talent pool.

### 2. The Recruiter Gate
Applications are hidden from clients until recruiters release them:
- `job_applications.released_to_client = FALSE` → Client CANNOT see
- `job_applications.released_to_client = TRUE` → Client CAN see

### 3. Four User Roles
- **Candidate**: Job seekers
- **Recruiter**: Agency staff (manages recruitment)
- **Client**: Hiring companies
- **Admin**: BPOC platform team (oversight)

### 4. Video Call Sharing
Each call has independent sharing controls:
- `video_call_rooms.share_with_client` - Toggle per call
- `video_call_rooms.share_with_candidate` - Toggle per call

---

## FOLDER STRUCTURE

```
bpoc-stepten/
├── .agent/               ← AI agent docs & context
├── src/
│   ├── app/              ← Next.js pages
│   │   ├── candidate/    ← Candidate dashboard
│   │   ├── recruiter/    ← Recruiter dashboard
│   │   ├── admin/        ← Admin dashboard
│   │   └── api/          ← API routes
│   ├── components/       ← React components
│   ├── lib/              ← Utilities
│   └── contexts/         ← React contexts
└── Docs/                 ← Documentation archive
```

---

## COMMON TASKS

### Add a New Feature

1. Read `.agent/MASTER_CONTEXT.md` for platform overview
2. Check `.agent/features/[role]/` for role-specific requirements
3. Follow `.agent/rules/CODING_STANDARDS.md` for code style
4. Create components in `src/components/[role]/`
5. Add pages in `src/app/[role]/`
6. Add API routes in `src/app/api/`
7. Test with `.agent/TESTING_PROTOCOLS.md`

### Debug an Issue

1. Check `.agent/tracking/KNOWN_BUGS.md` for known issues
2. Check browser console for errors
3. Check Supabase logs for database errors
4. Check Vercel logs for deployment errors
5. Use test accounts from `.agent/TESTING_PROTOCOLS.md`

### Update Database Schema

1. Create SQL migration in Supabase SQL Editor
2. Update `.agent/DATABASE_SCHEMA.md` documentation
3. Update Supabase RLS policies if needed
4. Update TypeScript types in `/src/lib/db/[module]/types.ts`

---

## IMPORTANT FILES

### Configuration
- `.env.local` - Environment variables
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration

### Key Components
- `src/components/candidate/CandidateSidebar.tsx` - Candidate navigation
- `src/components/recruiter/RecruiterSidebar.tsx` - Recruiter navigation
- `src/components/admin/AdminSidebar.tsx` - Admin navigation

### Key Contexts
- `src/contexts/AuthContext.tsx` - Authentication state
- `src/contexts/NotificationContext.tsx` - Real-time notifications

### Documentation
- `.agent/MASTER_CONTEXT.md` - Complete platform overview (READ THIS FIRST!)
- `.agent/DATABASE_SCHEMA.md` - Full database schema
- `.agent/TESTING_PROTOCOLS.md` - Testing guide

---

## FEATURE STATUS

See: `.agent/tracking/FEATURE_COMPLETION.md`

Quick Status:
- ✅ Candidate dashboard - Live
- ✅ Recruiter dashboard - Live
- ✅ Admin dashboard - Live
- ✅ Video calls (Daily.co) - Live
- ✅ Offers & negotiations - Live
- ✅ Onboarding - Live
- ✅ HR Assistant - Live
- 🚧 Client dashboard - In progress

---

## DEPLOYMENT

### Production
- **URL**: https://bpoc.io (or primary domain)
- **Platform**: Vercel
- **Branch**: `main`
- **Auto-deploy**: ✅ Enabled

### Staging
- **URL**: (staging URL)
- **Platform**: Vercel
- **Branch**: `staging`

### Pre-Deployment Checklist
- [ ] All tests pass
- [ ] No console errors
- [ ] Tested with all user roles
- [ ] Database migrations run successfully
- [ ] Environment variables updated
- [ ] No sensitive data in code

---

## GETTING HELP

### Documentation
1. `.agent/MASTER_CONTEXT.md` - Platform overview
2. `.agent/features/[role]/` - Feature-specific docs
3. `.agent/DATABASE_SCHEMA.md` - Database reference
4. `Docs/` - Archived detailed documentation

### Code References
- Sidebar files show all features per role
- `src/app/api/` shows all API endpoints
- `.agent/DATABASE_SCHEMA.md` shows all database tables

### Common Issues
See: `.agent/tracking/KNOWN_BUGS.md`

---

## CONTACTS

**Project Owner**: Stepten  
**Development Team**: BPOC Dev Team  
**Repository**: bpoc-stepten

---

**Last Updated**: January 15, 2026
