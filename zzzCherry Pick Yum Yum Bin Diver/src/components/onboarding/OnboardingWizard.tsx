'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Progress } from '@/components/shared/ui/progress';
import { Check, Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';
import Step1PersonalInfo from './steps/Step1PersonalInfo';
import Step2Resume from './steps/Step2Resume';
import Step3GovIDs from './steps/Step3GovIDs';
import Step4Education from './steps/Step4Education';
import Step5Medical from './steps/Step5Medical';
import Step6DataPrivacy from './steps/Step6DataPrivacy';
import Step7Signature from './steps/Step7Signature';
import Step8EmergencyContact from './steps/Step8EmergencyContact';

interface OnboardingWizardProps {
    open: boolean;
    onClose: () => void;
    onboardingId: string;
    candidateId: string;
}

export default function OnboardingWizard({ open, onClose, onboardingId, candidateId }: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [onboarding, setOnboarding] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const steps = [
        { id: 1, name: 'Personal Info', field: 'personal_info_status' },
        { id: 2, name: 'Resume', field: 'resume_status' },
        { id: 3, name: 'Government IDs', field: 'gov_id_status' },
        { id: 4, name: 'Education', field: 'education_status' },
        { id: 5, name: 'Medical', field: 'medical_status' },
        { id: 6, name: 'Data Privacy', field: 'data_privacy_status' },
        { id: 7, name: 'Signature', field: 'signature_status' },
        { id: 8, name: 'Emergency Contact', field: 'emergency_contact_status' }
    ];

    useEffect(() => {
        if (open) {
            fetchOnboarding();
        }
    }, [open, onboardingId]);

    const fetchOnboarding = async () => {
        try {
            const res = await fetch(`/api/onboarding?candidateId=${candidateId}`);
            const data = await res.json();
            if (data.onboarding) {
                setOnboarding(data.onboarding);
                // Find first incomplete step
                const firstIncomplete = steps.findIndex(s =>
                    data.onboarding[s.field] !== 'APPROVED' && data.onboarding[s.field] !== 'SUBMITTED'
                );
                setCurrentStep(firstIncomplete >= 0 ? firstIncomplete + 1 : 1);
            }
        } catch (error) {
            console.error('Fetch onboarding error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStepStatus = (step: any) => {
        if (!onboarding) return 'pending';
        const status = onboarding[step.field];
        if (status === 'APPROVED') return 'approved';
        if (status === 'SUBMITTED') return 'submitted';
        if (status === 'REJECTED') return 'rejected';
        return 'pending';
    };

    const getProgress = () => {
        if (!onboarding) return 0;
        return onboarding.completion_percent || 0;
    };

    const handleNext = () => {
        if (currentStep < 8) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepComplete = () => {
        fetchOnboarding();
        toast.success('Step saved successfully!');
        if (currentStep < 8) {
            setCurrentStep(currentStep + 1);
        }
    };

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl bg-[#0F1419] border-white/10">
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-[#0F1419] border-white/10 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Complete Your Onboarding</DialogTitle>
                    <p className="text-gray-400">Step {currentStep} of 8: {steps[currentStep - 1].name}</p>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="space-y-2 mb-6">
                    <Progress value={getProgress()} className="h-2" />
                    <p className="text-sm text-gray-400 text-center">{getProgress()}% Complete</p>
                </div>

                {/* Steps Overview */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    {steps.map((step) => {
                        const status = getStepStatus(step);
                        return (
                            <div
                                key={step.id}
                                className={`p-2 rounded-lg text-center text-xs cursor-pointer transition-colors ${step.id === currentStep
                                    ? 'bg-orange-500/20 border border-orange-500 text-orange-400'
                                    : status === 'approved'
                                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                        : status === 'submitted'
                                            ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                                            : status === 'rejected'
                                                ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                                                : 'bg-white/5 border border-white/10 text-gray-400'
                                    }`}
                                onClick={() => setCurrentStep(step.id)}
                            >
                                {status === 'approved' && <Check className="h-3 w-3 mx-auto mb-1" />}
                                {step.name}
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {currentStep === 1 && <Step1PersonalInfo onboarding={onboarding} onComplete={handleStepComplete} />}
                    {currentStep === 2 && <Step2Resume onboarding={onboarding} onComplete={handleStepComplete} />}
                    {currentStep === 3 && <Step3GovIDs onboarding={onboarding} onComplete={handleStepComplete} />}
                    {currentStep === 4 && <Step4Education onboarding={onboarding} onComplete={handleStepComplete} />}
                    {currentStep === 5 && <Step5Medical onboarding={onboarding} onComplete={handleStepComplete} />}
                    {currentStep === 6 && <Step6DataPrivacy onboarding={onboarding} onComplete={handleStepComplete} />}
                    {currentStep === 7 && <Step7Signature onboarding={onboarding} onComplete={handleStepComplete} />}
                    {currentStep === 8 && <Step8EmergencyContact onboarding={onboarding} onComplete={handleStepComplete} />}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t border-white/10">
                    <Button
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        variant="outline"
                        className="border-white/20"
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="text-gray-400"
                    >
                        I'll Do This Later
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={currentStep === 8}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {currentStep === 8 ? 'Complete' : 'Next'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
