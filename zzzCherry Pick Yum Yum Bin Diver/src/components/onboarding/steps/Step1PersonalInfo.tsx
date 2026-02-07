'use client';

import React, { useState } from 'react';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Button } from '@/components/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';

interface Step1Props {
    onboarding: any;
    onComplete: () => void;
}

export default function Step1PersonalInfo({ onboarding, onComplete }: Step1Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: onboarding?.first_name || '',
        middleName: onboarding?.middle_name || '',
        lastName: onboarding?.last_name || '',
        gender: onboarding?.gender || '',
        civilStatus: onboarding?.civil_status || '',
        dateOfBirth: onboarding?.date_of_birth || '',
        contactNo: onboarding?.contact_no || '',
        email: onboarding?.email || '',
        address: onboarding?.address || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate age
        const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
        if (age < 18) {
            toast.error('You must be at least 18 years old');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/onboarding/personal-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    onboardingId: onboarding.id,
                    ...formData
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast.success('Personal information saved!');
            onComplete();

        } catch (error: any) {
            toast.error(error.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label>First Name *</Label>
                    <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        className="bg-white/5 border-white/10"
                    />
                </div>
                <div>
                    <Label>Middle Name</Label>
                    <Input
                        value={formData.middleName}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                        className="bg-white/5 border-white/10"
                    />
                </div>
                <div>
                    <Label>Last Name *</Label>
                    <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="bg-white/5 border-white/10"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Gender *</Label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0f] border-white/10">
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Civil Status *</Label>
                    <Select value={formData.civilStatus} onValueChange={(v) => setFormData({ ...formData, civilStatus: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0f] border-white/10">
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                            <SelectItem value="Separated">Separated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Date of Birth *</Label>
                    <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        required
                        className="bg-white/5 border-white/10"
                    />
                </div>
                <div>
                    <Label>Contact Number *</Label>
                    <Input
                        value={formData.contactNo}
                        onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                        placeholder="+63 XXX XXX XXXX"
                        required
                        className="bg-white/5 border-white/10"
                    />
                </div>
            </div>

            <div>
                <Label>Email *</Label>
                <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-white/5 border-white/10"
                />
            </div>

            <div>
                <Label>Complete Address *</Label>
                <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House/Unit, Street, Barangay, City, Province, ZIP"
                    required
                    className="bg-white/5 border-white/10 min-h-[80px]"
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save & Continue'}
            </Button>
        </form>
    );
}
