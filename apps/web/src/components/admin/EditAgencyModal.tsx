'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Switch } from '@/components/shared/ui/switch';
import { toast } from '@/components/shared/ui/toast';
import { getSessionToken } from '@/lib/auth-helpers';

interface AgencyData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  foundedYear?: number;
  employeeCount?: string;
  addressLine1?: string;
  addressLine2?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
}

interface EditAgencyModalProps {
  agency: AgencyData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAgencyModal({ agency, isOpen, onClose, onSuccess }: EditAgencyModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AgencyData>(agency);

  useEffect(() => {
    setFormData(agency);
  }, [agency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/admin/agencies/${agency.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Agency updated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to update agency');
      }
    } catch (error) {
      console.error('Error updating agency:', error);
      toast.error('Failed to update agency');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AgencyData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#121217] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Agency</h2>
              <p className="text-gray-400 text-sm">{agency.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Agency Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-300">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="text-gray-300">Website</Label>
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Tell us about your agency..."
                />
              </div>
            </div>

            {/* Agency Profile */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Agency Profile</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="foundedYear" className="text-gray-300">Founded Year</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    value={formData.foundedYear || ''}
                    onChange={(e) => handleChange('foundedYear', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="2020"
                  />
                </div>

                <div>
                  <Label htmlFor="employeeCount" className="text-gray-300">Employee Count</Label>
                  <Input
                    id="employeeCount"
                    value={formData.employeeCount || ''}
                    onChange={(e) => handleChange('employeeCount', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="1-10, 11-50, etc."
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Address</h3>

              <div>
                <Label htmlFor="addressLine1" className="text-gray-300">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={formData.addressLine1 || ''}
                  onChange={(e) => handleChange('addressLine1', e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Street address"
                />
              </div>

              <div>
                <Label htmlFor="addressLine2" className="text-gray-300">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={formData.addressLine2 || ''}
                  onChange={(e) => handleChange('addressLine2', e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Suite, unit, building, floor, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-gray-300">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="state" className="text-gray-300">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="country" className="text-gray-300">Country</Label>
                  <Input
                    id="country"
                    value={formData.country || ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode" className="text-gray-300">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode || ''}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Social Media</h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="linkedinUrl" className="text-gray-300">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    value={formData.linkedinUrl || ''}
                    onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>

                <div>
                  <Label htmlFor="facebookUrl" className="text-gray-300">Facebook URL</Label>
                  <Input
                    id="facebookUrl"
                    value={formData.facebookUrl || ''}
                    onChange={(e) => handleChange('facebookUrl', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <Label htmlFor="twitterUrl" className="text-gray-300">Twitter URL</Label>
                  <Input
                    id="twitterUrl"
                    value={formData.twitterUrl || ''}
                    onChange={(e) => handleChange('twitterUrl', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Status</h3>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <Label className="text-gray-300">Active Status</Label>
                  <p className="text-gray-500 text-sm">Agency is active and can operate</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <Label className="text-gray-300">Verified</Label>
                  <p className="text-gray-500 text-sm">Agency has been verified by BPOC</p>
                </div>
                <Switch
                  checked={formData.isVerified}
                  onCheckedChange={(checked) => handleChange('isVerified', checked)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-white/10 text-gray-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
