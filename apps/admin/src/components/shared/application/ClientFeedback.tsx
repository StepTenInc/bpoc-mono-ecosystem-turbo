'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Edit, Save, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { toast } from '@/components/shared/ui/toast';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';

interface ClientFeedbackProps {
  applicationId: string;
  notes?: string | null;
  rating?: number | null;
  onUpdate?: () => void;
  editable?: boolean;
}

export function ClientFeedback({ 
  applicationId, 
  notes, 
  rating, 
  onUpdate,
  editable = true 
}: ClientFeedbackProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    notes: notes || '',
    rating: rating || 0,
  });

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
      const response = await fetch(`/api/recruiter/applications/${applicationId}/client-feedback`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify({
          notes: formData.notes || undefined,
          rating: formData.rating > 0 ? formData.rating : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Client feedback updated');
        setIsEditing(false);
        onUpdate?.();
      } else {
        toast.error(data.error || 'Failed to update feedback');
      }
    } catch (error) {
      console.error('Failed to update client feedback:', error);
      toast.error('Failed to update feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Client Feedback
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
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: value })}
                    className={`p-2 rounded-lg transition-all ${
                      formData.rating >= value
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-white/5 text-gray-500 hover:bg-white/10'
                    }`}
                  >
                    <Star className={`h-5 w-5 ${formData.rating >= value ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add client notes about this candidate..."
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
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
                  setFormData({ notes: notes || '', rating: rating || 0 });
                }}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rating */}
            {rating && rating > 0 ? (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={`h-5 w-5 ${
                        value <= rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-gray-400">{rating}/5</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No rating yet</p>
            )}

            {/* Notes */}
            {notes ? (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Notes</label>
                <p className="text-gray-300 whitespace-pre-wrap">{notes}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No notes added</p>
            )}

            <div className="text-gray-500 text-sm">Tags removed — notes + rating only.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

