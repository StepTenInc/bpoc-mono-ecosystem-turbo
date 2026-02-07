# Constraints

> **Primary Keys, Unique Constraints, Check Constraints**  
> **Generated**: 2026-01-27 09:22 SGT

---

## Primary Keys (67)

All tables use `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`

**Exception**: `candidates.id` uses Supabase Auth UID

---

## Unique Constraints (20)

| Table | Columns | Purpose |
|-------|---------|---------|
| `candidates` | email | Unique email |
| `candidates` | username | Unique username |
| `carpet_bomb_leads` | email | Unique lead email |
| `outbound_contacts` | email | Unique contact email |
| `insights_posts` | slug | Unique URL slug |
| `video_call_rooms` | daily_room_name | Unique Daily.co room |
| `team_invitations` | invite_token | Unique invite token |
| `personality_profiles` | name | Unique personality name |
| (+12 more...) | | |

---

## Check Constraints (500+)

### Status Validations
- `webhook_deliveries.status` IN ('pending', 'sent', 'failed', 'retrying')
- `webhooks.url` ~ '^https?://'
- `webhooks.events` array_length > 0

### Field Validations
- Various NOT NULL constraints (auto-generated)
- ENUM type constraints

---

**For complete constraint definitions**, query via MCP.
