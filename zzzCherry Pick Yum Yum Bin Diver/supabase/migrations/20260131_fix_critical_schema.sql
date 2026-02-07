-- =====================================================
-- CRITICAL SCHEMA FIXES - 2026-01-31
-- =====================================================
-- This migration addresses critical database schema issues:
-- 1. Creates onboarding_tasks table with proper RLS policies
-- 2. Adds missing agency compliance columns
-- 3. Creates interview scheduling tables
-- =====================================================

-- =====================================================
-- 1. CREATE ONBOARDING ENUMS
-- =====================================================

-- Create OnboardingStatus enum if not exists
DO $$ BEGIN
    CREATE TYPE public."OnboardingStatus" AS ENUM (
        'pending',
        'submitted',
        'approved',
        'rejected',
        'overdue'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create OnboardingTaskType enum if not exists
DO $$ BEGIN
    CREATE TYPE public."OnboardingTaskType" AS ENUM (
        'document_upload',
        'form_fill',
        'e_sign',
        'acknowledgment',
        'training',
        'information'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CREATE ONBOARDING_TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    application_id uuid NOT NULL,
    task_type public."OnboardingTaskType" NOT NULL,
    title text NOT NULL,
    description text,
    is_required boolean DEFAULT true NOT NULL,
    due_date date,
    status public."OnboardingStatus" DEFAULT 'pending'::public."OnboardingStatus" NOT NULL,
    submitted_at timestamp(6) with time zone,
    reviewed_at timestamp(6) with time zone,
    reviewer_notes text,
    attachments jsonb DEFAULT '[]'::jsonb,
    form_data jsonb DEFAULT '{}'::jsonb,
    signature_data jsonb,
    acknowledgment_complete boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL,

    -- Foreign key constraint
    CONSTRAINT onboarding_tasks_application_id_fkey
        FOREIGN KEY (application_id)
        REFERENCES public.job_applications(id)
        ON DELETE CASCADE
);

-- Create indexes for onboarding_tasks
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_application_id
    ON public.onboarding_tasks(application_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_status
    ON public.onboarding_tasks(status);

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_due_date
    ON public.onboarding_tasks(due_date);

-- Enable RLS
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE RLS POLICIES FOR ONBOARDING_TASKS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Candidates can view their onboarding tasks" ON public.onboarding_tasks;
DROP POLICY IF EXISTS "Candidates can update their onboarding tasks" ON public.onboarding_tasks;
DROP POLICY IF EXISTS "Recruiters can manage onboarding tasks" ON public.onboarding_tasks;
DROP POLICY IF EXISTS "Admins can manage all onboarding tasks" ON public.onboarding_tasks;

-- Policy: Candidates can view their own onboarding tasks
CREATE POLICY "Candidates can view their onboarding tasks"
ON public.onboarding_tasks
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.job_applications ja
        WHERE ja.id = onboarding_tasks.application_id
        AND ja.candidate_id = auth.uid()
    )
);

-- Policy: Candidates can update their own onboarding tasks
CREATE POLICY "Candidates can update their onboarding tasks"
ON public.onboarding_tasks
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.job_applications ja
        WHERE ja.id = onboarding_tasks.application_id
        AND ja.candidate_id = auth.uid()
    )
);

-- Policy: Recruiters can manage onboarding tasks for their agency
CREATE POLICY "Recruiters can manage onboarding tasks"
ON public.onboarding_tasks
USING (
    EXISTS (
        SELECT 1
        FROM public.job_applications ja
        JOIN public.jobs j ON ja.job_id = j.id
        JOIN public.agency_clients ac ON j.agency_client_id = ac.id
        JOIN public.agency_recruiters ar ON ac.agency_id = ar.agency_id
        WHERE ja.id = onboarding_tasks.application_id
        AND ar.user_id = auth.uid()
    )
);

-- Policy: Platform admins can manage all onboarding tasks
CREATE POLICY "Admins can manage all onboarding tasks"
ON public.onboarding_tasks
USING (
    EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);

-- =====================================================
-- 4. ADD MISSING AGENCY COLUMNS
-- =====================================================

-- Add NBI clearance URL column
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS nbi_clearance_url TEXT;

-- Add BIRN number column
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS birn_number VARCHAR(50);

-- Add payment method ID column (Stripe/PayMongo)
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS payment_method_id TEXT;

