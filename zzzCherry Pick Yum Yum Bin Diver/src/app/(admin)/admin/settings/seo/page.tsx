'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Building2, Globe, Mail, Phone, MapPin, Linkedin, Facebook, Twitter, Save, RefreshCw, Eye, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrganizationSchema {
  name: string;
  legalName: string;
  url: string;
  logo: string;
  description: string;
  telephone: string;
  email: string;
  foundingDate: string;
  address: {
    '@type': string;
    addressCountry: string;
    addressRegion: string;
    addressLocality: string;
  };
  sameAs: string[];
  contactPoint: {
    '@type': string;
    telephone: string;
    contactType: string;
    areaServed: string[];
    availableLanguage: string[];
  };
}

export default function SEOSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schema, setSchema] = useState<OrganizationSchema | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Fetch current organization schema
  useEffect(() => {
    fetchOrganizationSchema();
  }, []);

  const fetchOrganizationSchema = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/organization', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch organization schema');

      const result = await response.json();
      setSchema(result.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load organization schema',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!schema) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/organization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          organizationData: schema,
          adminUserId: localStorage.getItem('adminUserId'),
        }),
      });

      if (!response.ok) throw new Error('Failed to update organization schema');

      const result = await response.json();

      toast({
        title: 'Success!',
        description: 'Organization schema updated successfully',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save organization schema',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSchema = (path: string, value: any) => {
    if (!schema) return;

    const keys = path.split('.');
    const newSchema = { ...schema };
    let current: any = newSchema;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSchema(newSchema);
  };

  const updateSameAs = (index: number, value: string) => {
    if (!schema) return;
    const newSameAs = [...schema.sameAs];
    newSameAs[index] = value;
    setSchema({ ...schema, sameAs: newSameAs });
  };

  if (loading || !schema) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">SEO Settings</h1>
          <p className="text-gray-400 mt-1">Manage global organization schema for search engines</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="border-white/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview Schema'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {previewMode ? (
        // PREVIEW MODE
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              Organization Schema Preview
            </CardTitle>
            <CardDescription className="text-gray-400">
              This is how search engines will see your organization data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm text-gray-300 font-mono">
              {JSON.stringify(
                {
                  '@context': 'https://schema.org',
                  '@type': 'Organization',
                  ...schema,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      ) : (
        // EDIT MODE
        <>
          {/* Basic Information */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-gray-400">
                Core details about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Organization Name</Label>
                  <Input
                    id="name"
                    value={schema.name}
                    onChange={(e) => updateSchema('name', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName" className="text-white">Legal Name</Label>
                  <Input
                    id="legalName"
                    value={schema.legalName}
                    onChange={(e) => updateSchema('legalName', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={schema.description}
                  onChange={(e) => updateSchema('description', e.target.value)}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-white flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website URL
                  </Label>
                  <Input
                    id="url"
                    value={schema.url}
                    onChange={(e) => updateSchema('url', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo" className="text-white">Logo URL</Label>
                  <Input
                    id="logo"
                    value={schema.logo}
                    onChange={(e) => updateSchema('logo', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-400" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={schema.email}
                    onChange={(e) => updateSchema('email', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-white flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telephone
                  </Label>
                  <Input
                    id="telephone"
                    value={schema.telephone}
                    onChange={(e) => updateSchema('telephone', e.target.value)}
                    placeholder="+63-xxx-xxx-xxxx"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressCountry" className="text-white">Country Code</Label>
                  <Input
                    id="addressCountry"
                    value={schema.address.addressCountry}
                    onChange={(e) => updateSchema('address.addressCountry', e.target.value)}
                    placeholder="PH"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressRegion" className="text-white">Region</Label>
                  <Input
                    id="addressRegion"
                    value={schema.address.addressRegion}
                    onChange={(e) => updateSchema('address.addressRegion', e.target.value)}
                    placeholder="Metro Manila"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLocality" className="text-white">Locality</Label>
                  <Input
                    id="addressLocality"
                    value={schema.address.addressLocality}
                    onChange={(e) => updateSchema('address.addressLocality', e.target.value)}
                    placeholder="Philippines"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Social Media Links</CardTitle>
              <CardDescription className="text-gray-400">
                Links to your official social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-white flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  value={schema.sameAs[0] || ''}
                  onChange={(e) => updateSameAs(0, e.target.value)}
                  placeholder="https://www.linkedin.com/company/..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook" className="text-white flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  value={schema.sameAs[1] || ''}
                  onChange={(e) => updateSameAs(1, e.target.value)}
                  placeholder="https://www.facebook.com/..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className="text-white flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter/X
                </Label>
                <Input
                  id="twitter"
                  value={schema.sameAs[2] || ''}
                  onChange={(e) => updateSameAs(2, e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Info Card */}
      <Card className="bg-cyan-500/10 border-cyan-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-white font-medium">Organization Schema Impact</p>
              <p className="text-gray-300 text-sm">
                This schema is injected globally on every page and helps search engines understand your business.
                It improves rich snippet appearance in Google, Bing, and other search engines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
