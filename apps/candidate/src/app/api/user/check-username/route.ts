import { NextRequest, NextResponse } from 'next/server'
import { getCandidateByUsername } from '@/lib/db/candidates'

/**
 * POST /api/user/check-username
 * Check if username is available in Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const { username, userId } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Validate username format (alphanumeric, underscore, hyphen, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        error: 'Username must be 3-20 characters long and contain only letters, numbers, underscores, and hyphens' 
      }, { status: 400 })
    }

    // Check if username exists in Supabase (excluding current user if updating)
    const existing = await getCandidateByUsername(username.toLowerCase())

    const isAvailable = !existing || (userId && existing.id === userId)

    return NextResponse.json({ 
      available: isAvailable,
      username: username.toLowerCase()
    })

  } catch (error) {
    console.error('❌ Error checking username:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
}



















