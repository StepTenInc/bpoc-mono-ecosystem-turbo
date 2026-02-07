'use client';

import React, { useState } from 'react';
import { Label } from '@/components/shared/ui/label';
import { Button } from '@/components/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';
import SignaturePad from '../SignaturePad';

interface Step7Props {
    onboarding: any;
    onComplete: () => void;
}

export default function Step7Signature({ onboarding, onComplete }: Step7Props) {
    const [loading, setLoading] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState(onboarding?.signature_url || '');

    const handleSubmit = async () => {
        if (!signatureUrl) {
            toast.error('Please provide your signature');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/onboarding/signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    onboardingId: onboarding.id,
                    signatureUrl
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Signature saved!');
            onComplete();

        } catch (error: any) {
            toast.error(error.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <Label className="text-lg mb-4 block">Digital Signature</Label>
                <p className="text-sm text-gray-400 mb-4">
                    Your signature will be used on your employment contract and other official documents.
                </p>
                <SignaturePad onSignatureSaved={setSignatureUrl} />
            </div>

            {signatureUrl && (
                <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-4">
                    <p className="text-sm text-green-400 mb-2">✓ Signature saved</p>
                    <img src={signatureUrl} alt="Signature" className="h-20 border border-white/10 rounded bg-gray-900 p-2" />
                </div>
            )}

            <Button onClick={handleSubmit} disabled={loading || !signatureUrl} className="w-full bg-orange-600 hover:bg-orange-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save & Continue'}
            </Button>
        </div>
    );
}
