/**
 * Updated User Sync Server Function
 * Uses new database abstraction layer with feature flags
 */
import { createCandidate, updateCandidate } from '@/lib/db/candidates'
import { createProfile, updateProfile } from '@/lib/db/profiles'
import { useSupabase } from '@/lib/config/features'

interface UserData {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  location?: string
  avatar_url?: string | null
  phone?: string | null
  bio?: string | null
  position?: string | null
  company?: string | null
  completed_data?: boolean | null
  birthday?: string | null
  gender?: string | null
  admin_level?: string
}

export async function syncUserToDatabaseServerV2(userData: UserData) {
  console.log('🔄 Starting server-side user sync (v2) for:', userData.email)
  console.log('🔍 Using database:', useSupabase('candidates') ? 'Supabase' : 'Railway')
  
  try {
    const { getCandidateById } = await import('@/lib/db/candidates')
    
    // Check if candidate exists
    const existingCandidate = await getCandidateById(userData.id)

    if (existingCandidate) {
      // User exists, update
      // Update candidate (phone moved to profile)
      const updated = await updateCandidate(userData.id, {
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar_url: userData.avatar_url || null,
      })

      // Update profile
      const { getProfileByCandidate } = await import('@/lib/db/profiles')
      const existingProfile = await getProfileByCandidate(userData.id)

      if (existingProfile) {
        await updateProfile(userData.id, {
          bio: userData.bio || null,
          position: userData.position || null,
          location: userData.location || null,
          phone: userData.phone || null,
          birthday: userData.birthday || null,
          gender: userData.gender as any || null,
          profile_completed: userData.completed_data || false,
        })
      } else {
        await createProfile(userData.id, {
          bio: userData.bio || null,
          position: userData.position || null,
          location: userData.location || null,
          phone: userData.phone || null,
          birthday: userData.birthday || null,
          gender: userData.gender as any || null,
          profile_completed: userData.completed_data || false,
        })
      }

      return {
        success: true,
        action: 'updated',
        user: updated,
      }
    } else {
      // User doesn't exist, create new candidate (phone moved to profile)
      const newCandidate = await createCandidate({
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar_url: userData.avatar_url || null,
      })

      // Create profile for new candidate (phone now in profile)
      await createProfile(userData.id, {
        bio: userData.bio || null,
        position: userData.position || null,
        location: userData.location || null,
        phone: userData.phone || null,
        birthday: userData.birthday || null,
        gender: userData.gender as any || null,
        profile_completed: userData.completed_data || false,
      })

      return {
        success: true,
        action: 'created',
        user: newCandidate,
      }
    }
  } catch (error) {
    console.error('❌ Error in server-side user sync (v2):', error)
    throw error
  }
}

