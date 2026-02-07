'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Webhook, Plus, Trash2, Power, PowerOff, Send, ExternalLink,
  CheckCircle2, XCircle, Clock, AlertCircle, Copy, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from '@/components/shared/ui/toast';
import { getSessionToken } from '@/lib/auth-helpers';
import { useAuth } from '@/contexts/AuthContext';

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  description?: string;
  is_active: boolean;
  created_at: string;
  last_triggered_at?: string;
  stats?: {
    total: number;
    successful: number;
    failed: number;
  };
}

export function WebhookManager() {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
    description: '',
  });
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const eventTypes = [
    { value: 'application.*', label: 'All Application Events', description: 'Created, status changes, etc.' },
    { value: 'application.created', label: 'Application Created', description: 'When candidate applies' },
    { value: 'application.status_changed', label: 'Application Status Changed', description: 'Status updates' },
    { value: 'interview.*', label: 'All Interview Events', description: 'Scheduled, completed, etc.' },
    { value: 'interview.scheduled', label: 'Interview Scheduled', description: 'When interview is booked' },
    { value: 'interview.completed', label: 'Interview Completed', description: 'After interview ends' },
    { value: 'offer.*', label: 'All Offer Events', description: 'Sent, accepted, etc.' },
    { value: 'offer.sent', label: 'Offer Sent', description: 'When offer is sent to candidate' },
    { value: 'offer.accepted', label: 'Offer Accepted', description: 'Candidate accepts offer' },
    { value: 'video.*', label: 'All Video Events', description: 'Recordings, transcripts, etc.' },
    { value: 'video.recording.ready', label: 'Video Recording Ready', description: 'Recording available' },
    { value: 'video.transcript.completed', label: 'Transcript Completed', description: 'Transcript ready' },
  ];

  useEffect(() => {
    if (user?.id) fetchWebhooks();
  }, [user?.id]);

  async function fetchWebhooks() {
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/webhooks', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': user?.id || '' },
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWebhook() {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      toast.error('URL and at least one event are required');
      return;
    }

    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWebhook),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Webhook created!');
        setGeneratedSecret(data.webhook.secret);
        setShowSecret(true);
        setNewWebhook({ url: '', events: [], description: '' });
        setShowAddForm(false);
        fetchWebhooks();
      } else {
        toast.error(data.error || 'Failed to create webhook');
      }
    } catch (error) {
      toast.error('Failed to create webhook');
    }
  }

  async function handleDeleteWebhook(id: string) {
    if (!confirm('Delete this webhook? This cannot be undone.')) return;

    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/webhooks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': user?.id || '' },
      });

      if (response.ok) {
        toast.success('Webhook deleted');
        fetchWebhooks();
      } else {
        toast.error('Failed to delete webhook');
      }
    } catch (error) {
      toast.error('Failed to delete webhook');
    }
  }

  async function handleToggleWebhook(id: string, currentStatus: boolean) {
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/webhooks/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        toast.success(!currentStatus ? 'Webhook enabled' : 'Webhook disabled');
        fetchWebhooks();
      } else {
        toast.error('Failed to update webhook');
      }
    } catch (error) {
      toast.error('Failed to update webhook');
    }
  }

  async function handleTestWebhook(id: string) {
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/webhooks/${id}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': user?.id || '' },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Test webhook sent! Check your endpoint logs.');
      } else {
        toast.error(data.error || 'Failed to send test webhook');
      }
    } catch (error) {
      toast.error('Failed to send test webhook');
    }
  }

  function toggleEventSelection(eventType: string) {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventType)
        ? prev.events.filter(e => e !== eventType)
        : [...prev.events, eventType]
    }));
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading webhooks...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-purple-400" />
            Webhooks
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Receive real-time notifications when events occur
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-purple-500 to-pink-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Generated Secret Modal */}
      <AnimatePresence>
        {generatedSecret && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setGeneratedSecret(null)}
          >
            <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6">
                <h4 className="text-lg font-bold text-white mb-4">Webhook Secret</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Save this secret - it will only be shown once! Use it to verify webhook signatures.
                </p>
                <div className="bg-black/40 p-4 rounded-lg border border-white/10 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-sm text-green-400 break-all font-mono">
                      {showSecret ? generatedSecret : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="p-2 hover:bg-white/5 rounded"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedSecret);
                          toast.success('Secret copied!');
                        }}
                        className="p-2 hover:bg-white/5 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setGeneratedSecret(null)}
                  className="w-full"
                >
                  I've saved the secret
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Webhook Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Webhook URL *
                  </label>
                  <input
                    type="url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    placeholder="https://your-domain.com/api/webhooks/bpoc"
                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newWebhook.description}
                    onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                    placeholder="Production webhook for ShoreAgents integration"
                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Events to Subscribe * <span className="text-gray-500">(select at least one)</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {eventTypes.map((event) => (
                      <div
                        key={event.value}
                        onClick={() => toggleEventSelection(event.value)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          newWebhook.events.includes(event.value)
                            ? 'bg-purple-500/20 border-purple-500'
                            : 'bg-black/20 border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${
                            newWebhook.events.includes(event.value)
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-white/20'
                          }`}>
                            {newWebhook.events.includes(event.value) && (
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{event.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{event.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateWebhook}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    Create Webhook
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Webhook className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No webhooks configured yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Add a webhook to receive real-time notifications when events occur
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-sm text-purple-400 font-mono">{webhook.url}</code>
                      <a
                        href={webhook.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {webhook.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    {webhook.description && (
                      <p className="text-sm text-gray-400">{webhook.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleTestWebhook(webhook.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Test
                    </Button>
                    <Button
                      onClick={() => handleToggleWebhook(webhook.id, webhook.is_active)}
                      variant="outline"
                      size="sm"
                    >
                      {webhook.is_active ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400">
                      {webhook.stats?.successful || 0} successful
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-gray-400">
                      {webhook.stats?.failed || 0} failed
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">
                      Last triggered: {webhook.last_triggered_at
                        ? new Date(webhook.last_triggered_at).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs text-gray-500 mb-2">Subscribed Events:</div>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <Badge
                        key={event}
                        className="bg-purple-500/10 text-purple-300 border-purple-500/30"
                      >
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
