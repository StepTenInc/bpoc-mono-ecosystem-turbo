'use client';

import React, { useState } from 'react';
import { Label } from '@/components/shared/ui/label';
import { Input } from '@/components/shared/ui/input';
import { Button } from '@/components/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';
import FileUploadComponent from '../FileUploadComponent';

interface Step3Props {
    onboarding: any;
    onComplete: () => void;
}

export default function Step3GovIDs({ onboarding, onComplete }: Step3Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        sss: onboarding?.sss || '',
        tin: onboarding?.tin || '',
        philhealthNo: onboarding?.philhealth_no || '',
        pagibigNo: onboarding?.pagibig_no || '',
        sssDocUrl: onboarding?.sss_doc_url || '',
        tinDocUrl: onboarding?.tin_doc_url || '',
        philhealthDocUrl: onboarding?.philhealth_doc_url || '',
        pagibigDocUrl: onboarding?.pagibig_doc_url || '',
        validIdUrl: onboarding?.valid_id_url || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all docs uploaded
        if (!formData.sssDocUrl || !formData.tinDocUrl || !formData.philhealthDocUrl || !formData.pagibigDocUrl || !formData.validIdUrl) {
            toast.error('Please upload all required documents');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/onboarding/gov-ids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    onboardingId: onboarding.id,
                    ...formData
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Government IDs saved!');
            onComplete();

        } catch (error: any) {
            toast.error(error.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label>SSS Number * (XX-XXXXXXX-X)</Label>
                <Input
                    value={formData.sss}
                    onChange={(e) => setFormData({ ...formData, sss: e.target.value })}
                    placeholder="12-3456789-0"
                    required
                    pattern="\d{2}-\d{7}-\d{1}"
                    className="bg-white/5 border-white/10"
                />
                <FileUploadComponent
                    candidateId={onboarding.candidate_id}
                    documentType="sss_doc"
                    onFileUploaded={(url) => setFormData({ ...formData, sssDocUrl: url })}
                />
            </div>

            <div className="space-y-2">
                <Label>TIN Number * (XXX-XXX-XXX-XXX)</Label>
                <Input
                    value={formData.tin}
                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                    placeholder="123-456-789-000"
                    required
                    pattern="\d{3}-\d{3}-\d{3}-\d{3}"
                    className="bg-white/5 border-white/10"
                />
                <FileUploadComponent
                    candidateId={onboarding.candidate_id}
                    documentType="tin_doc"
                    onFileUploaded={(url) => setFormData({ ...formData, tinDocUrl: url })}
                />
            </div>

            <div className="space-y-2">
                <Label>PhilHealth Number * (XX-XXXXXXXXX-X)</Label>
                <Input
                    value={formData.philhealthNo}
                    onChange={(e) => setFormData({ ...formData, philhealthNo: e.target.value })}
                    placeholder="12-123456789-0"
                    required
                    pattern="\d{2}-\d{9}-\d{1}"
                    className="bg-white/5 border-white/10"
                />
                <FileUploadComponent
                    candidateId={onboarding.candidate_id}
                    documentType="philhealth_doc"
                    onFileUploaded={(url) => setFormData({ ...formData, philhealthDocUrl: url })}
                />
            </div>

            <div className="space-y-2">
                <Label>Pag-IBIG Number * (XXXX-XXXX-XXXX)</Label>
                <Input
                    value={formData.pagibigNo}
                    onChange={(e) => setFormData({ ...formData, pagibigNo: e.target.value })}
                    placeholder="1234-5678-9012"
                    required
                    pattern="\d{4}-\d{4}-\d{4}"
                    className="bg-white/5 border-white/10"
                />
                <FileUploadComponent
                    candidateId={onboarding.candidate_id}
                    documentType="pagibig_doc"
                    onFileUploaded={(url) => setFormData({ ...formData, pagibigDocUrl: url })}
                />
            </div>

            <div className="space-y-2">
                <Label>Valid ID * (National ID, Passport, Driver's License)</Label>
                <FileUploadComponent
                    candidateId={onboarding.candidate_id}
                    documentType="valid_id"
                    onFileUploaded={(url) => setFormData({ ...formData, validIdUrl: url })}
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save & Continue'}
            </Button>
        </form>
    );
}
