/**
 * Supabase Queries for Jobs
 * Direct queries to Supabase jobs table
 */
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface Job {
  id: string
  agency_client_id: string
  posted_by: string | null
  title: string
  slug: string | null
  description: string
  requirements: any[]
  responsibilities: any[]
  benefits: any[]
  salary_min: number | null
  salary_max: number | null
  salary_type: string
  currency: string
  work_arrangement: string | null
  work_type: string
  shift: string
  experience_level: string | null
  industry: string | null
  department: string | null
  status: string
  priority: string
  application_deadline: string | null
  views: number
  applicants_count: number
  source: string
  external_id: string | null
  created_at: string
  updated_at: string
}

export async function getActiveJobs(): Promise<Job[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(job => ({
    id: job.id,
    agency_client_id: job.agency_client_id,
    posted_by: job.posted_by,
    title: job.title,
    slug: job.slug,
    description: job.description,
    requirements: job.requirements || [],
    responsibilities: job.responsibilities || [],
    benefits: job.benefits || [],
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_type: job.salary_type,
    currency: job.currency,
    work_arrangement: job.work_arrangement,
    work_type: job.work_type,
    shift: job.shift,
    experience_level: job.experience_level,
    industry: job.industry,
    department: job.department,
    status: job.status,
    priority: job.priority,
    application_deadline: job.application_deadline,
    views: job.views,
    applicants_count: job.applicants_count,
    source: job.source,
    external_id: job.external_id,
    created_at: job.created_at,
    updated_at: job.updated_at,
  }))
}

export async function getJobById(id: string): Promise<Job | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    agency_client_id: data.agency_client_id,
    posted_by: data.posted_by,
    title: data.title,
    slug: data.slug,
    description: data.description,
    requirements: data.requirements || [],
    responsibilities: data.responsibilities || [],
    benefits: data.benefits || [],
    salary_min: data.salary_min,
    salary_max: data.salary_max,
    salary_type: data.salary_type,
    currency: data.currency,
    work_arrangement: data.work_arrangement,
    work_type: data.work_type,
    shift: data.shift,
    experience_level: data.experience_level,
    industry: data.industry,
    department: data.department,
    status: data.status,
    priority: data.priority,
    application_deadline: data.application_deadline,
    views: data.views,
    applicants_count: data.applicants_count,
    source: data.source,
    external_id: data.external_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    agency_client_id: data.agency_client_id,
    posted_by: data.posted_by,
    title: data.title,
    slug: data.slug,
    description: data.description,
    requirements: data.requirements || [],
    responsibilities: data.responsibilities || [],
    benefits: data.benefits || [],
    salary_min: data.salary_min,
    salary_max: data.salary_max,
    salary_type: data.salary_type,
    currency: data.currency,
    work_arrangement: data.work_arrangement,
    work_type: data.work_type,
    shift: data.shift,
    experience_level: data.experience_level,
    industry: data.industry,
    department: data.department,
    status: data.status,
    priority: data.priority,
    application_deadline: data.application_deadline,
    views: data.views,
    applicants_count: data.applicants_count,
    source: data.source,
    external_id: data.external_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function getJobsByAgencyClient(agencyClientId: string): Promise<Job[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('agency_client_id', agencyClientId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(job => ({
    id: job.id,
    agency_client_id: job.agency_client_id,
    posted_by: job.posted_by,
    title: job.title,
    slug: job.slug,
    description: job.description,
    requirements: job.requirements || [],
    responsibilities: job.responsibilities || [],
    benefits: job.benefits || [],
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_type: job.salary_type,
    currency: job.currency,
    work_arrangement: job.work_arrangement,
    work_type: job.work_type,
    shift: job.shift,
    experience_level: job.experience_level,
    industry: job.industry,
    department: job.department,
    status: job.status,
    priority: job.priority,
    application_deadline: job.application_deadline,
    views: job.views,
    applicants_count: job.applicants_count,
    source: job.source,
    external_id: job.external_id,
    created_at: job.created_at,
    updated_at: job.updated_at,
  }))
}

export async function getJobsByRecruiter(recruiterId: string): Promise<Job[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      agency_client:agency_clients!inner(
        company:companies!inner(
          name
        )
      )
    `)
    .eq('posted_by', recruiterId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(job => ({
    id: job.id,
    agency_client_id: job.agency_client_id,
    posted_by: job.posted_by,
    title: job.title,
    slug: job.slug,
    description: job.description,
    requirements: job.requirements || [],
    responsibilities: job.responsibilities || [],
    benefits: job.benefits || [],
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_type: job.salary_type,
    currency: job.currency,
    work_arrangement: job.work_arrangement,
    work_type: job.work_type,
    shift: job.shift,
    experience_level: job.experience_level,
    industry: job.industry,
    department: job.department,
    status: job.status,
    priority: job.priority,
    application_deadline: job.application_deadline,
    views: job.views,
    applicants_count: job.applicants_count,
    source: job.source,
    external_id: job.external_id,
    created_at: job.created_at,
    updated_at: job.updated_at,
  }))
}

export async function incrementJobViews(jobId: string): Promise<void> {
  const supabase = await createClient()

  await supabase.rpc('increment_job_views', { job_id: jobId }).catch(() => {
    // Fallback if RPC doesn't exist
    supabaseAdmin
      .from('jobs')
      .update({ views: supabaseAdmin.raw('views + 1') })
      .eq('id', jobId)
  })
}

