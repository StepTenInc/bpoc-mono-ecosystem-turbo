'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Check, X, Clock, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';

interface OnboardingReviewModalProps {
    open: boolean;
    onClose: () => void;
    onboarding: any;
    onUpdate: () => void;
}

export default function OnboardingReviewModal({ open, onClose, onboarding, onUpdate }: OnboardingReviewModalProps) {
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const sections = [
        { key: 'personal_info', name: 'Personal Information', status: onboarding?.personal_info_status },
        { key: 'resume', name: 'Resume', status: onboarding?.resume_status },
        { key: 'gov_id', name: 'Government IDs', status: onboarding?.gov_id_status },
        { key: 'education', name: 'Education', status: onboarding?.education_status },
        { key: 'medical', name: 'Medical Clearance', status: onboarding?.medical_status },
        { key: 'data_privacy', name: 'Data Privacy', status: onboarding?.data_privacy_status },
        { key: 'signature', name: 'Signature', status: onboarding?.signature_status },
        { key: 'emergency_contact', name: 'Emergency Contact', status: onboarding?.emergency_contact_status }
    ];

    const handleReview = async (section: string, status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !feedback.trim()) {
            toast.error('Please provide feedback for rejection');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`/api/onboarding/${onboarding.id}/${section}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, feedback })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast.success(`Section ${status.toLowerCase()}`);
            setFeedback('');
            setSelectedSection(null);
            onUpdate();

        } catch (error: any) {
            toast.error(error.message || 'Failed to update');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === 'APPROVED') return <Check className="h-4 w-4 text-emerald-400" />;
        if (status === 'REJECTED') return <X className="h-4 w-4 text-red-400" />;
        if (status === 'SUBMITTED') return <Clock className="h-4 w-4 text-cyan-400" />;
        return <FileText className="h-4 w-4 text-gray-400" />;
    };

    const getStatusColor = (status: string) => {
        if (status === 'APPROVED') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (status === 'REJECTED') return 'bg-red-500/20 text-red-400 border-red-500/30';
        if (status === 'SUBMITTED') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    if (!onboarding) return null;

    const candidateName = `${onboarding.first_name || ''} ${onboarding.last_name || ''}`.trim();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-[#0F1419] border-white/10 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Review Onboarding</DialogTitle>
                    <div className="space-y-1">
                        <p className="text-gray-300">{candidateName}</p>
                        <p className="text-sm text-gray-400">Position: {onboarding.position}</p>
                        <p className="text-sm text-gray-400">
                            Progress: {onboarding.completion_percent}% •
                            {onboarding.is_complete ? ' ✓ Complete' : ' Pending'}
                        </p>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                    {sections.map((section) => (
                        <Card
                            key={section.key}
                            className={`p-4 cursor-pointer transition-colors ${selectedSection === section.key
                                    ? 'bg-orange-500/10 border-orange-500/50'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                            onClick={() => setSelectedSection(section.key)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{section.name}</h4>
                                {getStatusIcon(section.status)}
                            </div>
                            <Badge className={`text-xs ${getStatusColor(section.status)}`}>
                                {section.status}
                            </Badge>
                        </Card>
                    ))}
                </div>

                {selectedSection && (
                    <div className="border-t border-white/10 pt-4 mt-4">
                        <h3 className="font-semibold mb-4">
                            Review: {sections.find(s => s.key === selectedSection)?.name}
                        </h3>

                        <div>
                            <Label>Admin Feedback (shown to candidate if rejected)</Label>
                            <Textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="e.g., TIN document is blurry, please upload a clearer image"
                                className="bg-white/5 border-white/10 min-h-[80px] mb-4"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleReview(selectedSection, 'APPROVED')}
                                disabled={loading}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                Approve
                            </Button>
                            <Button
                                onClick={() => handleReview(selectedSection, 'REJECTED')}
                                disabled={loading || !feedback.trim()}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                                Reject
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
