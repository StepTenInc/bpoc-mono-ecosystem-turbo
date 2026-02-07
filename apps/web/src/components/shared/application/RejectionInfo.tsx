'use client';

import React, { useState } from 'react';
import { XCircle, Edit, Save, X, Loader2, User, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Textarea } from '@/components/shared/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { toast } from '@/components/shared/ui/toast';

interface RejectionInfoProps {
  applicationId: string;
  rejectionReason?: string | null;
  rejectedBy?: 'client' | 'recruiter' | null;
  rejectedDate?: string | null;
  onUpdate?: () => void;
  editable?: boolean;
}

export function RejectionInfo({
  applicationId,
  rejectionReason,
  rejectedBy,
  rejectedDate,
  onUpdate,
  editable = true,
}: RejectionInfoProps) {
  const { user } = useAuth();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [formData, setFormData] = useState({
    reason: rejectionReason || '',
    rejected_by: rejectedBy || 'recruiter',
  });

  const handleReject = async () => {
    if (!formData.reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setRejecting(true);
    try {
      const token = await getSessionToken();
      const userId = user?.id || '';
      if (!token || !userId) {
        toast.error('Not authenticated');
        return;
      }
      // Use internal API route for recruiter/admin portal
      const response = await fetch(`/api/recruiter/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify({
          reason: formData.reason,
          rejected_by: formData.rejected_by,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Application rejected');
        setShowRejectDialog(false);
        onUpdate?.();
      } else {
        toast.error(data.error || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Failed to reject application:', error);
      toast.error('Failed to reject application');
    } finally {
      setRejecting(false);
    }
  };

  if (!rejectionReason && !editable) {
    return null;
  }

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            Rejection Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rejectionReason ? (
            <>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Reason</label>
                <p className="text-gray-300 whitespace-pre-wrap">{rejectionReason}</p>
              </div>
              <div className="flex items-center gap-4">
                {rejectedBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Rejected By</label>
                    <Badge
                      variant="outline"
                      className={
                        rejectedBy === 'client'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      }
                    >
                      {rejectedBy === 'client' ? (
                        <>
                          <Building2 className="h-3 w-3 mr-1" />
                          Client
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Recruiter
                        </>
                      )}
                    </Badge>
                  </div>
                )}
                {rejectedDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Date</label>
                    <p className="text-gray-400 text-sm">
                      {new Date(rejectedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No rejection details recorded yet.</p>
          )}
          
          {/* Reject Application Button - Below Content */}
          {editable && !rejectionReason && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Application
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Application</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for rejecting this application. This will update the application status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Rejected By
              </label>
              <Select
                value={formData.rejected_by}
                onValueChange={(value: 'client' | 'recruiter') =>
                  setFormData({ ...formData, rejected_by: value })
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Reason <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter rejection reason..."
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowRejectDialog(false)}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting || !formData.reason.trim()}
            >
              {rejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

