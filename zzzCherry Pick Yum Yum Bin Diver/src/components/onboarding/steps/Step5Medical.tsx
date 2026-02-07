'use client';

import React, { useState } from 'react';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Button } from '@/components/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';
import FileUploadComponent from '../FileUploadComponent';

export default function Step5Medical({ onboarding, onComplete }: any) {
    const [loading, setLoading] = useState(false);
    const [medicalCertUrl, setMedicalCertUrl] = useState(onboarding?.medical_cert_url || '');
    const [nbiClearanceUrl, setNbiClearanceUrl] = useState(onboarding?.nbi_clearance_url || '');
    const [medicalNotes, setMedicalNotes] = useState(onboarding?.medical_notes || '');

    const handleSubmit = async () => {
        if (!medicalCertUrl) {
            toast.error('Please upload your medical certificate');
            return;
        }

        if (!nbiClearanceUrl) {
            toast.error('Please upload your NBI clearance');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/onboarding/medical', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onboardingId: onboarding.id, medicalCertUrl, nbiClearanceUrl, medicalNotes })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Medical clearance saved!');
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
                <Label>Medical Certificate *</Label>
                <p className="text-sm text-gray-400 mb-2">Upload your medical clearance from a licensed physician</p>
                <FileUploadComponent
                    candidateId={onboarding.candidate_id}
                    documentType="medical_cert"
                    onFileUploaded={setMedicalCertUrl}
                />
            </div>

            <div>
                <Label>NBI Clearance *</Label>
                <p className="text-sm text-gray-400 mb-2">Upload your National Bureau of Investigation clearance certificate</p>
                <FileUploadComponent
                    candidateId={onboarding.candidate_id}
                    documentType="nbi_clearance"
                    onFileUploaded={setNbiClearanceUrl}
                />
            </div>

            <div>
                <Label>Medical Notes (Optional)</Label>
                <Textarea
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="Any medical conditions or notes to disclose..."
                    className="bg-white/5 border-white/10 min-h-[80px]"
                />
            </div>

            <Button onClick={handleSubmit} disabled={loading || !medicalCertUrl || !nbiClearanceUrl} className="w-full bg-orange-600 hover:bg-orange-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save & Continue'}
            </Button>
        </div>
    );
}
