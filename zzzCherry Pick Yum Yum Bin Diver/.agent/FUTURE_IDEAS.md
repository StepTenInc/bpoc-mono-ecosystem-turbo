# Future Ideas & Enhancements

## 🧠 Universal AI Data Parser (Haiku-Powered)

**Date**: 2026-01-23
**Status**: Concept / Proposal
**Priority**: High Value, Medium Priority
**Cost**: ~$0.0001 per parse (~$0.10 per 1000 parses)

### The Vision

Create a **reusable AI data parser component** that intelligently cleans, validates, and structures ANY user input before it hits the database. Instead of writing custom parsers for every field, we use Claude Haiku as a universal data cleaner.

### How It Works

```
User Input (messy, unstructured)
    ↓
Claude Haiku (smart parser)
    ↓
Clean Database Insert (100% accurate)
```

### Real-World Example

**Input**: "my love on yes Angelie City Pampanga District 3"

**Haiku Intelligence**:
- "Angelie" → Typo detection → "Angeles City" (city)
- "Pampanga" → Province extraction
- "District 3" → Region mapping → "Region 3 - Central Luzon"
- "my love on yes" → Ignore noise words

**Output**:
```json
{
  "location_city": "Angeles City",
  "location_province": "Pampanga",
  "location_region": "Region 3 - Central Luzon",
  "location_country": "Philippines"
}
```

---

## 🎯 Use Cases Across The Platform

### 1. **Location Parsing** (✅ Already Implemented)
- Input: "Angeles City Pampanga" / "Malabon Metro Manila" / "Cebu City"
- Parse: City, Province, Region, Barangay
- Add: Lat/Lng via Google Geocoding API

### 2. **Phone Numbers**
- Input: "+639123456789" / "0912 345 6789" / "912-345-6789"
- Parse: Country code, clean format
- Output: "+639123456789"

### 3. **Salary Expectations**
- Input: "25k-30k" / "₱25,000 to 30,000" / "25000-30000"
- Parse: Min/Max as integers
- Output: `{ min: 25000, max: 30000 }`

### 4. **Company Names** (Standardization)
- Input: "accenture" / "ACCENTURE" / "Accenture Inc."
- Parse: Official company name
- Output: "Accenture"

### 5. **Job Titles** (Normalization)
- Input: "csr" / "customer service rep" / "CS Representative"
- Parse: Full standardized title
- Output: "Customer Service Representative"

### 6. **Education**
- Input: "bs it" / "bachelor of science IT" / "BSIT"
- Parse: Full degree name
- Output: "Bachelor of Science in Information Technology"

### 7. **Skills** (Extraction & Standardization)
- Input: "react, next js, typescript, node"
- Parse: Clean array with proper casing
- Output: `["React", "Next.js", "TypeScript", "Node.js"]`

### 8. **Date Formats**
- Input: "Jan 15 1995" / "15/01/1995" / "1995-01-15"
- Parse: ISO format
- Output: "1995-01-15"

### 9. **Work Experience Duration**
- Input: "2 years 3 months" / "2.5 years" / "27 months"
- Parse: Months integer
- Output: `27`

### 10. **Resume Parsing** (Advanced)
- Input: Raw resume text or PDF
- Parse: Name, email, phone, skills, experience, education
- Output: Structured JSON matching candidate schema

---

## 🏗️ Implementation Approaches

### Option A: Universal Parser Utility
```typescript
// /lib/ai-data-parser.ts

interface ParseOptions {
  table: string         // Database table name
  field: string         // Field to parse
  value: any           // Raw user input
  schema?: any         // Optional: table schema for context
}

export async function parseDataForSchema(
  options: ParseOptions
): Promise<any> {
  // 1. Load schema from DATABASE_SCHEMA.md
  // 2. Build intelligent prompt for Haiku
  // 3. Parse response
  // 4. Return clean data
}

// Usage:
const clean = await parseDataForSchema({
  table: 'candidate_profiles',
  field: 'location',
  value: 'Angeles City Pampanga'
})
// Returns: { city: "Angeles City", province: "Pampanga", ... }
```

