'use client';

import React, { useState } from 'react';
import { Label } from '@/components/shared/ui/label';
import { Input } from '@/components/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Button } from '@/components/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';

export default function Step8EmergencyContact({ onboarding, onComplete }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        emergencyContactName: onboarding?.emergency_contact_name || '',
        emergencyContactRelationship: onboarding?.emergency_contact_relationship || '',
        emergencyContactPhone: onboarding?.emergency_contact_phone || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/onboarding/emergency-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onboardingId: onboarding.id, ...formData })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Emergency contact saved! All steps complete! 🎉');
            onComplete();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-300">
                    🎉 Final step! Provide an emergency contact person who we can reach in case of emergencies.
                </p>
            </div>

            <div>
                <Label>Emergency Contact Name *</Label>
                <Input
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="Full Name"
                    required
                    className="bg-white/5 border-white/10"
                />
            </div>

            <div>
                <Label>Relationship *</Label>
                <Select
                    value={formData.emergencyContactRelationship}
                    onValueChange={(v) => setFormData({ ...formData, emergencyContactRelationship: v })}
                >
                    <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0f] border-white/10">
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Emergency Contact Phone *</Label>
                <Input
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="+63 XXX XXX XXXX"
                    required
                    className="bg-white/5 border-white/10"
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : '✓ Complete Onboarding'}
            </Button>
        </form>
    );
}
