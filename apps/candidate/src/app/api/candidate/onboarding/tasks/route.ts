import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

// Wizard section definitions - the 8 steps
const WIZARD_SECTIONS = [
  { key: 'personal_info', title: 'Personal Information', description: 'Verify your personal details', taskType: 'form', icon: 'user' },
  { key: 'gov_id', title: 'Government IDs', description: 'Upload SSS, TIN, PhilHealth, and Pag-IBIG documents', taskType: 'upload', icon: 'id-card' },
  { key: 'education', title: 'Educational Background', description: 'Upload highest educational attainment documents', taskType: 'upload', icon: 'graduation-cap' },
  { key: 'medical', title: 'Medical Certificate', description: 'Upload your medical certificate', taskType: 'upload', icon: 'file-medical' },
  { key: 'data_privacy', title: 'Data Privacy Consent', description: 'Read and acknowledge the data privacy agreement', taskType: 'acknowledge', icon: 'shield' },
  { key: 'resume', title: 'Updated Resume', description: 'Upload your most recent resume', taskType: 'upload', icon: 'file-text' },
  { key: 'signature', title: 'Digital Signature', description: 'Provide your digital signature for documents', taskType: 'sign', icon: 'pen-tool' },
  { key: 'emergency_contact', title: 'Emergency Contact', description: 'Provide emergency contact information', taskType: 'form', icon: 'phone' },
];

