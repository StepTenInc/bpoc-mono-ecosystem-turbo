'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Progress } from '@/components/shared/ui/progress';
import { FileText, Sparkles, AlertCircle, Check, Clock } from 'lucide-react';

interface OnboardingProgressCardProps {
    candidateId: string;
    onOpenWizard?: () => void;
}

export default function OnboardingProgressCard({ candidateId, onOpenWizard }: OnboardingProgressCardProps) {
    const [onboarding, setOnboarding] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOnboarding();
    }, [candidateId]);

    const fetchOnboarding = async () => {
        try {
            const res = await fetch(`/api/onboarding?candidateId=${candidateId}`);
            const data = await res.json();
            setOnboarding(data.onboarding);
        } catch (error) {
            console.error('Fetch onboarding error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 p-6">
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 animate-spin text-orange-400" />
                    <p className="text-gray-300">Loading onboarding status...</p>
                </div>
            </Card>
        );
    }

    if (!onboarding) {
        return null; // No onboarding initialized yet
    }

    if (onboarding.is_complete) {
        return (
            <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30 p-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-emerald-400">Onboarding Complete!</h3>
                        <p className="text-sm text-gray-400">All documents submitted and approved</p>
                    </div>
                </div>
            </Card>
        );
    }

    const progress = onboarding.completion_percent || 0;
    const pendingSections = getSectionStatuses(onboarding).filter((s: any) => s.status === 'PENDING').length;
    const rejectedSections = getSectionStatuses(onboarding).filter((s: any) => s.status === 'REJECTED').length;

    return (
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-orange-400">Complete Your Onboarding</h3>
                        <p className="text-sm text-gray-400">{progress}% complete • {pendingSections} steps remaining</p>
                    </div>
                </div>
                <FileText className="h-5 w-5 text-orange-400" />
            </div>

            <Progress value={progress} className="h-2 mb-4" />

            {rejectedSections > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-400">⚠️ {rejectedSections} section(s) rejected - please resubmit</p>
                </div>
            )}

            <p className="text-sm text-gray-300 mb-4">
                Complete your onboarding by {onboarding.start_date ? new Date(onboarding.start_date).toLocaleDateString() : 'your start date'} to begin work.
            </p>

            <Button
                onClick={onOpenWizard}
                className="w-full bg-orange-600 hover:bg-orange-700"
            >
                <Sparkles className="h-4 w-4 mr-2" />
                Complete Now
            </Button>
        </Card>
    );
}

function getSectionStatuses(onboarding: any) {
    return [
        { name: 'Personal Info', status: onboarding.personal_info_status },
        { name: 'Resume', status: onboarding.resume_status },
        { name: 'Government IDs', status: onboarding.gov_id_status },
        { name: 'Education', status: onboarding.education_status },
        { name: 'Medical', status: onboarding.medical_status },
        { name: 'Data Privacy', status: onboarding.data_privacy_status },
        { name: 'Signature', status: onboarding.signature_status },
        { name: 'Emergency Contact', status: onboarding.emergency_contact_status }
    ];
}
