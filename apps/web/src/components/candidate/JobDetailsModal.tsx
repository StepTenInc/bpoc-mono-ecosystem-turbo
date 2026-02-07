'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/ui/dialog';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
    Building2,
    Calendar,
    CheckCircle,
    ChevronRight,
    Clock,
    DollarSign,
    Loader2,
    MapPin,
    Star,
    Users,
    Briefcase,
    X
} from 'lucide-react';

interface Job {
    id: string;
    title: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    benefits: string[];
    company: string;
    agency: string;
    workType: string;
    workArrangement: string;
    shift: string;
    experienceLevel: string;
    salaryMin?: number;
    salaryMax?: number;
    currency: string;
    skills: string[];
    createdAt: string;
    views: number;
    applicantsCount: number;
}

interface JobDetailsModalProps {
    jobId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function JobDetailsModal({ jobId, isOpen, onClose }: JobDetailsModalProps) {
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJob = async () => {
            if (!isOpen || !jobId) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(`/api/jobs/public/${jobId}`);
                const data = await response.json();
                
                if (response.ok && data.job) {
                    setJob(data.job);
                } else {
                    setError('Failed to load job details');
                }
            } catch (err) {
                console.error('Failed to fetch job:', err);
                setError('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [jobId, isOpen]);

    const formatSalary = () => {
        if (!job) return 'Competitive';
        if (job.salaryMin && job.salaryMax) {
            return `${job.currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
        }
        if (job.salaryMin) {
            return `${job.currency} ${job.salaryMin.toLocaleString()}+`;
        }
        return 'Competitive';
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const posted = new Date(date);
        const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className="bg-gray-900 border-white/10 text-white !max-w-5xl w-[90vw] max-h-[85vh] overflow-y-auto"
                showCloseButton={false}
            >
                {/* Custom Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10"
                >
                    <X className="h-5 w-5 text-gray-400" />
                </button>

                {/* Always render DialogTitle for accessibility */}
                <DialogHeader className="pr-10">
                    <DialogTitle className={loading || error ? 'sr-only' : 'hidden'}>
                        {loading ? 'Loading job details' : error ? 'Error loading job' : 'Job Details'}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mb-4" />
                        <p className="text-gray-400">Loading job details...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-red-400 mb-4">{error}</p>
                        <Button variant="outline" onClick={onClose} className="border-white/20 text-gray-300">
                            Close
                        </Button>
                    </div>
                ) : job ? (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="h-7 w-7 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {job.title}
                                </h2>
                                <div className="flex items-center gap-3 text-gray-400 text-sm">
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-4 w-4" />
                                        {job.agency}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Posted {getTimeAgo(job.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-gray-400 text-xs mb-1">Salary</p>
                                <p className="text-emerald-400 font-semibold text-sm">{formatSalary()}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-gray-400 text-xs mb-1">Work Type</p>
                                <p className="text-white font-medium text-sm capitalize">{job.workType?.replace('_', ' ')}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-gray-400 text-xs mb-1">Arrangement</p>
                                <p className="text-white font-medium text-sm capitalize">{job.workArrangement}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-gray-400 text-xs mb-1">Shift</p>
                                <p className="text-white font-medium text-sm capitalize">{job.shift} Shift</p>
                            </div>
                        </div>

                        {/* Skills */}
                        {job.skills && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {job.skills.slice(0, 8).map((skill) => (
                                    <Badge key={skill} variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
                                        {skill}
                                    </Badge>
                                ))}
                                {job.skills.length > 8 && (
                                    <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/20 text-xs">
                                        +{job.skills.length - 8} more
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">About this role</h3>
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                {job.description}
                            </p>
                        </div>

                        {/* Requirements */}
                        {job.requirements && job.requirements.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-white">Requirements</h3>
                                <ul className="space-y-2">
                                    {job.requirements.map((req, i) => (
                                        <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                                            <CheckCircle className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Responsibilities */}
                        {job.responsibilities && job.responsibilities.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-white">Responsibilities</h3>
                                <ul className="space-y-2">
                                    {job.responsibilities.map((resp, i) => (
                                        <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                                            <ChevronRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                            <span>{resp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Benefits */}
                        {job.benefits && job.benefits.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-white">Benefits</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.benefits.map((benefit, i) => (
                                        <Badge key={i} variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                            <Star className="h-3 w-3 mr-1" />
                                            {benefit}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {job.applicantsCount || 0} applicants
                                </span>
                            </div>
                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="border-white/20 text-gray-300 hover:bg-white/10"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

export default JobDetailsModal;

