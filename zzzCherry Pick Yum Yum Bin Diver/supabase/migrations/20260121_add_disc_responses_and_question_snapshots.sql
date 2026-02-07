-- Add per-answer response logging for DISC game
create table if not exists public.candidate_disc_responses (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null,
  session_id text,
  question_id integer,
  question_index integer,
  question_type text,
  context text,
  title text,
  scenario text,
  options jsonb,
  selected_choice text,
  selected_option_text text,
  selected_option_reaction text,
  disc_type text,
  response_time_ms integer,
  answered_at timestamptz default now(),
  question_bank_version text,
  created_at timestamptz default now()
);

create index if not exists candidate_disc_responses_candidate_id_idx
  on public.candidate_disc_responses(candidate_id);

create index if not exists candidate_disc_responses_session_id_idx
  on public.candidate_disc_responses(session_id);

-- Add snapshot fields to assessment summary table
alter table public.candidate_disc_assessments
  add column if not exists personalized_questions jsonb,
  add column if not exists question_bank_version text,
  add column if not exists session_id text;
