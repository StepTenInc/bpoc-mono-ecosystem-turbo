import { NextRequest, NextResponse } from 'next/server';

/**
 * ADMIN SIGNUP API - DISABLED
 * 
 * Admin accounts can ONLY be created through internal invitation system.
 * Self-registration is not allowed for security reasons.
 * 
 * Admins must be invited by existing administrators with appropriate permissions.
 */
export async function POST(request: NextRequest) {
  console.log('⛔ Blocked admin self-signup attempt:', {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  return NextResponse.json(
    {
      error: 'Admin registration is disabled',
      message: 'Admin accounts can only be created through invitation by existing administrators. Please contact your system administrator for access.',
      code: 'ADMIN_SIGNUP_DISABLED'
    },
    { status: 403 }
  );
}

// Also block GET requests
export async function GET() {
  return NextResponse.json(
    {
      error: 'Admin registration is disabled',
      message: 'Admin accounts can only be created through invitation.',
      code: 'ADMIN_SIGNUP_DISABLED'
    },
    { status: 403 }
  );
}
