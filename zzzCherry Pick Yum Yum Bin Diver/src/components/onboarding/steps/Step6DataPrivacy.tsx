'use client';

import React, { useState } from 'react';
import { Label } from '@/components/shared/ui/label';
import { Button } from '@/components/shared/ui/button';
import { Checkbox } from '@/components/shared/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';

interface Step6Props {
    onboarding: any;
    onComplete: () => void;
}

const DATA_PRIVACY_TEXT = `
DATA PRIVACY CONSENT

I hereby consent to the collection, use, processing, storage, and disclosure of my personal information by the Company
in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) for the following purposes:

1. Employment and HR management
2. Payroll and benefits administration
3. Compliance with legal and regulatory requirements
4. Communication regarding employment matters
5. Background verification and reference checks

I understand that:
- My data will be kept confidential and secure
- I have the right to access, correct, or delete my personal information
- I can withdraw consent at any time, subject to legal obligations
- My data may be shared with authorized third parties (government agencies, clients) as necessary

By checking the box below and signing, I acknowledge that I have read, understood, and agree to this Data Privacy Consent.
`;

export default function Step6DataPrivacy({ onboarding, onComplete }: Step6Props) {
    const [loading, setLoading] = useState(false);
    const [accepted, setAccepted] = useState(onboarding?.accepts_data_privacy || false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!accepted) {
            toast.error('You must accept the data privacy consent to proceed');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/onboarding/data-privacy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    onboardingId: onboarding.id,
                    acceptsDataPrivacy: true
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Data privacy consent submitted!');
            onComplete();

        } catch (error: any) {
            toast.error(error.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border border-white/20 rounded-lg p-6 bg-white/5 max-h-[400px] overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {DATA_PRIVACY_TEXT}
                </pre>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <Checkbox
                    id="accept"
                    checked={accepted}
                    onCheckedChange={(checked) => setAccepted(checked === true)}
                    className="mt-1"
                />
                <Label htmlFor="accept" className="text-sm cursor-pointer">
                    I have read and agree to the Data Privacy Consent above. I understand my rights and the purposes for which my data will be used.
                </Label>
            </div>

            <Button type="submit" disabled={loading || !accepted} className="w-full bg-orange-600 hover:bg-orange-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : 'Accept & Continue'}
            </Button>
        </form>
    );
}
