/**
 * Centralized Supabase Authentication Utilities
 * 
 * This module provides secure, performant authentication utilities
 * that use the centralized Supabase admin client.
 * 
 * DO NOT create inline Supabase clients in API routes.
 * USE these utilities instead.
 */

import { supabaseAdmin } from './admin'
import type { User } from '@supabase/supabase-js'

/**
 * Verify a JWT auth token and return the authenticated user
 * 
 * @param token - JWT token from Authorization header (with or without 'Bearer ' prefix)
 * @returns User object if valid
 * @throws Error if token is invalid or expired
 * 
 * @example
 * ```typescript
 * import { verifyAuthToken } from '@/lib/supabase/auth'
 * 
 * export async function GET(request: Request) {
 *   const token = request.headers.get('authorization')?.replace('Bearer ', '')
 *   if (!token) {
 *     return NextResponse.json({ error: 'No token provided' }, { status: 401 })
 *   }
 *   
 *   try {
 *     const user = await verifyAuthToken(token)
 *     // Use user.id, user.email, etc.
 *   } catch (error) {
 *     return NextResponse.json({ error: error.message }, { status: 401 })
 *   }
 * }
 * ```
 */
export async function verifyAuthToken(token: string): Promise<User> {
  // Remove 'Bearer ' prefix if present
  const cleanToken = token.replace(/^Bearer\s+/i, '')
  
  if (!cleanToken) {
    throw new Error('No authentication token provided')
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(cleanToken)
  
  if (error) {
    throw new Error(`Authentication failed: ${error.message}`)
  }
  
  if (!user) {
    throw new Error('Invalid or expired token')
  }
  
  return user
}

/**
 * Extract and verify auth token from request headers
 * 
 * @param request - Next.js Request object
 * @returns User object if valid
 * @throws Error if no token or token is invalid
 * 
 * @example
 * ```typescript
 * import { getUserFromRequest } from '@/lib/supabase/auth'
 * 
 * export async function GET(request: Request) {
 *   try {
 *     const user = await getUserFromRequest(request)
 *     return NextResponse.json({ userId: user.id })
 *   } catch (error) {
 *     return NextResponse.json({ error: error.message }, { status: 401 })
 *   }
 * }
 * ```
 */
export async function getUserFromRequest(request: Request): Promise<User> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    throw new Error('No authorization header provided')
  }
  
  return verifyAuthToken(authHeader)
}

/**
 * Verify auth token and return user, or null if invalid (non-throwing)
 * 
 * @param token - JWT token from Authorization header
 * @returns User object if valid, null if invalid
 * 
 * @example
 * ```typescript
 * import { verifyAuthTokenSafe } from '@/lib/supabase/auth'
 * 
 * export async function GET(request: Request) {
 *   const token = request.headers.get('authorization')
 *   const user = await verifyAuthTokenSafe(token || '')
 *   
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   
 *   return NextResponse.json({ userId: user.id })
 * }
 * ```
 */
export async function verifyAuthTokenSafe(token: string): Promise<User | null> {
  try {
    return await verifyAuthToken(token)
  } catch {
    return null
  }
}

/**
 * Check if a user is authenticated (boolean check)
 * 
 * @param token - JWT token from Authorization header
 * @returns true if user is authenticated, false otherwise
 * 
 * @example
 * ```typescript
 * import { isAuthenticated } from '@/lib/supabase/auth'
 * 
 * export async function GET(request: Request) {
 *   const token = request.headers.get('authorization')
 *   
 *   if (!await isAuthenticated(token || '')) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   
 *   // Proceed with authenticated request
 * }
 * ```
 */
export async function isAuthenticated(token: string): Promise<boolean> {
  const user = await verifyAuthTokenSafe(token)
  return user !== null
}
