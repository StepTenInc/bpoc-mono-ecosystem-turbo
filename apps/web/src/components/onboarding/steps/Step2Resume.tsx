'use client';

import React, { useState } from 'react';
import { Label } from '@/components/shared/ui/label';
import { Button } from '@/components/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';
import FileUploadComponent from '../FileUploadComponent';

export default function Step2Resume({ onboarding, onComplete }: any) {
    const [loading, setLoading] = useState(false);
    const [resumeUrl, setResumeUrl] = useState(onboarding?.resume_url || '');

    const handleSubmit = async () => {
        if (!resumeUrl) {
            toast.error('Please upload your resume');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/onboarding/resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onboardingId: onboarding.id, resumeUrl })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Resume saved!');
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
                <Label className="text-lg mb-4 block">Upload Resume</Label>
                <p className="text-sm text-gray-400 mb-4">Upload your latest resume (PDF or DOCX, max 5MB)</p>
                <FileUploadComponent
                    candidateId={onboarding.candidate_id}
                    documentType="resume"
                    onFileUploaded={setResumeUrl}
                    accept=".pdf,.doc,.docx"
                />
            </div>

            <Button onClick={handleSubmit} disabled={loading || !resumeUrl} className="w-full bg-orange-600 hover:bg-orange-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save & Continue'}
            </Button>
        </div>
    );
}
