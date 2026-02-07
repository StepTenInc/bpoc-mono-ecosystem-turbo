'use client';

import React, { useState } from 'react';
import { Award, Edit, Save, X, Loader2, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Checkbox } from '@/components/shared/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import { toast } from '@/components/shared/ui/toast';

interface HiredStatusProps {
  applicationId: string;
  offerAcceptanceDate?: string | null;
  contractSigned?: boolean;
  firstDayDate?: string | null;
  startedStatus?: 'hired' | 'started' | 'no_show' | null;
  onUpdate?: () => void;
  editable?: boolean;
}

export function HiredStatus({
  applicationId,
  offerAcceptanceDate,
  contractSigned = false,
  firstDayDate,
  startedStatus,
  onUpdate,
  editable = true,
}: HiredStatusProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    offer_acceptance_date: offerAcceptanceDate ? new Date(offerAcceptanceDate).toISOString().split('T')[0] : '',
    contract_signed: contractSigned,
    first_day_date: firstDayDate || '',
    started_status: startedStatus || '',
  });

  // Check if any data exists
  const hasData = !!(offerAcceptanceDate || contractSigned || firstDayDate || startedStatus);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getSessionToken();
      const userId = user?.id || '';
      if (!token || !userId) {
        toast.error('Not authenticated');
        return;
      }
      // Use internal API route for recruiter/admin portal
      const response = await fetch(`/api/recruiter/applications/${applicationId}/hired`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify({
          offer_acceptance_date: formData.offer_acceptance_date || undefined,
          contract_signed: formData.contract_signed,
          first_day_date: formData.first_day_date || undefined,
          started_status: formData.started_status || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Hired status updated');
        setIsEditing(false);
        onUpdate?.();
      } else {
        toast.error(data.error || 'Failed to update hired status');
      }
    } catch (error) {
      console.error('Failed to update hired status:', error);
      toast.error('Failed to update hired status');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    
    const configs = {
      hired: { label: 'Hired', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Award },
      started: { label: 'Started', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: CheckCircle },
      no_show: { label: 'No Show', color: 'bg-red-500/10 text-red-400 border-red-500/30', icon: XCircle },
    };
    
    const config = configs[status as keyof typeof configs];
    if (!config) return null;
    
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className={`border-white/10 ${!editable && !hasData ? 'bg-white/[0.02] opacity-60' : 'bg-white/5'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 ${!editable && !hasData ? 'text-gray-500' : 'text-white'}`}>
            <Award className="h-5 w-5" />
            Hired & Started Tracking
          </CardTitle>
          {editable && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {!editable && !hasData && (
            <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30 text-xs">
              No Data Yet
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {/* Offer Acceptance Date */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Offer Acceptance Date
              </label>
              <Input
                type="date"
                value={formData.offer_acceptance_date}
                onChange={(e) => setFormData({ ...formData, offer_acceptance_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Contract Signed */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="contract_signed"
                checked={formData.contract_signed}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, contract_signed: checked === true })
                }
              />
              <label htmlFor="contract_signed" className="text-sm font-medium text-gray-300 cursor-pointer">
                Contract Signed
              </label>
            </div>

            {/* First Day Date */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                First Day Date
              </label>
              <Input
                type="date"
                value={formData.first_day_date}
                onChange={(e) => setFormData({ ...formData, first_day_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Started Status */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Started Status
              </label>
              <Select
                value={formData.started_status}
                onValueChange={(value) => setFormData({ ...formData, started_status: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    offer_acceptance_date: offerAcceptanceDate ? new Date(offerAcceptanceDate).toISOString().split('T')[0] : '',
                    contract_signed: contractSigned,
                    first_day_date: firstDayDate || '',
                    started_status: startedStatus || '',
                  });
                }}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : !editable && !hasData ? (
          // Disabled state when no data and not editable
          <div className="text-center py-4">
            <Award className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              Hired & started tracking data will appear here once the candidate is hired.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Offer Acceptance Date */}
            {offerAcceptanceDate ? (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Offer Acceptance Date
                </label>
                <p className="text-gray-300">
                  {new Date(offerAcceptanceDate).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No offer acceptance date recorded</p>
            )}

            {/* Contract Signed */}
            <div className="flex items-center gap-2">
              <CheckCircle
                className={`h-5 w-5 ${
                  contractSigned ? 'text-emerald-400' : 'text-gray-600'
                }`}
              />
              <span className={`text-sm ${contractSigned ? 'text-gray-300' : 'text-gray-500'}`}>
                Contract {contractSigned ? 'Signed' : 'Not Signed'}
              </span>
            </div>

            {/* First Day Date */}
            {firstDayDate ? (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  First Day Date
                </label>
                <p className="text-gray-300">
                  {new Date(firstDayDate).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No first day date recorded</p>
            )}

            {/* Started Status */}
            {startedStatus && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
                {getStatusBadge(startedStatus)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

