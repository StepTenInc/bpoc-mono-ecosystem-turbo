'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Loader2, Search, FileText, Users, AlertCircle } from 'lucide-react';
import OnboardingReviewModal from '@/components/admin/OnboardingReviewModal';

export default function AdminOnboardingPage() {
  const [onboardings, setOnboardings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOnboarding, setSelectedOnboarding] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOnboardings();
  }, []);

  const fetchOnboardings = async () => {
    try {
      const res = await fetch('/api/admin/onboarding/pending');
      const data = await res.json();
      setOnboardings(data.onboardings || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOnboardings = onboardings.filter((o) => {
    const name = `${o.first_name} ${o.last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || o.position?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStatusColor = (percent: number) => {
    if (percent === 100) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (percent >= 50) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Onboarding Review</h1>
        <p className="text-gray-400">Review and approve pending onboarding submissions</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-cyan-400" />
            <div>
              <p className="text-2xl font-bold">{onboardings.length}</p>
              <p className="text-sm text-gray-400">Pending Onboardings</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-orange-400" />
            <div>
              <p className="text-2xl font-bold">
                {onboardings.filter(o => o.completion_percent < 100).length}
              </p>
              <p className="text-sm text-gray-400">Incomplete</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold">
                {onboardings.filter(o => hasRejectedSections(o)).length}
              </p>
              <p className="text-sm text-gray-400">With Rejections</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : filteredOnboardings.length === 0 ? (
        <Card className="bg-white/5 border-white/10 p-12 text-center">
          <p className="text-gray-400">No pending onboardings found</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOnboardings.map((onboarding) => (
            <Card
              key={onboarding.id}
              className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => setSelectedOnboarding(onboarding)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-orange-400">
                      {onboarding.first_name?.[0]}{onboarding.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {onboarding.first_name} {onboarding.last_name}
                    </h3>
                    <p className="text-sm text-gray-400">{onboarding.position}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{onboarding.completion_percent}% Complete</p>
                    <p className="text-xs text-gray-400">
                      Started {new Date(onboarding.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(onboarding.completion_percent)}>
                    {onboarding.is_complete ? 'Complete' : 'Pending'}
                  </Badge>
                  <Button size="sm" variant="outline" className="border-white/20">
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedOnboarding && (
        <OnboardingReviewModal
          open={!!selectedOnboarding}
          onClose={() => setSelectedOnboarding(null)}
          onboarding={selectedOnboarding}
          onUpdate={() => {
            fetchOnboardings();
            setSelectedOnboarding(null);
          }}
        />
      )}
    </div>
  );
}

function hasRejectedSections(onboarding: any) {
  const sections = [
    'personal_info_status', 'gov_id_status', 'resume_status', 'education_status',
    'medical_status', 'data_privacy_status', 'signature_status', 'emergency_contact_status'
  ];
  return sections.some(s => onboarding[s] === 'REJECTED');
}
