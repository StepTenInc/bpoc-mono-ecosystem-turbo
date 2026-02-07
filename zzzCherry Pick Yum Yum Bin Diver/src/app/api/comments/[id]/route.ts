import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/comments/[id] - Get a single comment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: comment, error } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check agency access for recruiters
    if (userRole === 'recruiter' && comment.agency_id !== agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Comment GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/comments/[id] - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Fetch the comment to check ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('author_id, author_role')
      .eq('id', id)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Only the author or admin can edit
    if (existingComment.author_id !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Only the author can edit this comment' }, { status: 403 });
    }

    const body = await request.json();
    const { content, rating, commentType, isPrivate, metadata } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (content !== undefined) {
      if (content.trim().length === 0) {
        return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
      }
      updates.content = content.trim();
    }

    if (rating !== undefined) {
      if (rating !== null && (rating < 1 || rating > 5)) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
      }
      updates.rating = rating;
    }

    if (commentType !== undefined) {
      const validTypes = ['note', 'feedback', 'rating', 'concern', 'praise'];
      if (!validTypes.includes(commentType)) {
        return NextResponse.json(
          { error: `Comment type must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updates.comment_type = commentType;
    }

    if (isPrivate !== undefined) {
      updates.is_private = isPrivate;
    }

    if (metadata !== undefined) {
      updates.metadata = metadata;
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update comment:', error);
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Comment PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Fetch the comment to check ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Only the author or admin can delete
    if (existingComment.author_id !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Only the author can delete this comment' }, { status: 403 });
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete comment:', error);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Comment DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}








