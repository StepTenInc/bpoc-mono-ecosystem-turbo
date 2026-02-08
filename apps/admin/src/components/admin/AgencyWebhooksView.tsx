'use client';

import React, { useState, useEffect } from 'react';
import { Webhook, ExternalLink, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
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

interface AgencyWebhooksViewProps {
  agencyId: string;
}

export function AgencyWebhooksView({ agencyId }: AgencyWebhooksViewProps) {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agencyId && user?.id) fetchWebhooks();
  }, [agencyId, user?.id]);

  async function fetchWebhooks() {
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/admin/agencies/${agencyId}/webhooks`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': user?.id || '' },
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-purple-400" />
            Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-400">
            Loading webhooks...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (webhooks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-purple-400" />
            Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
            No webhooks configured
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Webhook className="w-5 h-5 text-purple-400" />
          Webhooks ({webhooks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="p-4 rounded-lg border border-white/10 bg-white/5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <code className="text-sm text-purple-400 font-mono break-all">
                    {webhook.url}
                  </code>
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

            <div className="pt-3 border-t border-white/10">
              <div className="text-xs text-gray-500 mb-2">Subscribed Events:</div>
              <div className="flex flex-wrap gap-2">
                {webhook.events.map((event) => (
                  <Badge
                    key={event}
                    className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs"
                  >
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
