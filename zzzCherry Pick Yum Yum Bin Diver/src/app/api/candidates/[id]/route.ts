import { NextRequest, NextResponse } from 'next/server'
import { getCandidateById, updateCandidate } from '@/lib/db/candidates'
import { getProfileByCandidate } from '@/lib/db/profiles'

/**
 * GET /api/candidates/[id]
 * Get candidate by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Use admin client to bypass RLS and ensure we can find the candidate
    const candidate = await getCandidateById(id, true)

    if (!candidate) {
      console.error('❌ [GET /api/candidates/[id]] Candidate not found:', id)
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    const profile = await getProfileByCandidate(id, true)

    return NextResponse.json({
      candidate,
      profile,
    })
  } catch (error) {
    console.error('Error fetching candidate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/candidates/[id]
 * Update candidate
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // Only include defined fields for partial update
    const updateData: any = {}
    if (data.first_name !== undefined) updateData.first_name = data.first_name
    if (data.last_name !== undefined) updateData.last_name = data.last_name
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url
    if (data.username !== undefined) updateData.username = data.username
    if (data.slug !== undefined) updateData.slug = data.slug

    console.log('📝 Updating candidate in Supabase:', { id, updateData })

    // Use admin client to bypass RLS for updates (candidate exists, just needs update)
    const updated = await updateCandidate(id, updateData, true)

    if (!updated) {
      console.error('❌ Failed to update candidate - candidate may not exist or RLS blocked update')
      return NextResponse.json(
        { error: 'Candidate not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({ candidate: updated })
  } catch (error) {
    console.error('Error updating candidate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

