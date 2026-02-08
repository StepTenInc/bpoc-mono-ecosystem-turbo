import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/comments - Fetch comments for a specific target
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const agencyId = request.headers.get('x-agency-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Only admins and recruiters can view comments
    if (!['admin', 'recruiter'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const applicationId = searchParams.get('applicationId');
    const interviewId = searchParams.get('interviewId');
    const offerId = searchParams.get('offerId');
    const jobId = searchParams.get('jobId');

    // At least one target must be specified
    if (!candidateId && !applicationId && !interviewId && !offerId && !jobId) {
      return NextResponse.json(
        { error: 'At least one target (candidateId, applicationId, interviewId, offerId, jobId) is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by target
    if (candidateId) query = query.eq('candidate_id', candidateId);
    if (applicationId) query = query.eq('application_id', applicationId);
    if (interviewId) query = query.eq('interview_id', interviewId);
    if (offerId) query = query.eq('offer_id', offerId);
    if (jobId) query = query.eq('job_id', jobId);

    // Filter by agency for recruiters (can only see own agency's comments)
    if (userRole === 'recruiter' && agencyId) {
      query = query.eq('agency_id', agencyId);
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error('Failed to fetch comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error('Comments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const agencyId = request.headers.get('x-agency-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Only admins and recruiters can create comments
    if (!['admin', 'recruiter'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      candidateId,
      applicationId,
      interviewId,
      offerId,
      jobId,
      commentType = 'note',
      content,
      rating,
      isPrivate = true,
      metadata,
    } = body;

    // Content is required
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // At least one target must be specified
    if (!candidateId && !applicationId && !interviewId && !offerId && !jobId) {
      return NextResponse.json(
        { error: 'At least one target is required' },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Validate comment type
    const validTypes = ['note', 'feedback', 'rating', 'concern', 'praise'];
    if (!validTypes.includes(commentType)) {
      return NextResponse.json(
        { error: `Comment type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        author_id: userId,
        author_role: userRole,
        agency_id: agencyId || null,
        candidate_id: candidateId || null,
        application_id: applicationId || null,
        interview_id: interviewId || null,
        offer_id: offerId || null,
        job_id: jobId ? parseInt(jobId) : null,
        comment_type: commentType,
        content: content.trim(),
        rating: rating || null,
        is_private: isPrivate,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Comments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}








