# Resume Builder Research & Integration Plan

## 📋 OLD FUNCTIONALITY SUMMARY

### 1. **PDF/DOC/DOCX Processing Pipeline**
- **Step 1: File Upload** → Accept PDF, DOC, DOCX files
- **Step 2: CloudConvert API** → Convert PDF/DOC/DOCX → JPEG images (multi-page support)
- **Step 3: GPT-4 Vision OCR** → Extract text from JPEG images
- **Step 4: Organized DOCX Creation** → Create structured DOCX from extracted text
- **Step 5: AI JSON Conversion** → Use OpenAI GPT-4o to convert DOCX content to structured JSON
- **Step 6: Resume Data Structure** → Flexible JSON that adapts to resume content

**Key Functions:**
- `processResumeFile()` - Main processing function
- `extractTextFromPDF()` - PDF text extraction
- `convertPDFToJPEGSimple()` - PDF to JPEG conversion
- `performGPTOCROnImages()` - GPT Vision OCR
- `convertDOCXContentToJSON()` - AI-powered JSON conversion
- `buildResumeWithCloudConvertPipeline()` - Final resume object builder

### 2. **AI Analysis System**
- **Claude API Integration** → Uses Anthropic Claude Sonnet 4 for analysis
- **Scores Generated:**
  - `overall_score` (0-100)
  - `ats_compatibility_score` (0-100)
  - `content_quality_score` (0-100)
  - `professional_presentation_score` (0-100)
  - `skills_alignment_score` (0-100)

- **Analysis Results:**
  - `key_strengths` (array)
  - `strengths_analysis` (object)
  - `improvements` (array)
  - `recommendations` (array)
  - `improved_summary` (string)
  - `salary_analysis` (object)
  - `career_path` (object)
  - `section_analysis` (object)

**Key Functions:**
- `performAIAnalysis()` - Main analysis function in analysis/page.tsx
- API endpoint: `/api/analyze-resume` (old Railway version)

### 3. **Resume Building/Templates**
- **Template System** → Multiple resume templates (executive, modern, creative, etc.)
- **Editable Resume Builder** → Drag-and-drop, WYSIWYG editor
- **Export Options** → PDF, DOCX export
- **Save to Profile** → Save generated resume with template

**Key Files:**
- `src/app/resume-builder/build/page.tsx` - Resume builder UI
- `src/app/resume-builder/analysis/page.tsx` - AI analysis UI
- `src/app/resume-builder/page.tsx` - File upload/processing page

### 4. **Database Storage (OLD - Railway)**
**Tables Used:**
- `resumes_extracted` - Stored extracted resume data (JSON)
- `resumes_generated` - Stored generated resume templates (JSON)
- `saved_resumes` - Final saved resumes with templates, slugs, public/private
- `ai_analysis_results` - AI analysis results linked to user_id

**API Endpoints (OLD):**
- `/api/save-resume` - Save extracted resume data
- `/api/save-generated-resume` - Save generated resume
- `/api/analyze-resume` - Perform AI analysis
- `/api/save-resume-to-profile` - Save final resume to profile

### 5. **Database Storage (NEW - Supabase)**
**Tables:**
- `candidate_resumes`:
  - `id`, `candidate_id`, `slug` (unique)
  - `title`, `extracted_data` (JSONB), `generated_data` (JSONB), `resume_data` (JSONB)
  - `original_filename`, `file_url`, `template_used`
  - `is_primary`, `is_public`, `view_count`
  - `generation_metadata` (JSONB)

- `candidate_ai_analysis`:
  - `id`, `candidate_id`, `resume_id` (nullable)
  - `session_id`, `overall_score`, `ats_compatibility_score`, etc.
  - All analysis results (JSONB fields)
  - `candidate_profile_snapshot`, `skills_snapshot`, `experience_snapshot`, `education_snapshot`

**Current Functions:**
- `saveResume()` - in `src/lib/db/resumes/queries.supabase.ts`
- `getResumeByCandidateId()` - Get resume for candidate
- `getResumeBySlug()` - Get resume by slug

### 6. **Complete Flow**
```
1. User uploads PDF/DOC/DOCX
   ↓
2. CloudConvert converts to JPEG
   ↓
3. GPT-4 Vision extracts text
   ↓
4. Organized DOCX created
   ↓
5. OpenAI converts to structured JSON
   ↓
6. JSON saved to candidate_resumes.extracted_data
   ↓
7. User can run AI Analysis (Claude)
   ↓
8. Analysis saved to candidate_ai_analysis
   ↓
9. User builds resume with template
   ↓
10. Generated resume saved to candidate_resumes.generated_data
   ↓
11. Final resume saved to candidate_resumes.resume_data
```

## 🎯 INTEGRATION PLAN

### Phase 1: Create Resume Builder Tab in Dashboard
- Add "Resume Builder" tab to candidate dashboard
- Create new page: `src/app/(candidate)/candidate/dashboard/resume-builder/page.tsx`
- Reuse existing components from `src/app/resume-builder/`

### Phase 2: File Upload & Processing
- Integrate `processResumeFile()` function
- Add file upload UI
- Show processing progress
- Save extracted data to `candidate_resumes.extracted_data`

### Phase 3: AI Analysis Integration
- Create new API endpoint: `/api/candidates/[id]/resume/analyze`
- Use Supabase `candidate_ai_analysis` table
- Integrate Claude API analysis
- Display analysis results in dashboard

### Phase 4: Resume Building
- Integrate resume template system
- Add resume builder UI
- Save generated resume to `candidate_resumes.generated_data`
- Save final resume to `candidate_resumes.resume_data`

### Phase 5: Resume Management
- List saved resumes
- View/edit resumes
- Set primary resume
- Delete resumes

## 📁 FILES TO CREATE/MODIFY

### New Files:
1. `src/app/(candidate)/candidate/dashboard/resume-builder/page.tsx` - Main resume builder page
2. `src/app/api/candidates/[id]/resume/analyze/route.ts` - AI analysis API
3. `src/app/api/candidates/[id]/resume/route.ts` - Resume CRUD API
4. `src/lib/db/ai-analysis/queries.supabase.ts` - AI analysis database functions

### Files to Reuse:
1. `src/lib/utils.ts` - Contains all processing functions
2. `src/app/resume-builder/build/page.tsx` - Resume builder UI (can extract components)
3. `src/app/resume-builder/analysis/page.tsx` - Analysis UI (can extract components)

### Files to Update:
1. `src/app/(candidate)/candidate/dashboard/page.tsx` - Add Resume Builder tab
2. `src/lib/db/resumes/queries.supabase.ts` - Already exists, may need enhancements

## 🔧 TECHNICAL REQUIREMENTS

### Environment Variables Needed:
- `CLOUDCONVERT_API_KEY` - For PDF conversion
- `OPENAI_API_KEY` - For OCR and JSON conversion
- `ANTHROPIC_API_KEY` - For Claude AI analysis

### Dependencies:
- `@opendocsg/pdf2md` - PDF text extraction
- `mammoth` - DOCX text extraction
- `tesseract.js` - OCR fallback
- `openai` - GPT-4 Vision OCR
- `@anthropic-ai/sdk` - Claude API

## ✅ NEXT STEPS

1. ✅ Research complete
2. ⏭️ Create Resume Builder tab in dashboard
3. ⏭️ Integrate file upload and processing
4. ⏭️ Integrate AI analysis
5. ⏭️ Integrate resume building
6. ⏭️ Connect to Supabase tables
7. ⏭️ Test end-to-end flow


