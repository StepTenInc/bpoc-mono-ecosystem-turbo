'use client';

import React, { useState } from 'react';
import { Label } from '@/components/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Button } from '@/components/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';
import FileUploadComponent from '../FileUploadComponent';

export default function Step4Education({ onboarding, onComplete }: any) {
    const [loading, setLoading] = useState(false);
    const [educationLevel, setEducationLevel] = useState(onboarding?.education_level || '');
    const [educationDocUrl, setEducationDocUrl] = useState(onboarding?.education_doc_url || '');

    const handleSubmit = async () => {
        if (!educationLevel || !educationDocUrl) {
            toast.error('Please select education level and upload document');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/onboarding/education', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onboardingId: onboarding.id, educationLevel, educationDocUrl })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Education info saved!');
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
                <Label>Highest Education Level *</Label>
                <Select value={educationLevel} onValueChange={setEducationLevel}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0f] border-white/10">
                        <SelectItem value="High School">High School</SelectItem>
                        <SelectItem value="College">College (Undergraduate)</SelectItem>
                        <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                        <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                        <SelectItem value="Doctorate">Doctorate</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Educational Document * (Diploma/Transcript)</Label>
                <p className="text-sm text-gray-400 mb-2">Upload your diploma, certificate, or transcript</p>
                <FileUploadComponent
                    candidateId={onboarding.candidate_id}
                    documentType="education_doc"
                    onFileUploaded={setEducationDocUrl}
                />
            </div>

            <Button onClick={handleSubmit} disabled={loading || !educationLevel || !educationDocUrl} className="w-full bg-orange-600 hover:bg-orange-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save & Continue'}
            </Button>
        </div>
    );
}
