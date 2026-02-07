'use client';

import React, { useState } from 'react';
import { Settings, Bell, Shield, Trash2, Mail, Globe, Lock, Save, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    applicationAlerts: true,
    weeklyDigest: false,
    marketingEmails: false,
    twoFactor: false,
    publicProfile: true,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account preferences</p>
      </div>

      {/* Notifications */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email notifications for important updates' },
              { key: 'applicationAlerts', label: 'Application Alerts', desc: 'Get notified when candidates apply to your jobs' },
              { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary of your recruiting activity' },
              { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive tips and product updates from BPOC' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleSetting(item.key as keyof typeof settings)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings[item.key as keyof typeof settings] ? 'bg-orange-500' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={() => toggleSetting('twoFactor')}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.twoFactor ? 'bg-orange-500' : 'bg-white/20'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.twoFactor ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="text-white font-medium">Change Password</p>
                <p className="text-gray-400 text-sm">Update your account password</p>
              </div>
              <Button variant="outline" size="sm" className="border-white/10 text-gray-300">
                <Lock className="h-4 w-4 mr-2" />Change
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Privacy</h2>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
            <div>
              <p className="text-white font-medium">Public Agency Profile</p>
              <p className="text-gray-400 text-sm">Allow candidates to view your agency profile</p>
            </div>
            <button
              onClick={() => toggleSetting('publicProfile')}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.publicProfile ? 'bg-orange-500' : 'bg-white/20'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.publicProfile ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-red-500/5 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-orange-500 to-amber-600">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Save Settings</>}
      </Button>
    </div>
  );
}

