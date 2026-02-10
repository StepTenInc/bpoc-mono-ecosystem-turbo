import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/candidates/ensure
 * Create a candidate record if it doesn't exist
 * Used when a new user signs up but doesn't have a candidate record yet
 */
export async function POST(request: NextRequest) {
  try {
    const { id, email, first_name, last_name } = await request.json()

    if (!id || !email) {
      return NextResponse.json(
        { error: 'id and email are required' },
        { status: 400 }
      )
    }

    // Check if candidate already exists
    const { data: existing } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single()

    if (existing) {
      console.log('✅ Candidate already exists:', id)
      return NextResponse.json({ candidate: existing })
    }

    // Create new candidate (full_name is auto-generated)
    const { data: newCandidate, error: createError } = await supabaseAdmin
      .from('candidates')
      .insert({
        id,
        email,
        first_name: first_name || 'New',
        last_name: last_name || 'Candidate',
        is_active: true,
        email_verified: false,
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create candidate:', createError)
      return NextResponse.json(
        { error: 'Failed to create candidate', details: createError.message },
        { status: 500 }
      )
    }

    // Also create empty profile
    const { error: profileError } = await supabaseAdmin
      .from('candidate_profiles')
      .insert({
        candidate_id: id,
        profile_completed: false,
      })

    if (profileError) {
      console.warn('⚠️ Failed to create profile:', profileError)
      // Don't fail - candidate was created
    }

    console.log('✅ Created new candidate:', id)
    return NextResponse.json({ candidate: newCandidate })

  } catch (error) {
    console.error('Error in ensure endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