// Helper function to auto-create onboarding record for hired candidate
async function createOnboardingForHiredCandidate(userId: string, application: any) {
  // Fetch candidate details
  const { data: candidate } = await supabaseAdmin
    .from('candidates')
    .select('first_name, last_name, email, birthday, gender')
    .eq('id', userId)
    .single();

  const { data: profile } = await supabaseAdmin
    .from('candidate_profiles')
    .select('phone')
    .eq('candidate_id', userId)
    .single();

  const { data: resume } = await supabaseAdmin
    .from('candidate_resumes')
    .select('resume_url')
    .eq('candidate_id', userId)
    .eq('is_primary', true)
    .single();

  // Get job details
  const { data: jobApp } = await supabaseAdmin
    .from('job_applications')
    .select(`
      id,
      job:jobs (
        title,
        agency_client:agency_clients (
          company:companies (
            name
          )
        )
      )
    `)
    .eq('id', application.id)
    .single();

  const job = jobApp?.job as any;
  const position = job?.title || 'New Position';
  const company = job?.agency_client?.company?.name || 'Company';

  // Get offer details
  const { data: offer } = await supabaseAdmin
    .from('job_offers')
    .select('salary_offered, start_date')
    .eq('application_id', application.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Create candidate_onboarding record
  const { data: onboarding, error } = await supabaseAdmin
    .from('candidate_onboarding')
    .insert({
      candidate_id: userId,
      job_application_id: application.id,
      
      // Pre-fill from candidate data
      first_name: candidate?.first_name || '',
      last_name: candidate?.last_name || '',
      email: candidate?.email || '',
      date_of_birth: candidate?.birthday || null,
      gender: candidate?.gender || null,
      contact_no: profile?.phone || '',
      resume_url: resume?.resume_url || null,
      
      // Job details
      position,
      assigned_client: company,
      start_date: offer?.start_date,
      basic_salary: offer?.salary_offered,
      
      // Set initial statuses
      resume_status: resume?.resume_url ? 'approved' : 'pending',
      personal_info_status: (candidate?.first_name && candidate?.last_name && candidate?.email) ? 'approved' : 'pending',
      gov_id_status: 'pending',
      education_status: 'pending',
      medical_status: 'pending',
      data_privacy_status: 'pending',
      signature_status: 'pending',
      emergency_contact_status: 'pending',
      completion_percent: 0,
      contract_signed: application.status === 'hired',
    })
    .select()
    .single();

  if (error) {
    console.error('[tasks API] Error auto-creating onboarding:', error);
    return null;
  }

  console.log('[tasks API] Auto-created onboarding record:', onboarding.id);
  return onboarding;
}

// GET - Fetch onboarding tasks for candidate
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    // Get candidate's onboarding record from the wizard table
    let { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('*')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (onboardingError && onboardingError.code !== 'PGRST116') {
      console.error('Error fetching onboarding:', onboardingError);
    }

    // If no onboarding record, check if they have an accepted offer or are hired
    if (!onboarding) {
      // Check for hired or offer_accepted application
      const { data: applications } = await supabaseAdmin
        .from('job_applications')
        .select('id, status')
        .eq('candidate_id', user.id)
        .in('status', ['offer_accepted', 'hired'])
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!applications || applications.length === 0) {
        return NextResponse.json({ 
          tasks: [], 
          progress: { total: 0, completed: 0, pending: 0, overdue: 0, percentage: 0 },
          onboardingStatus: null,
          message: 'No onboarding tasks available yet. Accept a job offer to begin onboarding.'
        });
      }

      const application = applications[0];

      // Auto-create onboarding record for hired/offer_accepted candidates
      if (application.status === 'hired' || application.status === 'offer_accepted') {
        onboarding = await createOnboardingForHiredCandidate(user.id, application);
        
        if (!onboarding) {
          return NextResponse.json({ 
            tasks: [], 
            progress: { total: 0, completed: 0, pending: 0, overdue: 0, percentage: 0 },
            onboardingStatus: null,
            message: 'Onboarding is being prepared. Please check back soon.'
          });
        }
      } else {
        return NextResponse.json({ 
          tasks: [], 
          progress: { total: 0, completed: 0, pending: 0, overdue: 0, percentage: 0 },
          onboardingStatus: null,
          message: 'Onboarding is being prepared. Please check back soon.'
        });
      }
    }

    // Convert wizard sections to task format
    const tasks = WIZARD_SECTIONS.map((section, index) => {
      const statusKey = `${section.key}_status` as keyof typeof onboarding;
      // Normalize status to lowercase (some records have 'PENDING' uppercase)
      const rawStatus = onboarding[statusKey] as string || 'pending';
      const status = rawStatus.toLowerCase();
      
      return {
        id: `${onboarding.id}-${section.key}`,
        applicationId: onboarding.job_application_id,
        jobTitle: onboarding.position || 'New Position',
        company: onboarding.assigned_client || 'Company',
        taskType: section.taskType,
        title: section.title,
        description: section.description,
        isRequired: true,
        dueDate: onboarding.start_date,
        status: status,
        submittedAt: status === 'approved' ? onboarding.updated_at : null,
        reviewedAt: status === 'approved' ? onboarding.updated_at : null,
        reviewerNotes: (onboarding as any)[`${section.key}_feedback`] || null,
        createdAt: onboarding.created_at,
        order: index + 1,
        icon: section.icon,
      };
    });

    // Calculate progress (statuses are already normalized to lowercase)
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'approved').length;
    const submittedTasks = tasks.filter(t => t.status === 'submitted').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'rejected').length;
    const overdueTasks = 0; // Could calculate based on start_date

    return NextResponse.json({
      tasks,
      progress: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks + submittedTasks, // Pending includes both pending and submitted (awaiting review)
        overdue: overdueTasks,
        percentage: onboarding.completion_percent || Math.round((completedTasks / totalTasks) * 100),
      },
      onboardingStatus: {
        employmentStarted: onboarding.employment_started || false,
        employmentStartDate: onboarding.employment_start_date,
        startDate: onboarding.start_date,
        contractSigned: onboarding.contract_signed || false,
        isComplete: onboarding.is_complete || false,
      },
      onboardingId: onboarding.id,
      salary: onboarding.basic_salary,
      position: onboarding.position,
      company: onboarding.assigned_client,
    });

  } catch (error) {
    console.error('[Onboarding Tasks API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding tasks' }, { status: 500 });
  }
}