-- Add payment status column with enum constraint
DO $$ BEGIN
    ALTER TABLE public.agencies
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add check constraint for payment_status if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.agencies
    ADD CONSTRAINT agencies_payment_status_check
    CHECK (payment_status IN ('pending', 'verified', 'failed'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 5. CREATE INTERVIEW SCHEDULING TABLES
-- =====================================================

-- Create interview_time_proposals table
CREATE TABLE IF NOT EXISTS public.interview_time_proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    interview_id uuid NOT NULL,
    proposed_times jsonb NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    proposed_by uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL,

    -- Foreign key constraints
    CONSTRAINT interview_time_proposals_interview_id_fkey
        FOREIGN KEY (interview_id)
        REFERENCES public.interviews(id)
        ON DELETE CASCADE,

    CONSTRAINT interview_time_proposals_proposed_by_fkey
        FOREIGN KEY (proposed_by)
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    -- Check constraint for status
    CONSTRAINT interview_time_proposals_status_check
        CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'))
);

-- Create time_proposal_responses table
CREATE TABLE IF NOT EXISTS public.time_proposal_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    proposal_id uuid NOT NULL,
    responder_id uuid NOT NULL,
    accepted_time timestamp(6) with time zone,
    alternative_times jsonb DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    response_notes text,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL,

    -- Foreign key constraints
    CONSTRAINT time_proposal_responses_proposal_id_fkey
        FOREIGN KEY (proposal_id)
        REFERENCES public.interview_time_proposals(id)
        ON DELETE CASCADE,

    CONSTRAINT time_proposal_responses_responder_id_fkey
        FOREIGN KEY (responder_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    -- Check constraint for status
    CONSTRAINT time_proposal_responses_status_check
        CHECK (status IN ('pending', 'accepted', 'counter_proposed', 'rejected'))
);

-- Create indexes for interview scheduling tables
CREATE INDEX IF NOT EXISTS idx_interview_time_proposals_interview_id
    ON public.interview_time_proposals(interview_id);

CREATE INDEX IF NOT EXISTS idx_interview_time_proposals_proposed_by
    ON public.interview_time_proposals(proposed_by);

CREATE INDEX IF NOT EXISTS idx_interview_time_proposals_status
    ON public.interview_time_proposals(status);

CREATE INDEX IF NOT EXISTS idx_time_proposal_responses_proposal_id
    ON public.time_proposal_responses(proposal_id);

CREATE INDEX IF NOT EXISTS idx_time_proposal_responses_responder_id
    ON public.time_proposal_responses(responder_id);

CREATE INDEX IF NOT EXISTS idx_time_proposal_responses_status
    ON public.time_proposal_responses(status);

-- Enable RLS for interview scheduling tables
ALTER TABLE public.interview_time_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_proposal_responses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES FOR INTERVIEW SCHEDULING
-- =====================================================

-- Policies for interview_time_proposals
DROP POLICY IF EXISTS "Users can view proposals for their interviews" ON public.interview_time_proposals;
DROP POLICY IF EXISTS "Users can create proposals for their interviews" ON public.interview_time_proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON public.interview_time_proposals;

CREATE POLICY "Users can view proposals for their interviews"
ON public.interview_time_proposals
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.interviews i
        JOIN public.job_applications ja ON i.application_id = ja.id
        WHERE i.id = interview_time_proposals.interview_id
        AND (
            ja.candidate_id = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM public.jobs j
                JOIN public.agency_clients ac ON j.agency_client_id = ac.id
                JOIN public.agency_recruiters ar ON ac.agency_id = ar.agency_id
                WHERE j.id = ja.job_id
                AND ar.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can create proposals for their interviews"
ON public.interview_time_proposals
FOR INSERT
WITH CHECK (
    proposed_by = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.interviews i
        JOIN public.job_applications ja ON i.application_id = ja.id
        WHERE i.id = interview_time_proposals.interview_id
        AND (
            ja.candidate_id = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM public.jobs j
                JOIN public.agency_clients ac ON j.agency_client_id = ac.id
                JOIN public.agency_recruiters ar ON ac.agency_id = ar.agency_id
                WHERE j.id = ja.job_id
                AND ar.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can update their own proposals"
ON public.interview_time_proposals
FOR UPDATE
USING (proposed_by = auth.uid());

-- Policies for time_proposal_responses
DROP POLICY IF EXISTS "Users can view responses to proposals they can see" ON public.time_proposal_responses;
DROP POLICY IF EXISTS "Users can create responses to proposals" ON public.time_proposal_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON public.time_proposal_responses;

CREATE POLICY "Users can view responses to proposals they can see"
ON public.time_proposal_responses
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.interview_time_proposals itp
        JOIN public.interviews i ON itp.interview_id = i.id
        JOIN public.job_applications ja ON i.application_id = ja.id
        WHERE itp.id = time_proposal_responses.proposal_id
        AND (
            ja.candidate_id = auth.uid()
            OR itp.proposed_by = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM public.jobs j
                JOIN public.agency_clients ac ON j.agency_client_id = ac.id
                JOIN public.agency_recruiters ar ON ac.agency_id = ar.agency_id
                WHERE j.id = ja.job_id
                AND ar.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can create responses to proposals"
ON public.time_proposal_responses
FOR INSERT
WITH CHECK (
    responder_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.interview_time_proposals itp
        JOIN public.interviews i ON itp.interview_id = i.id
        JOIN public.job_applications ja ON i.application_id = ja.id
        WHERE itp.id = time_proposal_responses.proposal_id
        AND (
            ja.candidate_id = auth.uid()
            OR EXISTS (
                SELECT 1
                FROM public.jobs j
                JOIN public.agency_clients ac ON j.agency_client_id = ac.id
                JOIN public.agency_recruiters ar ON ac.agency_id = ar.agency_id
                WHERE j.id = ja.job_id
                AND ar.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can update their own responses"
ON public.time_proposal_responses
FOR UPDATE
USING (responder_id = auth.uid());

-- =====================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.onboarding_tasks IS 'Tasks assigned to candidates during the onboarding process';
COMMENT ON TABLE public.interview_time_proposals IS 'Time proposals for scheduling interviews';
COMMENT ON TABLE public.time_proposal_responses IS 'Responses to interview time proposals';

COMMENT ON COLUMN public.agencies.nbi_clearance_url IS 'URL to agency NBI clearance document';
COMMENT ON COLUMN public.agencies.birn_number IS 'Business Identification Registration Number';
COMMENT ON COLUMN public.agencies.payment_method_id IS 'Payment gateway method ID (Stripe/PayMongo)';
COMMENT ON COLUMN public.agencies.payment_status IS 'Payment verification status: pending, verified, or failed';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
