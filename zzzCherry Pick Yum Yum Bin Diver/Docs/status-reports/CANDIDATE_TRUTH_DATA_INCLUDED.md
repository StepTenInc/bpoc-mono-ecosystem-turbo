# Candidate Truth - Complete Data Inventory

> **Single Source of Truth** - Everything about a candidate in one place

---

## 🗄️ What Is This?

**`candidate_truth` is a DATABASE VIEW** (not a table) that aggregates data from **9 tables** into a single, queryable source.

**Two Ways to Access:**
1. **API Endpoint**: `GET /api/v1/candidates/:id/complete` (Recommended - handles auth & formatting)
2. **SQL View**: `SELECT * FROM candidate_truth WHERE id = '...'` (Enterprise tier only - direct database access)

---

## 📋 What's Included

The `candidate_truth` **VIEW** and `/api/v1/candidates/:id/complete` endpoint include **ALL** candidate data from **9 tables**:

---

### 1. **Basic Candidate Info** (from `candidates` table)
- ✅ `id` - Candidate UUID
- ✅ `firstName` / `lastName` / `fullName` - Name fields
- ✅ `avatarUrl` - Profile photo URL
- ✅ `username` - Username (for platform identification)
- ✅ `slug` - URL slug (for profile URLs)
- ✅ `isActive` - Active status
- ✅ `createdAt` / `updatedAt` - Timestamps

**❌ CONTACT DETAILS EXCLUDED:**
- ❌ `email` - **NOT INCLUDED** - Use BPOC platform to contact candidates
- ❌ `phone` - **NOT INCLUDED** - Use BPOC platform to contact candidates

> **Important:** Enterprise clients must use the BPOC platform messaging system to contact candidates. Direct contact details are not provided to maintain platform control and candidate privacy.

---

### 2. **Profile Data** (from `candidate_profiles` table)
- ✅ `headline` - Professional headline/position
- ✅ `bio` - Bio/description
- ✅ `birthday` - Date of birth
- ✅ `gender` - Gender (male/female/other/prefer_not_to_say)
- ✅ `location` - Full location string
- ✅ `locationCity` - City
- ✅ `locationProvince` - Province/State
- ✅ `locationCountry` - Country
- ✅ `locationRegion` - Region
- ✅ `workStatus` - Current work status (employed/unemployed/freelancer/part_time/student)
- ✅ `currentRole` - Current job title
- ✅ `currentCompany` - Current employer
- ✅ `currentSalary` - Current salary amount
- ✅ `salaryExpectation` - Expected salary range (min/max)
- ✅ `noticePeriodDays` - Notice period in days
- ✅ `preferredShift` - Preferred shift (day/night/both)
- ✅ `preferredWorkSetup` - Work setup preference (office/remote/hybrid/any)
- ✅ `profileCompleted` - Profile completion boolean
- ✅ `profileCompleteness` - Profile completion percentage (0-100)

---

### 3. **Skills** (from `candidate_skills` table - **ALL skills**)
**Format:** JSONB array of skill objects

Each skill includes:
- ✅ `name` - Skill name
- ✅ `category` - Skill category (e.g., "Software", "Language", "Customer Service")
- ✅ `proficiencyLevel` - Level (beginner/intermediate/advanced/expert)
- ✅ `yearsExperience` - Years of experience with this skill
- ✅ `isPrimary` - Is this a primary skill?
- ✅ `verified` - Is skill verified?

**Example:**
```json
[
  {
    "name": "Customer Support",
    "category": "Customer Service",
    "proficiencyLevel": "expert",
    "yearsExperience": 5.0,
    "isPrimary": true,
    "verified": true
  },
  {
    "name": "Microsoft Excel",
    "category": "Software",
    "proficiencyLevel": "advanced",
    "yearsExperience": 4.0,
    "isPrimary": true,
    "verified": true
  }
]
```

---

### 4. **Work Experiences** (from `candidate_work_experiences` table - **ALL experiences**)
**Format:** JSONB array of work experience objects

Each experience includes:
- ✅ `id` - Experience UUID
- ✅ `role` - Job title
- ✅ `company` - Company name
- ✅ `location` - Work location
- ✅ `startDate` - Start date
- ✅ `endDate` - End date (null if current)
- ✅ `isCurrent` - Is this current job?
- ✅ `description` - Job description
- ✅ `responsibilities` - Array of responsibilities
- ✅ `achievements` - Array of achievements

