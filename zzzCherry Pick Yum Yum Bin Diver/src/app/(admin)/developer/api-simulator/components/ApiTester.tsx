'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/shared/ui/select';
import { Badge } from '@/components/shared/ui/badge';
import { Send, Copy, Play, Trash2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/shared/ui/scroll-area';

interface RequestHistory {
    id: string;
    endpoint: string;
    method: string;
    status: number;
    timestamp: Date;
}

const API_ENDPOINTS = [
    { label: 'GET /api/v1/jobs', value: 'GET:/api/v1/jobs', method: 'GET' },
    { label: 'POST /api/v1/jobs/create', value: 'POST:/api/v1/jobs/create', method: 'POST' },
    { label: 'GET /api/v1/jobs/:id', value: 'GET:/api/v1/jobs/:id', method: 'GET' },
    { label: 'POST /api/v1/applications', value: 'POST:/api/v1/applications', method: 'POST' },
    { label: 'GET /api/v1/applications', value: 'GET:/api/v1/applications', method: 'GET' },
    { label: 'GET /api/v1/candidates', value: 'GET:/api/v1/candidates', method: 'GET' },
];

export default function ApiTester() {
    const [selectedEndpoint, setSelectedEndpoint] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [requestBody, setRequestBody] = useState('');
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<RequestHistory[]>([]);

    // Load API key from test agency (auto-populate)
    useEffect(() => {
        const loadTestAgencies = async () => {
            try {
                const res = await fetch('/api/developer/test-agency');
                if (res.ok) {
                    const data = await res.json();
                    if (data.testAgencies?.[0]?.api_key) {
                        setApiKey(data.testAgencies[0].api_key);
                    }
                }
            } catch (error) {
                console.error('Failed to load test agencies:', error);
            }
        };

        loadTestAgencies();
    }, []);

    // Load request body template when endpoint changes
    useEffect(() => {
        if (selectedEndpoint === 'POST:/api/v1/jobs/create') {
            setRequestBody(JSON.stringify({
                title: 'Customer Service Representative',
                description: 'We are seeking a talented CSR to join our team',
                requirements: ['2+ years experience', 'Excellent communication'],
                responsibilities: ['Handle customer inquiries', 'Resolve issues'],
                benefits: ['Health insurance', 'Work from home'],
                salaryMin: 25000,
                salaryMax: 35000,
                currency: 'PHP',
                workArrangement: 'remote',
                workType: 'full_time',
                shift: 'day',
                experienceLevel: 'mid_level',
            }, null, 2));
        } else if (selectedEndpoint === 'POST:/api/v1/applications') {
            setRequestBody(JSON.stringify({
                jobId: 'JOB_ID_HERE',
                candidate: {
                    email: 'test@example.com',
                    firstName: 'Juan',
                    lastName: 'Dela Cruz',
                },
                source: 'api_test',
            }, null, 2));
        } else {
            setRequestBody('');
        }
    }, [selectedEndpoint]);

    const handleSendRequest = async () => {
        if (!selectedEndpoint || !apiKey) {
            alert('Please select an endpoint and provide an API key');
            return;
        }

        setLoading(true);
        const [method, endpoint] = selectedEndpoint.split(':');

        try {
            const headers: Record<string, string> = {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            };

            const options: RequestInit = {
                method,
                headers,
            };

            if (method === 'POST' && requestBody) {
                options.body = requestBody;
            }

            const startTime = Date.now();
            const res = await fetch(endpoint, options);
            const duration = Date.now() - startTime;

            const resText = await res.text();
            let resData;
            try {
                resData = JSON.parse(resText);
            } catch {
                resData = resText;
            }

            setResponse({
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                body: resData,
                duration,
            });

            // Add to history
            setHistory(prev => [{
                id: Date.now().toString(),
                endpoint,
                method,
                status: res.status,
                timestamp: new Date(),
            }, ...prev.slice(0, 9)]);

        } catch (error: any) {
            setResponse({
                status: 0,
                statusText: 'Network Error',
                error: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const copyResponse = () => {
        navigator.clipboard.writeText(JSON.stringify(response?.body, null, 2));
    };

    return (
        <div className="space-y-6">
            {/* Request Builder */}
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label className="text-white">Endpoint</Label>
                    <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                        <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                            <SelectValue placeholder="Select an endpoint" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-700">
                            {API_ENDPOINTS.map(ep => (
                                <SelectItem key={ep.value} value={ep.value} className="text-white">
                                    <Badge variant="outline" className="mr-2">{ep.method}</Badge>
                                    {ep.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label className="text-white">API Key</Label>
                    <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="bpoc_test_..."
                        className="bg-slate-950 border-slate-700 text-white"
                    />
                </div>

                {selectedEndpoint?.startsWith('POST:') && (
                    <div className="grid gap-2">
                        <Label className="text-white">Request Body (JSON)</Label>
                        <Textarea
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            rows={12}
                            className="bg-slate-950 border-slate-700 text-white font-mono"
                            placeholder="{}"
                        />
                    </div>
                )}

                <Button
                    onClick={handleSendRequest}
                    disabled={loading || !selectedEndpoint}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Request
                        </>
                    )}
                </Button>
            </div>

            {/* Response Viewer */}
            {response && (
                <div className="border border-slate-700 rounded-lg p-4 bg-slate-950">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-white font-semibold">Response</h3>
                            <Badge
                                variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}
                            >
                                {response.status} {response.statusText}
                            </Badge>
                            {response.duration && (
                                <span className="text-slate-400 text-sm">{response.duration}ms</span>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={copyResponse}
                            className="text-slate-400 hover:text-white"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                        </Button>
                    </div>

                    <ScrollArea className="h-[400px]">
                        <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                            {JSON.stringify(response.body || response, null, 2)}
                        </pre>
                    </ScrollArea>
                </div>
            )}

            {/* Request History */}
            {history.length > 0 && (
                <div>
                    <h3 className="text-white font-semibold mb-2">Recent Requests</h3>
                    <div className="space-y-2">
                        {history.map(req => (
                            <div
                                key={req.id}
                                className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline">{req.method}</Badge>
                                    <span className="text-slate-300 text-sm font-mono">{req.endpoint}</span>
                                    <Badge variant={req.status >= 200 && req.status < 300 ? 'default' : 'destructive'}>
                                        {req.status}
                                    </Badge>
                                </div>
                                <span className="text-slate-500 text-xs">
                                    {req.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
