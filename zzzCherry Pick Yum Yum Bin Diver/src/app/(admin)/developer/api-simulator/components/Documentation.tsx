'use client';

import { Badge } from '@/components/shared/ui/badge';
import { Card } from '@/components/shared/ui/card';
import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

const API_DOCS = [
    {
        category: 'Jobs',
        endpoints: [
            {
                method: 'GET',
                path: '/api/v1/jobs',
                description: 'List all active jobs for the agency',
                params: [
                    { name: 'status', type: 'string', desc: 'Filter by status (active/all)' },
                    { name: 'limit', type: 'number', desc: 'Number of results (max 100)' },
                    { name: 'offset', type: 'number', desc: 'Pagination offset' },
                ],
            },
            {
                method: 'POST',
                path: '/api/v1/jobs/create',
                description: 'Create a new job listing (Pro+ tier required)',
                body: {
                    title: 'string (required)',
                    description: 'string (required)',
                    requirements: 'string[]',
                    workArrangement: "'remote' | 'hybrid' | 'onsite'",
                    experienceLevel: "'entry_level' | 'mid_level' | 'senior_level'",
                },
            },
        ],
    },
    {
        category: 'Applications',
        endpoints: [
            {
                method: 'POST',
                path: '/api/v1/applications',
                description: 'Submit a job application',
                body: {
                    jobId: 'string (required)',
                    candidate: {
                        email: 'string (required)',
                        firstName: 'string',
                        lastName: 'string',
                    },
                },
            },
            {
                method: 'GET',
                path: '/api/v1/applications',
                description: 'List applications',
                params: [
                    { name: 'jobId', type: 'string', desc: 'Filter by job ID' },
                    { name: 'status', type: 'string', desc: 'Filter by status' },
                ],
            },
        ],
    },
];

export default function Documentation() {
    const copyExample = (endpoint: any) => {
        const example = `curl -X ${endpoint.method} \\
  https://bpoc.io${endpoint.path} \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json"${endpoint.body
                ? ` \\\n  -d '${JSON.stringify(endpoint.body, null, 2)}'`
                : ''
            }`;
        navigator.clipboard.writeText(example);
    };

    return (
        <div className="space-y-6">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <h3 className="text-cyan-400 font-semibold mb-2">Authentication</h3>
                <p className="text-slate-300 text-sm mb-2">
                    All API requests require an API key in the <code className="bg-slate-950 px-1 rounded">X-API-Key</code> header.
                </p>
                <code className="text-xs text-cyan-400 bg-slate-950 p-2 rounded block">
                    X-API-Key: bpoc_your_api_key_here
                </code>
            </div>

            {API_DOCS.map((category) => (
                <div key={category.category}>
                    <h2 className="text-2xl font-bold text-white mb-4">{category.category}</h2>
                    <div className="space-y-4">
                        {category.endpoints.map((endpoint, idx) => (
                            <Card key={idx} className="p-4 bg-slate-900/50 border-slate-800">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                                            {endpoint.method}
                                        </Badge>
                                        <code className="text-cyan-400 font-mono text-sm">{endpoint.path}</code>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyExample(endpoint)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy cURL
                                    </Button>
                                </div>

                                <p className="text-slate-300 text-sm mb-3">{endpoint.description}</p>

                                {endpoint.params && (
                                    <div className="mb-3">
                                        <h4 className="text-sm font-semibold text-white mb-2">Query Parameters</h4>
                                        <div className="space-y-1">
                                            {endpoint.params.map((param, pidx) => (
                                                <div key={pidx} className="text-sm">
                                                    <code className="text-cyan-400">{param.name}</code>
                                                    <span className="text-slate-500 mx-2">·</span>
                                                    <span className="text-slate-400">{param.type}</span>
                                                    <span className="text-slate-500 mx-2">·</span>
                                                    <span className="text-slate-300">{param.desc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {endpoint.body && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-white mb-2">Request Body</h4>
                                        <pre className="text-xs text-slate-300 bg-slate-950 p-3 rounded font-mono">
                                            {JSON.stringify(endpoint.body, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h3 className="text-purple-400 font-semibold mb-2">Need Help?</h3>
                <p className="text-slate-300 text-sm">
                    For full API documentation and integration guides, visit the{' '}
                    <a href="/developer/docs" className="text-cyan-400 hover:underline">
                        Developer Documentation
                    </a>
                </p>
            </div>
        </div>
    );
}