**Example:**
```json
[
  {
    "id": "exp-uuid",
    "role": "Senior Virtual Assistant",
    "company": "Global Tech Solutions Inc.",
    "location": "Remote",
    "startDate": "2021-06-01",
    "endDate": null,
    "isCurrent": true,
    "description": "Providing comprehensive virtual assistance...",
    "responsibilities": ["Managed email inboxes", "Coordinated schedules"],
    "achievements": ["Reduced response time by 40%"]
  }
]
```

---

### 5. **Education** (from `candidate_educations` table - **ALL education**)
**Format:** JSONB array of education objects

Each education includes:
- ✅ `id` - Education UUID
- ✅ `degree` - Degree type (e.g., "Bachelor of Science")
- ✅ `fieldOfStudy` - Field of study
- ✅ `institution` - School/University name
- ✅ `startDate` - Start date
- ✅ `endDate` - End date (null if current)
- ✅ `isCurrent` - Is this current education?
- ✅ `grade` - Grade/GPA/Honors
- ✅ `description` - Additional description

**Example:**
```json
[
  {
    "id": "edu-uuid",
    "degree": "Bachelor of Science",
    "fieldOfStudy": "Business Administration",
    "institution": "University of the Philippines",
    "startDate": "2013-06-01",
    "endDate": "2017-03-31",
    "isCurrent": false,
    "grade": "Magna Cum Laude",
    "description": "Graduated with honors..."
  }
]
```

---

### 6. **Typing Assessment** (from `candidate_typing_assessments` table - **LATEST**)
**Format:** JSONB object (null if no assessment)

Includes:
- ✅ `wpm` - Words per minute
- ✅ `accuracy` - Overall accuracy percentage
- ✅ `score` - Assessment score
- ✅ `longestStreak` - Longest correct word streak
- ✅ `correctWords` - Number of correct words
- ✅ `wrongWords` - Number of wrong words
- ✅ `difficultyLevel` - Difficulty level (e.g., "rockstar")
- ✅ `completedAt` - When assessment was completed

**Example:**
```json
{
  "wpm": 78,
  "accuracy": 98.80,
  "score": 780,
  "longestStreak": 55,
  "correctWords": 78,
  "wrongWords": 1,
  "difficultyLevel": "rockstar",
  "completedAt": "2025-01-15T10:00:00Z"
}
```

---

### 7. **DISC Assessment** (from `candidate_disc_assessments` table - **LATEST**)
**Format:** JSONB object (null if no assessment)

Includes:
- ✅ `primaryType` - Primary DISC type (D/I/S/C)
- ✅ `secondaryType` - Secondary DISC type
- ✅ `dScore` - Dominance score
- ✅ `iScore` - Influence score
- ✅ `sScore` - Steadiness score
- ✅ `cScore` - Conscientiousness score
- ✅ `confidenceScore` - Confidence score (0-100)
- ✅ `consistencyIndex` - Consistency index
- ✅ `culturalAlignment` - Cultural alignment score
- ✅ `authenticityScore` - Authenticity score
- ✅ `completedAt` - When assessment was completed

**Example:**
```json
{
  "primaryType": "I",
  "secondaryType": "S",
  "dScore": 15,
  "iScore": 85,
  "sScore": 70,
  "cScore": 30,
  "confidenceScore": 92,
  "consistencyIndex": 88.5,
  "culturalAlignment": 95,
  "authenticityScore": 90,
  "completedAt": "2025-01-10T10:00:00Z"
}
```

---

### 8. **Resume** (from `candidate_resumes` table - **PRIMARY resume**)
**Format:** JSONB object (null if no resume)

Includes:
- ✅ `id` - Resume UUID
- ✅ `url` - Resume file URL
- ✅ `title` - Resume title
- ✅ `slug` - Resume slug
- ✅ `uploadedAt` - When resume was uploaded
- ✅ `isPrimary` - Is this the primary resume?
- ✅ `isPublic` - Is resume public?

**Example:**
```json
{
  "id": "resume-uuid",
  "url": "https://.../marco-delgado-resume-2025.pdf",
  "title": "Marco Delgado - Virtual Assistant Resume",
  "slug": "marco-delgado-resume-2025",
  "uploadedAt": "2025-01-15T10:30:00Z",
  "isPrimary": true,
  "isPublic": true
}
```

