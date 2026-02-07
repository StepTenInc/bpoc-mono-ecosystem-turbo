'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { RefreshCw, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/shared/ui/scroll-area';

export default function WebhookMonitor() {
    const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    const loadWebhookLogs = async () => {
        setLoading(true);
        try {
            // TODO: Create API endpoint to fetch webhook logs
            // For now, placeholder
            setWebhookLogs([]);
        } catch (error) {
            console.error('Failed to load webhook logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWebhookLogs();
    }, []);

    const receiverUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/developer/webhook-receiver`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white font-semibold">Webhook Receiver URL</h3>
                    <code className="text-sm text-cyan-400 bg-slate-950 p-2 rounded mt-2 block">
                        {receiverUrl}
                    </code>
                    <p className="text-slate-500 text-sm mt-2">
                        Configure this URL in your test agency webhooks to receive deliveries
                    </p>
                </div>
                <Button
                    onClick={loadWebhookLogs}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="border-slate-700"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div>
                <h3 className="text-white font-semibold mb-4">Recent Webhook Deliveries</h3>
                {webhookLogs.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/30 rounded-lg border border-slate-800">
                        <p className="text-slate-400">No webhook deliveries yet</p>
                        <p className="text-slate-500 text-sm mt-2">
                            Webhooks will appear here when they are delivered to the receiver endpoint
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[500px]">
                        <div className="space-y-2">
                            {webhookLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge>{log.event_type}</Badge>
                                            <Badge variant={log.response_status === 200 ? 'default' : 'destructive'}>
                                                {log.response_status || 'Pending'}
                                            </Badge>
                                            <span className="text-slate-500 text-sm">
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                        >
                                            {expandedLog === log.id ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>

                                    {expandedLog === log.id && (
                                        <div className="mt-4 pt-4 border-t border-slate-700">
                                            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                                                {JSON.stringify(log.payload, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
}
