import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameter
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ is_admin: false })
    }

    // Check if user is a BPOC admin in the bpoc_users table
    const { data: bpocUser, error: bpocError } = await supabase
      .from('bpoc_users')
      .select('id, email, first_name, last_name, role, is_active')
      .eq('id', userId)
      .single()

    if (bpocError || !bpocUser) {
      console.log('User not found in bpoc_users:', userId)
      return NextResponse.json({ is_admin: false })
    }

    if (!bpocUser.is_active) {
      console.log('User account is inactive:', userId)
      return NextResponse.json({ is_admin: false })
    }

    // User is a valid BPOC admin
    return NextResponse.json({ 
      is_admin: true,
      admin_user: {
        id: bpocUser.id,
        email: bpocUser.email,
        first_name: bpocUser.first_name,
        last_name: bpocUser.last_name,
        role: bpocUser.role
      }
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ is_admin: false })
  }
}
