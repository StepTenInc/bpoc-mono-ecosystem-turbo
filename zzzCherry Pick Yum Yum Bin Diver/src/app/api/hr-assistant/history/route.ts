/**
 * HR Assistant API - Get Conversation History
 * 
 * GET /api/hr-assistant/history?role=candidate&sessionId=uuid
 * 
 * Returns conversation history for the current user
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { NextRequest, NextResponse } from 'next/server';

const supabase = supabaseAdmin;

/**
 * Get user ID from request
 */
async function getUserId(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request);
  return user.id;
}

/**
 * GET /api/hr-assistant/history
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const sessionId = searchParams.get('sessionId');

    if (!role || !['candidate', 'recruiter', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Fetch conversation history
    const { data, error } = await supabase.rpc('get_hr_conversation_history', {
      p_user_id: userId,
      p_role: role,
      p_session_id: sessionId || null,
      p_limit: 50
    });

    if (error) {
      console.error('Error fetching history:', error);
      throw error;
    }

    return NextResponse.json({
      messages: data || [],
      sessionId
    });

  } catch (error) {
    console.error('[HR Assistant History] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