---

### 9. **AI Analysis** (from `candidate_ai_analysis` table - **LATEST**)
**Format:** JSONB object (null if no analysis)

Includes:
- ✅ `overallScore` - Overall AI score (0-100)
- ✅ `atsCompatibilityScore` - ATS compatibility score
- ✅ `contentQualityScore` - Content quality score
- ✅ `professionalPresentationScore` - Professional presentation score
- ✅ `skillsAlignmentScore` - Skills alignment score
- ✅ `strengths` - Array of key strengths
- ✅ `areasForGrowth` - Array of areas for improvement
- ✅ `recommendations` - Array of recommendations
- ✅ `summary` - Improved summary text
- ✅ `strengthsAnalysis` - Detailed strengths analysis (JSONB object)
- ✅ `sectionAnalysis` - Section-by-section analysis (JSONB object)
- ✅ `createdAt` - When analysis was created

**Example:**
```json
{
  "overallScore": 87,
  "atsCompatibilityScore": 85,
  "contentQualityScore": 90,
  "professionalPresentationScore": 88,
  "skillsAlignmentScore": 86,
  "strengths": [
    "Strong customer service background",
    "Excellent communication skills"
  ],
  "areasForGrowth": [
    "Add more specific metrics to achievements"
  ],
  "recommendations": [
    "Consider adding industry-specific certifications"
  ],
  "summary": "Experienced Virtual Assistant...",
  "strengthsAnalysis": {
    "experience": "5+ years of relevant experience",
    "skills": "Well-rounded skill set"
  },
  "sectionAnalysis": {
    "summary": { "score": 9, "feedback": "Clear and compelling" }
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

---

### 10. **Calculated Fields**
- ✅ `experienceYears` - **Auto-calculated** from work experiences (sum of all work periods)
- ✅ `languages` - **Extracted** from skills where category = "Language"

---

## 📊 Summary

**Total Data Sources:** 9 tables
- `candidates` (basic info)
- `candidate_profiles` (profile data)
- `candidate_skills` (all skills)
- `candidate_work_experiences` (all work history)
- `candidate_educations` (all education)
- `candidate_typing_assessments` (latest typing test)
- `candidate_disc_assessments` (latest DISC test)
- `candidate_resumes` (primary resume)
- `candidate_ai_analysis` (latest AI analysis)

**Total Fields:** 50+ fields
**Arrays Included:** Skills, Work Experiences, Education, Languages
**Nested Objects:** Assessments, Resume, AI Analysis

---

## 🎯 What You Get

**ONE call = EVERYTHING** (except contact details)

No more:
- ❌ Querying 9 different tables
- ❌ Joining multiple tables
- ❌ Understanding database structure
- ❌ Handling missing data
- ❌ Calculating experience years manually

Just:
- ✅ One API call: `GET /api/v1/candidates/:id/complete`
- ✅ Or one SQL query: `SELECT * FROM candidate_truth WHERE id = '...'`
- ✅ Get ALL candidate data in one response

**⚠️ Contact Details Policy:**
- ❌ Email and phone are **NOT included** in the response
- ✅ Use BPOC platform messaging system to contact candidates
- ✅ This maintains platform control and candidate privacy

---

## 🚀 How To Call It

### Option 1: API Endpoint (Recommended)

**Status:** ✅ **LIVE & WORKING** - Endpoint is fully implemented and ready to use.

```bash
curl -X GET "https://bpoc.io/api/v1/candidates/092fd214-03c5-435d-9156-4a533d950cc3/complete" \
  -H "X-API-Key: your-api-key"
```

**Response:** JSON object with all candidate data (excluding contact details)

### Option 2: SQL View (Enterprise Tier Only)

```sql
-- Get single candidate
SELECT * FROM candidate_truth WHERE id = '092fd214-03c5-435d-9156-4a533d950cc3';

-- Search candidates
SELECT * FROM candidate_truth 
WHERE location_country = 'Philippines' 
  AND experience_years >= 3
ORDER BY profile_completion_percentage DESC;

-- Filter by skills
SELECT * FROM candidate_truth
WHERE skills @> '[{"name": "Customer Support"}]'::jsonb;
```

**Access:** Enterprise tier only - direct database connection required

---

**That's your Candidate Truth!** 🎉

