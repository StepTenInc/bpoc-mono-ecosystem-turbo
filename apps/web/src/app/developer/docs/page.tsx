'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Code, BookOpen, FileText, ChevronDown, ChevronRight,
  Building2, Briefcase, Calendar, Gift, Users, ArrowRight,
  Zap, Shield, Globe, FileCheck, Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import Header from '@/components/shared/layout/Header';

export default function PublicApiDocsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'examples'>('overview');
  const baseUrl = 'https://bpoc.io/api/v1';

  return (
    <div className="min-h-screen bg-[#0B0B0D] selection:bg-blue-500/20 selection:text-blue-200">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-[0.03] bg-center" />
      </div>

      <Header />

      <div className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-6">
          
          {/* Hero Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <Code className="w-4 h-4" />
              <span>Developer Documentation</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Build with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">BPOC API</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Integrate our powerful recruitment engine directly into your own platforms. 
              White-label the entire hiring experience for your clients.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/recruiter/signup">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8">
                  Get API Key <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="#docs">
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 rounded-full px-8">
                  View Reference
                </Button>
              </Link>
            </div>
          </div>

          <div id="docs" className="max-w-5xl mx-auto">
            
            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-lg w-fit mb-8 mx-auto md:mx-0">
              {[
                { id: 'overview', label: 'Overview', icon: BookOpen },
                { id: 'endpoints', label: 'All Endpoints', icon: Code },
                { id: 'examples', label: 'Code Examples', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    activeTab === tab.id ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <Zap className="w-8 h-8 text-yellow-400 mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">Real-time Sync</h3>
                      <p className="text-gray-400 text-sm">Webhooks ensure your platform is always up to date with candidate status changes.</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <Shield className="w-8 h-8 text-green-400 mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">Data Isolation</h3>
                      <p className="text-gray-400 text-sm">Client-scoped data ensures strict privacy between your different agency clients.</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <Globe className="w-8 h-8 text-blue-400 mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">White Label</h3>
                      <p className="text-gray-400 text-sm">Your branding, your domain. Our engine runs invisibly in the background.</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Quick Start</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 mb-2">Base URL:</p>
                        <code className="block p-3 bg-black/40 rounded-lg text-blue-400 font-mono">{baseUrl}</code>
                      </div>

                      <div>
                        <p className="text-gray-400 mb-2">Authentication:</p>
                        <code className="block p-3 bg-black/40 rounded-lg text-gray-300 font-mono">
                          X-API-Key: bpoc_sk_live_...
                        </code>
                      </div>

                      <div>
                        <p className="text-gray-400 mb-2">Test your connection:</p>
                        <pre className="p-3 bg-black/40 rounded-lg text-gray-300 font-mono text-sm overflow-x-auto">
{`curl -X GET "${baseUrl}/jobs" \\
  -H "X-API-Key: bpoc_sk_live_..."`}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Endpoints Tab */}
            {activeTab === 'endpoints' && (
              <div className="space-y-4">
                <EndpointSection icon={<Building2 />} title="Clients" description="Link your portal clients to BPOC">
                  <Endpoint
                    method="GET"
                    path="/clients"
                    description="List all your agency's clients"
                    response={`{ "clients": [{ "id": "...", "name": "StepTen Inc" }] }`}
                  />
                  <Endpoint
                    method="POST"
                    path="/clients/get-or-create"
                    description="Find existing client or create new one."
                    body={`{ "name": "StepTen Inc", "email": "contact@stepten.com" }`}
                    response={`{ "clientId": "b3244902...", "created": true }`}
                  />
                </EndpointSection>

                <EndpointSection icon={<Briefcase />} title="Jobs" description="Manage job listings">
                  <Endpoint
                    method="GET"
                    path="/jobs"
                    description="List all jobs"
                    params={[{ name: 'clientId', type: 'string', desc: 'Filter by client' }]}
                    response={`{ "jobs": [{ "id": "...", "title": "Senior React Dev" }] }`}
                  />
                  <Endpoint
                    method="POST"
                    path="/jobs/create"
                    description="Create a new job listing"
                    body={`{ "title": "Dev", "description": "...", "clientId": "..." }`}
                    response={`{ "success": true, "job": { "id": "..." } }`}
                  />
                </EndpointSection>

                <EndpointSection icon={<FileCheck />} title="Applications" description="Manage applications and track complete lifecycle">
                  <Endpoint
                    method="GET"
                    path="/applications"
                    description="List all applications"
                    params={[{ name: 'clientId', type: 'string', desc: 'Filter by client' }, { name: 'status', type: 'string', desc: 'Filter by status' }]}
                    response={`{ "applications": [{ "id": "...", "status": "shortlisted" }] }`}
                  />
                  <Endpoint
                    method="POST"
                    path="/applications"
                    description="Submit new application"
                    body={`{ "jobId": "...", "candidate": { "firstName": "John", "lastName": "Doe", "email": "john@example.com" } }`}
                    response={`{ "success": true, "applicationId": "..." }`}
                  />
                  <Endpoint
                    method="GET"
                    path="/applications/:id/card"
                    description="Get complete application card with pre-screens, timeline, interviews, offers"
                    response={`{ "application": { "id": "...", "prescreens": [...], "timeline": [...] } }`}
                  />
                  <Endpoint
                    method="PATCH"
                    path="/applications/:id/card/client-feedback"
                    description="Update client notes and rating"
                    body={`{ "notes": "...", "rating": 5 }`}
                    response={`{ "application": { "client_rating": 5 } }`}
                  />
                  <Endpoint
                    method="POST"
                    path="/applications/:id/card/reject"
                    description="Reject application with reason"
                    body={`{ "reason": "...", "rejected_by": "client" }`}
                    response={`{ "application": { "status": "rejected" } }`}
                  />
                  <Endpoint
                    method="PATCH"
                    path="/applications/:id/card/hired"
                    description="Update hired/started status"
                    body={`{ "contract_signed": true, "first_day_date": "2025-01-20", "started_status": "started" }`}
                    response={`{ "application": { "started_status": "started" } }`}
                  />
                  <Endpoint
                    method="GET"
                    path="/applications/:id/card/timeline"
                    description="Get activity timeline for application"
                    response={`{ "timeline": [{ "action_type": "prescreen_completed", "description": "..." }] }`}
                  />
                </EndpointSection>

                <EndpointSection icon={<Users />} title="Talent" description="Search and manage candidates">
                  <Endpoint
                    method="GET"
                    path="/candidates"
                    description="Search the talent pool"
                    params={[{ name: 'skills', type: 'string', desc: 'React, Node.js' }]}
                    response={`{ "candidates": [{ "id": "...", "firstName": "John" }] }`}
                  />
                </EndpointSection>
              </div>
            )}

            {/* Examples Tab */}
            {activeTab === 'examples' && (
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">JavaScript Integration</h3>
                    <pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-sm">
                      <code className="text-gray-300">{`const API_KEY = 'bpoc_sk_live_...';
const BASE_URL = '${baseUrl}';

// 1. Link Client
const client = await fetch(\`\${BASE_URL}/clients/get-or-create\`, {
  method: 'POST',
  headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'TechCorp', email: 'hr@techcorp.com' })
}).then(r => r.json());

console.log('Client Linked:', client.clientId);

// 2. Fetch Jobs for Client
const jobs = await fetch(\`\${BASE_URL}/jobs?clientId=\${client.clientId}\`, {
  headers: { 'X-API-Key': API_KEY }
}).then(r => r.json());

console.log('Active Jobs:', jobs.jobs);`}
                      </code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// Reused components for consistency
function EndpointSection({ icon, title, description, children }: { icon: any, title: string, description: string, children: any }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <Card className="bg-white/5 border-white/10">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="text-blue-400">{icon}</div>
          <div>
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="text-gray-500 text-sm">{description}</p>
          </div>
        </div>
        {expanded ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
      </button>
      {expanded && <CardContent className="pt-0 space-y-4 border-t border-white/10">{children}</CardContent>}
    </Card>
  );
}

function Endpoint({ method, path, description, params, body, response }: any) {
  const methodColors: any = {
    GET: 'bg-emerald-500/20 text-emerald-400',
    POST: 'bg-cyan-500/20 text-cyan-400',
    PATCH: 'bg-amber-500/20 text-amber-400',
  };
  return (
    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <Badge className={methodColors[method]}>{method}</Badge>
        <code className="text-white font-mono">{path}</code>
      </div>
      <p className="text-gray-400 text-sm mb-3">{description}</p>
      {params && (
        <div className="mb-3 text-sm">
          <p className="text-gray-500 text-xs uppercase mb-1">Query Params</p>
          {params.map((p: any) => (
            <div key={p.name}><code className="text-blue-400">{p.name}</code> <span className="text-gray-500">{p.desc}</span></div>
          ))}
        </div>
      )}
      {response && (
        <div>
          <p className="text-gray-500 text-xs uppercase mb-1">Response</p>
          <pre className="p-2 bg-black/40 rounded text-xs overflow-x-auto text-gray-300">{response}</pre>
        </div>
      )}
    </div>
  );
}

