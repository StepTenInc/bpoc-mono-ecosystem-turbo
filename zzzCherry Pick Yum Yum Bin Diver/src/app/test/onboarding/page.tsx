'use client';

import React, { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Card } from '@/components/shared/ui/card';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { Sparkles, User, FileText } from 'lucide-react';

export default function OnboardingTestPage() {
    const [wizardOpen, setWizardOpen] = useState(false);
    const [testOnboardingId, setTestOnboardingId] = useState<string | null>(null);
    const [testCandidateId, setTestCandidateId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const createTestOnboarding = async () => {
        setLoading(true);

        try {
            // Create a test onboarding record
            const res = await fetch('/api/test/onboarding/create-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testMode: true
                })
            });

            const data = await res.json();

            if (res.ok) {
                setTestOnboardingId(data.onboardingId);
                setTestCandidateId(data.candidateId);

                // Show pre-populated info
                if (data.prePopulatedSteps && data.prePopulatedSteps.length > 0) {
                    alert(`✅ ${data.message}\n\nPre-populated steps:\n${data.prePopulatedSteps.map((s: string) => `• ${s}`).join('\n')}`);
                }

                setWizardOpen(true);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">🧪 Onboarding Wizard Test</h1>
                    <p className="text-gray-400">
                        Standalone test environment for the Philippines 201 file onboarding system
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Card className="bg-white/5 border-white/10 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Steps</p>
                                <p className="text-2xl font-bold">8</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white/5 border-white/10 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Gov IDs</p>
                                <p className="text-2xl font-bold">4</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white/5 border-white/10 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Philippines</p>
                                <p className="text-lg font-bold">Compliant</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Features List */}
                <Card className="bg-white/5 border-white/10 p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">✨ What You Can Test</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold text-orange-400 mb-2">8-Step Wizard:</h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Personal Information (Name, DOB, Address)</li>
                                <li>• Resume Upload</li>
                                <li>• Government IDs (SSS, TIN, PhilHealth, Pag-IBIG)</li>
                                <li>• Education Documents</li>
                                <li>• Medical Clearance</li>
                                <li>• Data Privacy Consent (PH DPA 2012)</li>
                                <li>• Digital Signature (Canvas)</li>
                                <li>• Emergency Contact</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-cyan-400 mb-2">Features:</h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Progress tracking (0-100%)</li>
                                <li>• Drag-and-drop file upload</li>
                                <li>• Philippines ID format validation</li>
                                <li>• Touch-friendly signature pad</li>
                                <li>• Auto-save on each step</li>
                                <li>• Step navigation</li>
                                <li>• Color-coded status indicators</li>
                                <li>• Mobile responsive</li>
                            </ul>
                        </div>
                    </div>
                </Card>

                {/* Launch Button */}
                <div className="text-center">
                    <Button
                        onClick={createTestOnboarding}
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-lg px-8 py-6"
                    >
                        {loading ? (
                            <>Loading Test Data...</>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5 mr-2" />
                                Launch Onboarding Wizard
                            </>
                        )}
                    </Button>
                    <p className="text-sm text-gray-400 mt-4">
                        This will create a test onboarding record and open the wizard
                    </p>
                </div>

                {/* Test IDs Display */}
                {testOnboardingId && (
                    <Card className="bg-emerald-500/10 border-emerald-500/30 p-4 mt-8">
                        <p className="text-sm text-emerald-400">
                            ✓ Test onboarding created!
                            <br />
                            <span className="text-xs text-gray-400">
                                Onboarding ID: {testOnboardingId}
                                <br />
                                Candidate ID: {testCandidateId}
                            </span>
                        </p>
                    </Card>
                )}
            </div>

            {/* Wizard Modal */}
            {wizardOpen && testOnboardingId && testCandidateId && (
                <OnboardingWizard
                    open={wizardOpen}
                    onClose={() => setWizardOpen(false)}
                    onboardingId={testOnboardingId}
                    candidateId={testCandidateId}
                />
            )}
        </div>
    );
}
