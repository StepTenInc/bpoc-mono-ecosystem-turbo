import { createClient } from '@/lib/supabase/server';

/**
 * Get the current admin user from session
 * Returns admin ID, name, and email for audit logging
 */
export async function getAdminFromSession() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        adminId: 'system',
        adminName: 'System Admin',
        adminEmail: null,
      };
    }

    // Check if user is actually an admin
    const { data: bpocUser } = await supabase
      .from('bpoc_users')
      .select('id, role, first_name, last_name, email')
      .eq('email', user.email)
      .single();

    if (!bpocUser || (bpocUser.role !== 'admin' && bpocUser.role !== 'super_admin')) {
      throw new Error('Unauthorized: User is not an admin');
    }

    return {
      adminId: bpocUser.id,
      adminName: `${bpocUser.first_name || ''} ${bpocUser.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Admin',
      adminEmail: bpocUser.email || user.email || null,
    };
  } catch (error) {
    console.error('Failed to get admin from session:', error);
    return {
      adminId: 'system',
      adminName: 'System Admin',
      adminEmail: null,
    };
  }
}

/**
 * Verify the request is from an authenticated admin
 * Throws error if not authorized
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: Not authenticated');
  }

  // Check if user is an admin
  const { data: bpocUser, error: bpocError } = await supabase
    .from('bpoc_users')
    .select('role')
    .eq('email', user.email)
    .single();

  if (bpocError || !bpocUser || (bpocUser.role !== 'admin' && bpocUser.role !== 'super_admin')) {
    throw new Error('Unauthorized: User is not an admin');
  }

  return user;
}
