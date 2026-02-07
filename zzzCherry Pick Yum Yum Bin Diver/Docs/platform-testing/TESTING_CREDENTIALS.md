# Platform Testing Credentials

⚠️ **TESTING ONLY - RESET AFTER TESTING**

---

## ShoreAgents Gravity (Supabase)

### Client Account
| Field | Value |
|-------|-------|
| Company | StepTen Inc |
| Company ID | `e444901c-7d1d-4065-af35-0085cd255a9c` |
| User ID | `386f6cc0-cbdf-4ba0-86a4-3afe6bbb4293` |
| Email | stephen@stepten.io |
| Password | qwerty12345 |
| Login | Header Nav (no login page) |

### Admin Account
| Field | Value |
|-------|-------|
| User ID | `d57a44c9-eaae-4da3-a994-4876a0d57686` |
| Email | stephena@shoreagents.com |
| Password | Step2025Ten$$ |
| Role | Super User |

---

## BPOC (Supabase)

### Candidate Account
| Field | Value |
|-------|-------|
| User ID | `092fd214-03c5-435d-9156-4a533d950cc3` |
| Email | marco.delgado.test@gmail.com |
| Password | Qwerty12345 |

### Recruiter Account
| Field | Value |
|-------|-------|
| User ID | `909890a6-bf4e-4589-b019-5897f799448e` |
| Email | stephen@recruiter.com |
| Password | qwerty12345 |

---

## Test Flow

1. **Admin** logs into ShoreAgents → Schedules interview for Marco
2. **BPOC Recruiter** verifies interview created with video room
3. **BPOC Candidate** (Marco) sees interview with participantJoinUrl
4. **Admin** sends offer → **Candidate** accepts

---

⚠️ **RESET ALL CREDENTIALS AFTER TESTING**