### Option B: API Middleware (Auto-Clean Everything)
```typescript
// middleware/ai-data-cleaner.ts

export async function aiDataMiddleware(req, res, next) {
  // Intercept POST/PUT requests
  // Auto-parse fields marked as "ai_parseable" in schema
  // Clean data before it hits database
  next()
}

// In Next.js API routes:
app.use(aiDataMiddleware)
```

### Option C: Smart Form Components
```typescript
// components/AIInput.tsx

<AIInput
  field="location"
  table="candidate_profiles"
  schema={candidateProfileSchema}
  onParsed={(cleanData) => setFormData(cleanData)}
/>

// Auto-parses on blur, shows loading state, displays confidence
```

### Option D: Database Trigger (Post-Insert Cleanup)
```sql
-- Trigger after INSERT
-- Sends raw data to AI parser API
-- Updates record with clean data
-- Logs original + cleaned versions for auditing
```

---

## 💰 Cost Analysis

### Haiku Pricing (as of 2026-01-23):
- **Input**: $0.80 per million tokens (~200 chars per token)
- **Output**: $4.00 per million tokens
- **Average parse**: ~500 input tokens + 200 output tokens
- **Cost per parse**: ~$0.0001 (one hundredth of a cent)

### ROI Calculation:
| Scenario | Parses/Month | Cost/Month | Benefit |
|----------|-------------|------------|---------|
| 1,000 users signup | 10,000 | $1.00 | 100% clean data |
| 10,000 users signup | 100,000 | $10.00 | No manual cleanup needed |
| 100,000 users signup | 1,000,000 | $100.00 | Perfect matching/search |

**Conclusion**: Absolutely worth it for data quality, user experience, and reduced manual work.

---

## 🎨 User Experience Benefits

### Before (Manual Entry):
1. User types messy data
2. Validation errors
3. User frustrated
4. Data inconsistent
5. Manual cleanup required

### After (AI-Powered):
1. User types naturally
2. AI auto-cleans on blur
3. Shows: "Detected: Angeles City, Pampanga ✓"
4. User happy (feels smart!)
5. Database perfect

---

## 🛠️ Technical Requirements

### Infrastructure:
- ✅ Anthropic API key (already have)
- ✅ Claude Haiku model access (already using)
- ✅ Next.js API routes (already built)
- ⚠️ Schema registry (need to build)
- ⚠️ Caching layer (optional, for repeated parses)

### Schema Registry:
```typescript
// /lib/schemas/registry.ts

export const PARSEABLE_FIELDS = {
  candidate_profiles: {
    location: {
      parser: 'location',
      outputs: ['location_city', 'location_province', 'location_region', 'location_barangay']
    },
    phone: {
      parser: 'phone',
      outputs: ['phone']
    },
    expected_salary: {
      parser: 'salary_range',
      outputs: ['expected_salary_min', 'expected_salary_max']
    }
  },
  jobs: {
    location: {
      parser: 'location',
      outputs: ['job_location_city', 'job_location_province']
    },
    salary_range: {
      parser: 'salary_range',
      outputs: ['salary_min', 'salary_max']
    }
  }
}
```

---

## 🚀 Implementation Phases

### Phase 1: Proof of Concept (✅ DONE)
- ✅ Single-field parser (location)
- ✅ API route `/api/parse-location`
- ✅ Form integration with loading states
- ✅ Cost validation

### Phase 2: Expand Coverage (Next)
- [ ] Add phone parser
- [ ] Add salary range parser
- [ ] Add job title normalizer
- [ ] Add company name standardizer

### Phase 3: Universal Parser (Future)
- [ ] Build schema-aware parser
- [ ] Auto-detect fields that need parsing
- [ ] Create reusable `<AIInput>` component
- [ ] Add confidence scores

### Phase 4: Advanced Features (Moonshot)
- [ ] Resume parsing (full document → structured data)
- [ ] Multi-language support (Tagalog, English, Taglish)
- [ ] Fuzzy matching for duplicates
- [ ] Auto-suggest corrections before save

---

## 🔬 Additional Enhancements

### 1. **Google Geocoding Integration**
- When location is parsed, also fetch lat/lng
- Cost: $5 per 1000 requests (Google Maps API)
- Benefit: Pin-drop accuracy for "Work from Office" jobs

