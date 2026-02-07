# Rule: Keep Database Schema Documentation Updated

## Trigger
This rule applies WHENEVER you perform any of the following actions:
1.  **Create a new SQL migration file** (e.g., in `supabase/migrations/`).
2.  **Apply a migration** to the database using `mcp_supabase_apply_migration` or `run_command`.
3.  **Modify the database schema** in any way.

## Action Required
You **MUST** update the file `.agent/DATABASE_SCHEMA.md` to reflect the changes you have made.

1.  **Read** the current `.agent/DATABASE_SCHEMA.md`.
2.  **Add** new tables to the "Schema Overview" and "Detailed Schema Definitions" sections.
3.  **Update** existing tables if columns were added, modified, or deleted.
4.  **Verify** that your documentation matches the actual SQL you just executed.

## Do Not
- Do NOT include actual sensitive data (rows of user data) in this file. It is a strictly structural reference.
- Do NOT rely on `database.types.ts` as the source of truth; use your own SQL knowledge or `information_schema` queries if needed.
