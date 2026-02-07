'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Plus, Trash2, RefreshCw, Play } from 'lucide-react';
import { Card } from '@/components/shared/ui/card';

export default function TestDataViewer() {
    const [testAgencies, setTestAgencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newAgencyName, setNewAgencyName] = useState('');

    const loadTestAgencies = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/developer/test-agency');
            if (res.ok) {
                const data = await res.json();
                setTestAgencies(data.testAgencies || []);
            }
        } catch (error) {
            console.error('Failed to load test agencies:', error);
        } finally {
            setLoading(false);
        }
    };

    const createTestAgency = async () => {
        if (!newAgencyName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/developer/test-agency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newAgencyName }),
            });

            if (res.ok) {
                setNewAgencyName('');
                await loadTestAgencies();
            }
        } catch (error) {
            console.error('Failed to create test agency:', error);
        } finally {
            setCreating(false);
        }
    };

    const deleteTestAgency = async (id: string) => {
        if (!confirm('Delete this test agency? All related data will be removed.')) return;

        try {
            await fetch(`/api/developer/test-agency?id=${id}`, { method: 'DELETE' });
            await loadTestAgencies();
        } catch (error) {
            console.error('Failed to delete test agency:', error);
        }
    };

    useEffect(() => {
        loadTestAgencies();
    }, []);

    return (
        <div className="space-y-6">
            {/* Create New Test Agency */}
            <Card className="p-4 bg-slate-900/30 border-slate-800">
                <div className="flex gap-2">
                    <Input
                        value={newAgencyName}
                        onChange={(e) => setNewAgencyName(e.target.value)}
                        placeholder="New test agency name..."
                        className="bg-slate-950 border-slate-700 text-white"
                        onKeyPress={(e) => e.key === 'Enter' && createTestAgency()}
                    />
                    <Button
                        onClick={createTestAgency}
                        disabled={creating || !newAgencyName.trim()}
                        className="bg-cyan-500 hover:bg-cyan-600"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Test Agency
                    </Button>
                </div>
            </Card>

            {/* Test Agencies List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Test Agencies</h3>
                    <Button
                        onClick={loadTestAgencies}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="border-slate-700"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {testAgencies.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/30 rounded-lg border border-slate-800">
                        <p className="text-slate-400">No test agencies yet</p>
                        <p className="text-slate-500 text-sm mt-2">
                            Create a test agency to start testing the API
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {testAgencies.map((agency) => (
                            <Card key={agency.id} className="p-4 bg-slate-900/50 border-slate-800">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-white font-medium">{agency.name}</h4>
                                            <Badge variant={agency.is_active ? 'default' : 'secondary'}>
                                                {agency.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 text-sm">API Key:</span>
                                                <code className="text-xs text-cyan-400 bg-slate-950 px-2 py-1 rounded">
                                                    {agency.api_key}
                                                </code>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-sm">
                                                    Created: {new Date(agency.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => deleteTestAgency(agency.id)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
