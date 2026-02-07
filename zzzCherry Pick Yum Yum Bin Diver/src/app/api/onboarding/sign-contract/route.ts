import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/sign-contract
 * Digitally sign employment contract
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { onboardingId, contractId, acceptsTerms } = await request.json();

        if (!acceptsTerms) {
            return NextResponse.json({ error: 'Must accept contract terms' }, { status: 400 });
        }

        // Update contract as signed by candidate
        const { error: contractError } = await supabase
            .from('employment_contracts')
            .update({
                signed_by_candidate: true,
                signed_at: new Date().toISOString()
            })
            .eq('id', contractId);

        if (contractError) {
            return NextResponse.json({ error: contractError.message }, { status: 500 });
        }

        // Update onboarding record
        const { error: onboardingError } = await supabase
            .from('candidate_onboarding')
            .update({
                contract_signed: true,
                contract_signed_at: new Date().toISOString()
            })
            .eq('id', onboardingId);

        if (onboardingError) {
            return NextResponse.json({ error: onboardingError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Contract signed successfully'
        });

    } catch (error: any) {
        console.error('Sign contract error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