### 2. **Caching Layer**
```typescript
// Cache common parses to reduce API calls
// "Angeles City Pampanga" → cached result
// 99% of users in same cities → huge savings
```

### 3. **Confidence Scoring**
```typescript
// Haiku returns confidence: 0.0 - 1.0
// If < 0.7, ask user to confirm
// "Did you mean: Angeles City, Pampanga?"
```

### 4. **Audit Trail**
```sql
CREATE TABLE ai_parse_log (
  id uuid PRIMARY KEY,
  table_name text,
  field_name text,
  raw_input text,
  parsed_output jsonb,
  confidence float,
  cost_usd decimal,
  created_at timestamp
);
```

---

## 📊 Success Metrics

### Data Quality:
- **Before**: 60% clean data (typos, inconsistencies)
- **After**: 98% clean data (AI-corrected)

### User Experience:
- **Before**: 3-5 validation errors per form
- **After**: 0-1 errors (most auto-fixed)

### Developer Time:
- **Before**: Hours writing field-specific validators
- **After**: Minutes configuring schema

### Support Tickets:
- **Before**: "My profile doesn't show up in search"
- **After**: Fewer issues (data is standardized)

---

## ⚠️ Risks & Mitigations

### Risk 1: API Costs Spiral
**Mitigation**:
- Cache common parses
- Rate limit per user (max 10 parses/minute)
- Set monthly budget alert ($50)

### Risk 2: Haiku Hallucinations
**Mitigation**:
- Always show user what was detected
- Allow manual override
- Log confidence scores

### Risk 3: Latency (Slow UX)
**Mitigation**:
- Parse on blur (not on every keystroke)
- Show loading spinner
- Timeout after 2 seconds (fall back to no parsing)

### Risk 4: Schema Changes Break Parser
**Mitigation**:
- Version schema definitions
- Test suite for parser
- Fallback to raw data if parse fails

---

## 🎯 Decision Points

### Should We Build This?
**Yes, if**:
- Data quality is causing search/matching issues
- Users complain about validation errors
- We have time for a 2-week sprint

**Not yet, if**:
- Still fixing core features
- Budget is tight
- User volume is low (<1000 users)

### Recommended Approach:
1. ✅ **Now**: Keep location parser (already works!)
2. ⏳ **Next sprint**: Add phone + salary parsers
3. 🔮 **Q2 2026**: Build universal system if validated

---

## 📝 Notes from Discussion (2026-01-23)

> "Is there not a way that when data is coming in and out of the system, that this thing knows what data goes where? When someone writes 'my love on yes Angelie City Pampanga District 3,' that it would split that and put it into the right columns."

**Answer**: YES! That's exactly what a universal AI data parser does. It's schema-aware and can handle ANY messy input.

> "I'm just thinking about all tables all the way across this little Haiku data analysis for the cost of things going in and out to make sure it's 100% accurate."

**Answer**: At $0.0001 per parse, even 1 million parses = $100. Totally worth it for data quality. This is the future of form inputs.

---

## 🔗 Related Ideas

### A. **AI Form Builder**
- Haiku generates forms from schema
- Auto-creates validation rules
- Generates placeholder text

### B. **Natural Language Queries**
- User: "Show me CSRs in Manila making 25k+"
- Haiku: Converts to SQL/API query

### C. **Smart Search**
- User searches: "call center jobs cebu"
- Haiku: Understands intent, fuzzy matches

### D. **Data Migration Helper**
- Old messy database → Haiku → New clean schema
- Bulk cleanup of existing records

---

## 🏁 Conclusion

**The Universal AI Data Parser is a game-changer** for data quality, user experience, and developer productivity. It's cheap, fast, and solves a real problem.

**Current Status**:
- ✅ Location parser is live and working
- ⏳ Waiting for validation before expanding

**Next Steps**:
1. Test location parser with real users
2. Measure success (data quality, UX, cost)
3. If successful, expand to other fields
4. Eventually build universal system

**ROI**: 🟢 Positive (low cost, high value)
**Complexity**: 🟡 Medium (need schema registry)
**User Impact**: 🟢 High (better UX, cleaner data)

---

*This document captures future ideas and should be reviewed quarterly.*
