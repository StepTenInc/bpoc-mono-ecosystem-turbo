/**
 * Supabase Queries for Candidates
 * Direct queries to new Supabase schema
 */
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Candidate } from './types'

export async function getCandidateById(id: string, useAdmin: boolean = false): Promise<Candidate | null> {
  // Use admin client if requested (for server-side operations that need to bypass RLS)
  const supabase = useAdmin ? supabaseAdmin : await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (expected)
      console.error('❌ [getCandidateById] Query error:', {
        code: error.code,
        message: error.message,
        candidate_id: id,
        useAdmin,
      })
    }
    return null
  }

  return {
    id: data.id,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    full_name: data.full_name,
        avatar_url: data.avatar_url,
    username: data.username,
    slug: data.slug,
    is_active: data.is_active,
    email_verified: data.email_verified,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function getCandidateByEmail(email: string): Promise<Candidate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    full_name: data.full_name,
        avatar_url: data.avatar_url,
    username: data.username,
    slug: data.slug,
    is_active: data.is_active,
    email_verified: data.email_verified,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function createCandidate(data: {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string | null
  avatar_url?: string | null
  username?: string | null
  slug?: string | null
}): Promise<Candidate> {
  console.log('📝 [createCandidate] Starting candidate creation:', {
    id: data.id,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    has_phone: !!data.phone,
    has_avatar: !!data.avatar_url,
    has_username: !!data.username,
  })

  try {
    // Use admin client to bypass RLS for creation
    const insertData: any = {
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      // full_name is generated automatically
      avatar_url: data.avatar_url || null,
      username: data.username || null,
      slug: data.slug || null,
      is_active: true,
      email_verified: false,
    }

    console.log('📤 [createCandidate] Inserting into Supabase candidates table:', {
      table: 'candidates',
      data_keys: Object.keys(insertData),
      email: insertData.email,
    })

    const { data: candidate, error } = await supabaseAdmin
      .from('candidates')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ [createCandidate] Supabase insert error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        table: 'candidates',
        candidate_id: data.id,
        email: data.email,
      })
      throw new Error(`Failed to create candidate: ${error.message} (Code: ${error.code})`)
    }

    if (!candidate) {
      console.error('❌ [createCandidate] No candidate returned from insert')
      throw new Error('Candidate creation returned no data')
    }

    console.log('✅ [createCandidate] Candidate created successfully:', {
      id: candidate.id,
      email: candidate.email,
      full_name: candidate.full_name,
      created_at: candidate.created_at,
    })

    return {
      id: candidate.id,
      email: candidate.email,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      full_name: candidate.full_name,
      phone: candidate.phone,
      avatar_url: candidate.avatar_url,
      username: candidate.username,
      slug: candidate.slug,
      is_active: candidate.is_active,
      email_verified: candidate.email_verified,
      created_at: candidate.created_at,
      updated_at: candidate.updated_at,
    }
  } catch (error) {
    console.error('❌ [createCandidate] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      candidate_id: data.id,
      email: data.email,
    })
    throw error
  }
}

export async function updateCandidate(
  id: string,
  data: {
    first_name?: string
    last_name?: string
    avatar_url?: string | null
    username?: string | null
    slug?: string | null
  },
  useAdmin: boolean = false
): Promise<Candidate | null> {
  // Use admin client if requested (for server-side operations that need to bypass RLS)
  const supabase = useAdmin ? supabaseAdmin : await createClient()

  // First check if candidate exists
  const existing = await getCandidateById(id, useAdmin)
  if (!existing) {
    console.error('❌ [updateCandidate] Candidate not found:', id)
    return null
  }

  console.log('📝 [updateCandidate] Updating candidate:', { id, updateData: data })

  const { data: candidate, error } = await supabase
    .from('candidates')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ [updateCandidate] Update error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      candidate_id: id,
    })
    return null
  }

  if (!candidate) {
    console.error('❌ [updateCandidate] No candidate returned from update')
    return null
  }

  console.log('✅ [updateCandidate] Candidate updated successfully:', candidate.id)

  return {
    id: candidate.id,
    email: candidate.email,
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    full_name: candidate.full_name,
    phone: candidate.phone,
    avatar_url: candidate.avatar_url,
    username: candidate.username,
    slug: candidate.slug,
    is_active: candidate.is_active,
    email_verified: candidate.email_verified,
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
  }
}

export async function getCandidateByUsername(username: string): Promise<Candidate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('username', username.toLowerCase())
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    full_name: data.full_name,
        avatar_url: data.avatar_url,
    username: data.username,
    slug: data.slug,
    is_active: data.is_active,
    email_verified: data.email_verified,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function getCandidateBySlug(slug: string): Promise<Candidate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    full_name: data.full_name,
        avatar_url: data.avatar_url,
    username: data.username,
    slug: data.slug,
    is_active: data.is_active,
    email_verified: data.email_verified,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function deleteCandidate(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from('candidates').delete().eq('id', id)
  return !error
}

