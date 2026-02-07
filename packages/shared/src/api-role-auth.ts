/**
 * API Role Enforcement Utilities
 * 
 * Provides server-side role validation for API routes.
 * Fixes CRITICAL-02: Candidates calling recruiter APIs
 * Fixes CRITICAL-03: Cross-role access
 * 
 * USE THESE UTILITIES at the start of protected API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from './supabase/admin'
import { verifyAuthToken } from './supabase/auth'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'user' | 'recruiter' | 'admin'

export interface AuthenticatedUser {
    user: User
    role: UserRole
    userId: string
    email: string
    recruiterId?: string
    agencyId?: string
}

export interface RoleCheckResult {
    success: boolean
    user?: AuthenticatedUser
    error?: string
    status?: number
}

/**
 * Get user role from database
 */
async function getUserRole(userId: string): Promise<{ role: UserRole; recruiterId?: string; agencyId?: string }> {
    // Check if user is a recruiter
    const { data: recruiter } = await supabaseAdmin
        .from('agency_recruiters')
        .select('id, agency_id, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

    if (recruiter) {
        return { role: 'recruiter', recruiterId: recruiter.id, agencyId: recruiter.agency_id }
    }

    // Check if user is admin
    const { data: candidate } = await supabaseAdmin
        .from('candidates')
        .select('admin_level')
        .eq('id', userId)
        .single()

    if (candidate?.admin_level === 'admin') {
        return { role: 'admin' }
    }

    return { role: 'user' }
}

/**
 * Require authentication for an API route
 * Returns user info and role, or an error response
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAuth(request)
 *   if (!auth.success) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status })
 *   }
 *   
 *   const { user, role, userId } = auth.user!
 *   // ...
 * }
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<RoleCheckResult> {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
        return { success: false, error: 'Unauthorized - No auth header', status: 401 }
    }

    try {
        const user = await verifyAuthToken(authHeader)
        const roleInfo = await getUserRole(user.id)

        return {
            success: true,
            user: {
                user,
                role: roleInfo.role,
                userId: user.id,
                email: user.email || '',
                recruiterId: roleInfo.recruiterId,
                agencyId: roleInfo.agencyId,
            }
        }
    } catch (error) {
        return { success: false, error: 'Unauthorized - Invalid token', status: 401 }
    }
}

/**
 * Require user to be a recruiter
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await requireRecruiter(request)
 *   if (!auth.success) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status })
 *   }
 *   
 *   const { recruiterId, agencyId } = auth.user!
 *   // ...
 * }
 * ```
 */
export async function requireRecruiter(request: NextRequest): Promise<RoleCheckResult> {
    const auth = await requireAuth(request)
    if (!auth.success) return auth

    if (auth.user!.role !== 'recruiter') {
        console.warn(`🚫 Role violation: User ${auth.user!.userId} (${auth.user!.role}) tried to access recruiter API`)
        return {
            success: false,
            error: 'Forbidden - Recruiter access required',
            status: 403
        }
    }

    return auth
}

/**
 * Require user to be an admin
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAdmin(request)
 *   if (!auth.success) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status })
 *   }
 *   // Admin-only logic...
 * }
 * ```
 */
export async function requireAdmin(request: NextRequest): Promise<RoleCheckResult> {
    const auth = await requireAuth(request)
    if (!auth.success) return auth

    if (auth.user!.role !== 'admin') {
        console.warn(`🚫 Role violation: User ${auth.user!.userId} (${auth.user!.role}) tried to access admin API`)
        return {
            success: false,
            error: 'Forbidden - Admin access required',
            status: 403
        }
    }

    return auth
}

/**
 * Require user to be a candidate (regular user, not recruiter)
 */
export async function requireCandidate(request: NextRequest): Promise<RoleCheckResult> {
    const auth = await requireAuth(request)
    if (!auth.success) return auth

    // Candidates have role 'user' (not 'recruiter' or 'admin')
    if (auth.user!.role !== 'user') {
        console.warn(`🚫 Role violation: User ${auth.user!.userId} (${auth.user!.role}) tried to access candidate-only API`)
        return {
            success: false,
            error: 'Forbidden - Candidate access required',
            status: 403
        }
    }

    return auth
}

/**
 * Helper to quickly return error response from role check
 */
export function roleErrorResponse(result: RoleCheckResult): NextResponse {
    return NextResponse.json(
        { error: result.error, code: 'ROLE_FORBIDDEN' },
        { status: result.status || 403 }
    )
}
