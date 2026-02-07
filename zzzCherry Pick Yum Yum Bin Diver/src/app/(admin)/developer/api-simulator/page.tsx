'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Code2, Webhook, Database, BookOpen, PlayCircle } from 'lucide-react';
import ApiTester from './components/ApiTester';
import WebhookMonitor from './components/WebhookMonitor';
import TestDataViewer from './components/TestDataViewer';
import Documentation from './components/Documentation';
import FlowSimulator from './components/FlowSimulator';

export default function ApiSimulatorPage() {
    const [activeTab, setActiveTab] = useState('flow-simulator');

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        API Testing Simulator
                    </h1>
                    <p className="text-slate-400">
                        Test and validate the enterprise API integration before deploying to production clients
                    </p>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5 bg-slate-900/50 border border-slate-800">
                        <TabsTrigger
                            value="flow-simulator"
                            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                        >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Flow Simulator
                        </TabsTrigger>
                        <TabsTrigger
                            value="api-tester"
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                        >
                            <Code2 className="w-4 h-4 mr-2" />
                            API Tester
                        </TabsTrigger>
                        <TabsTrigger
                            value="webhooks"
                            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
                        >
                            <Webhook className="w-4 h-4 mr-2" />
                            Webhooks
                        </TabsTrigger>
                        <TabsTrigger
                            value="test-data"
                            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
                        >
                            <Database className="w-4 h-4 mr-2" />
                            Test Data
                        </TabsTrigger>
                        <TabsTrigger
                            value="docs"
                            className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Docs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="flow-simulator" className="space-y-4">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">Visual Flow Simulator</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Walk through the complete recruitment lifecycle step-by-step
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FlowSimulator />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="api-tester" className="space-y-4">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">Interactive API Testing</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Test all V1 API endpoints with live requests and response viewing
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ApiTester />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="webhooks" className="space-y-4">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">Webhook Monitoring</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Monitor webhook deliveries in real-time and view request/response payloads
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <WebhookMonitor />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="test-data" className="space-y-4">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">Test Data Management</CardTitle>
                                <CardDescription className="text-slate-400">
                                    View and manage test agencies, jobs, applications, and other test data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TestDataViewer />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="docs" className="space-y-4">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">API Documentation</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Auto-generated documentation for all V1 API endpoints
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Documentation />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
