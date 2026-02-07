import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

function capitalize(s: string): string { 
  return !s ? s : s.charAt(0).toUpperCase() + s.slice(1) 
}

function formatSalary(currency: string, min: number | null, max: number | null, type: string): string {
  const symbol = String(currency || 'PHP').toUpperCase() === 'PHP' ? '₱' : String(currency || 'PHP').toUpperCase() + ' '
  const fmt = (n: number) => n.toLocaleString('en-PH')
  if (min != null && max != null) return `${symbol}${fmt(min)} - ${symbol}${fmt(max)} / ${type}`
  if (min != null) return `${symbol}${fmt(min)} / ${type}`
  if (max != null) return `${symbol}${fmt(max)} / ${type}`
  return ''
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // Fetch job from Supabase
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        agency_client:agency_clients!inner(
          company:companies!inner(
            name
          )
        )
      `)
      .eq('id', jobId)
      .single()

    if (error || !job) {
      console.error('Error fetching job:', error)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Get applicant count from Supabase
    const { count } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', job.id)

    const realApplicants = count || job.applicants_count || 0
    const employmentType: string[] = []
    if (job.work_type) employmentType.push(capitalize(String(job.work_type)))
    if (job.experience_level) employmentType.push(capitalize(String(job.experience_level)))
    const salary = formatSalary(String(job.currency || 'PHP'), job.salary_min != null ? Number(job.salary_min) : null, job.salary_max != null ? Number(job.salary_max) : null, String(job.salary_type || 'monthly'))
    const createdAt = job.created_at ? new Date(job.created_at) : new Date()
    const ms = Date.now() - createdAt.getTime()
    const minutes = Math.floor(ms / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    let postedDays: number | string
    if (days > 0) {
      postedDays = days
    } else if (hours > 0) {
      postedDays = hours === 1 ? '1 hour ago' : `${hours} hours ago`
    } else if (minutes > 0) {
      postedDays = minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
    } else {
      postedDays = 'Just now'
    }
    const locationType = String(job.work_arrangement || 'onsite')
    const priorityFromDb = String(job.priority ?? '').toLowerCase()
    const priority: 'low' | 'medium' | 'high' | 'urgent' =
      ['low', 'medium', 'high', 'urgent'].includes(priorityFromDb)
        ? (priorityFromDb as any)
        : ((): 'low' | 'medium' | 'high' => {
            if (realApplicants >= 50) return 'high'
            if (realApplicants >= 10) return 'medium'
            return 'low'
          })()

    const requirements = Array.isArray(job.requirements) ? job.requirements : []
    const responsibilities = Array.isArray(job.responsibilities) ? job.responsibilities : []
    const benefits = Array.isArray(job.benefits) ? job.benefits : []

    const formattedJob = {
      id: job.id,
      originalId: job.id,
      source: job.source || 'manual',
      company: job.agency_client?.company?.name || 'Unknown Company',
      companyLogo: '🏢',
      title: job.title,
      location: '',
      locationType: locationType === 'onsite' ? 'on-site' : locationType,
      salary,
      employmentType,
      postedDays,
      applicants: realApplicants,
      status: job.status === 'closed' ? 'closed' : (job.status === 'active' ? 'hiring' : 'inactive'),
      priority,
      application_deadline: job.application_deadline,
      experience_level: job.experience_level,
      work_arrangement: job.work_arrangement,
      shift: job.shift,
      industry: job.industry,
      department: job.department,
      work_type: job.work_type,
      currency: job.currency,
      salary_type: job.salary_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      created_at: job.created_at,
      updated_at: job.updated_at,
      description: job.description || '',
      job_description: job.description || '',
      requirements,
      responsibilities,
      benefits,
      skills: []
    }

    return NextResponse.json({ job: formattedJob })
  } catch (e) {
    console.error('Error fetching job:', e)
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}

