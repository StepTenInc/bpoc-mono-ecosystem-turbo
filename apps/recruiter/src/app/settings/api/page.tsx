'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Code, Key, Play, Copy, Check, RefreshCw, 
  ChevronDown, ChevronRight, ExternalLink, AlertCircle,
  Shield, Zap, Terminal, Eye, EyeOff, CheckCircle2,
  XCircle, Clock, Loader2, FileJson, Braces, BookOpen,
  Bell, FileText, Globe, ArrowRight, Building2, Briefcase,
  Calendar, Gift, Users, FileCheck, Activity, Video, UserCheck, Send
} from 'lucide-react';

// API Endpoint definitions with test configs
const API_ENDPOINTS = [
  {
    category: 'Jobs',
    icon: '💼',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/v1/jobs', 
        name: 'List Jobs',
        description: 'Get all jobs for your agency',
        tier: 'free',
        testable: true,
        sampleResponse: {
          jobs: [{ id: 'uuid', title: 'Senior Developer', status: 'active' }],
          total: 1
        }
      },
      { 
        method: 'GET', 
        path: '/api/v1/jobs/:id', 
        name: 'Get Job',
        description: 'Get details of a specific job',
        tier: 'free',
        testable: false,
        requiresId: true
      },
      { 
        method: 'POST', 
        path: '/api/v1/jobs/create', 
        name: 'Create Job',
        description: 'Create a new job posting',
        tier: 'pro',
        testable: false,
        sampleBody: {
          client_id: 'uuid',
          title: 'Senior Developer',
          description: 'Job description...',
          salary_min: 80000,
          salary_max: 120000
        }
      },
      { 
        method: 'PATCH', 
        path: '/api/v1/jobs/:id', 
        name: 'Update Job',
        description: 'Update job details',
        tier: 'pro',
        testable: false,
        requiresId: true
      },
    ]
  },
  {
    category: 'Clients',
    icon: '🏢',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/v1/clients', 
        name: 'List Clients',
        description: 'Get all clients linked to your agency',
        tier: 'free',
        testable: true
      },
      { 
        method: 'POST', 
        path: '/api/v1/clients/get-or-create', 
        name: 'Get or Create Client',
        description: 'Find existing client or create new one',
        tier: 'pro',
        testable: false
      },
    ]
  },
  {
    category: 'Applications',
    icon: '📋',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/v1/applications', 
        name: 'List Applications',
        description: 'Get all applications with filters',
        tier: 'free',
        testable: true
      },
      { 
        method: 'POST', 
        path: '/api/v1/applications', 
        name: 'Submit Application',
        description: 'Apply a candidate to a job',
        tier: 'free',
        testable: false,
        sampleBody: {
          job_id: 'uuid',
          candidate: {
            email: 'john@example.com',
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      },
      { 
        method: 'GET', 
        path: '/api/v1/applications/:id', 
        name: 'Get Application',
        description: 'Get specific application details',
        tier: 'free',
        testable: false,
        requiresId: true
      },
      { 
        method: 'POST', 
        path: '/api/v1/applications/:id/release', 
        name: 'Release to Client',
        description: 'Release application to client portal',
        tier: 'pro',
        testable: false,
        requiresId: true
      },
    ]
  },
  {
    category: 'Candidates',
    icon: '👤',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/v1/candidates', 
        name: 'List Candidates',
        description: 'Search your talent pool',
        tier: 'enterprise',
        testable: true
      },
      { 
        method: 'POST', 
        path: '/api/v1/candidates', 
        name: 'Create Candidate',
        description: 'Add new candidate to pool',
        tier: 'pro',
        testable: false,
        sampleBody: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          skills: ['React', 'Node.js']
        }
      },
      { 
        method: 'POST', 
        path: '/api/v1/candidates/bulk', 
        name: 'Bulk Import',
        description: 'Import up to 100 candidates',
        tier: 'enterprise',
        testable: false,
        sampleBody: {
          candidates: [
            { first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
          ],
          skip_duplicates: true
        }
      },
    ]
  },
  {
    category: 'Interviews',
    icon: '🎥',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/v1/interviews', 
        name: 'List Interviews',
        description: 'Get scheduled interviews',
        tier: 'pro',
        testable: true
      },
      { 
        method: 'POST', 
        path: '/api/v1/interviews', 
        name: 'Schedule Interview',
        description: 'Schedule new interview with video room',
        tier: 'pro',
        testable: false,
        sampleBody: {
          application_id: 'uuid',
          type: 'recruiter_prescreen',
          scheduledAt: '2024-02-15T10:00:00Z',
          enableVideo: true
        }
      },
      { 
        method: 'PATCH', 
        path: '/api/v1/interviews', 
        name: 'Update Outcome',
        description: 'Record interview outcome and rating',
        tier: 'pro',
        testable: false,
        sampleBody: {
          interviewId: 'uuid',
          outcome: 'passed',
          rating: 4,
          feedback: { communication: 4, technicalSkills: 5 }
        }
      },
    ]
  },
  {
    category: 'Offers',
    icon: '📝',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/v1/offers', 
        name: 'List Offers',
        description: 'Get all job offers',
        tier: 'enterprise',
        testable: true
      },
      { 
        method: 'POST', 
        path: '/api/v1/offers', 
        name: 'Create Offer',
        description: 'Send job offer to candidate',
        tier: 'enterprise',
        testable: false,
        sampleBody: {
          application_id: 'uuid',
          salary: 100000,
          currency: 'PHP',
          startDate: '2024-03-01'
        }
      },
    ]
  },
  {
    category: 'Analytics',
    icon: '📊',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/v1/analytics', 
        name: 'Get Analytics',
        description: 'Pipeline metrics and conversion rates',
        tier: 'pro',
        testable: true
      },
      { 
        method: 'GET', 
        path: '/api/v1/pipeline', 
        name: 'Pipeline View',
        description: 'Kanban-style pipeline breakdown',
        tier: 'free',
        testable: true
      },
    ]
  },
  {
    category: 'Video',
    icon: '📹',
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/v1/video/rooms', 
        name: 'List Rooms',
        description: 'Get video call rooms',
        tier: 'pro',
        testable: true
      },
      { 
        method: 'GET', 
        path: '/api/v1/video/recordings', 
        name: 'List Recordings',
        description: 'Get interview recordings',
        tier: 'pro',
        testable: true
      },
    ]
  },
];

const METHOD_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  POST: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  PUT: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  PATCH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  DELETE: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

const TIER_STYLES: Record<string, string> = {
  free: 'bg-gray-600/30 text-gray-300',
  pro: 'bg-blue-600/30 text-blue-300',
  enterprise: 'bg-purple-600/30 text-purple-300',
};

interface TestResult {
  path: string;
  status: 'success' | 'error' | 'testing';
  statusCode?: number;
  response?: any;
  time?: number;
  rateLimit?: { limit: string; remaining: string };
}

type TabType = 'test' | 'docs' | 'webhooks' | 'examples';

// Main content component that uses searchParams
function APIPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const currentTab = (searchParams.get('tab') as TabType) || 'test';
  
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(API_ENDPOINTS.map(c => c.category)));
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [requestBody, setRequestBody] = useState<string>('');
  const [activeResponseTab, setActiveResponseTab] = useState<'response' | 'code'>('response');
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const baseUrl = 'https://recruiter.bpoc.ai/api/v1';

  useEffect(() => {
    fetchApiKey();
  }, []);

  useEffect(() => {
    if (selectedEndpoint?.sampleBody) {
      setRequestBody(JSON.stringify(selectedEndpoint.sampleBody, null, 2));
    } else {
      setRequestBody('');
    }
  }, [selectedEndpoint]);

  const setActiveTab = (tab: TabType) => {
    router.push(`?tab=${tab}`, { scroll: false });
  };

  const fetchApiKey = async () => {
    try {
      const res = await fetch('/api/recruiter/agency/api-key');
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey || '');
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error);
    }
  };

  const regenerateApiKey = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/recruiter/agency/api-key', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey);
      }
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setIsRegenerating(false);
      setShowRegenerateConfirm(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const testEndpoint = async (endpoint: any) => {
    if (!apiKey) {
      alert('Please generate an API key first');
      return;
    }

    const path = endpoint.path;
    setTestResults(prev => ({ ...prev, [path]: { path, status: 'testing' } }));

    const startTime = Date.now();
    try {
      const url = `${window.location.origin}${path}`;
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const data = await res.json();
      const time = Date.now() - startTime;

      setTestResults(prev => ({
        ...prev,
        [path]: {
          path,
          status: res.ok ? 'success' : 'error',
          statusCode: res.status,
          response: data,
          time,
          rateLimit: {
            limit: res.headers.get('X-RateLimit-Limit') || '',
            remaining: res.headers.get('X-RateLimit-Remaining') || '',
          },
        },
      }));

      if (selectedEndpoint?.path === path) {
        setSelectedEndpoint({ ...endpoint, lastResult: data, lastStatus: res.status });
      }
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [path]: {
          path,
          status: 'error',
          response: { error: error.message },
          time: Date.now() - startTime,
        },
      }));
    }
  };

  const testAllEndpoints = async () => {
    const testable = API_ENDPOINTS.flatMap(c => c.endpoints.filter(e => e.testable));
    for (const endpoint of testable) {
      await testEndpoint(endpoint);
      await new Promise(r => setTimeout(r, 200));
    }
  };

  const generateCode = (endpoint: any, language: 'curl' | 'javascript' | 'python') => {
    const url = `https://recruiter.bpoc.ai${endpoint.path}`;
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method);
    const body = hasBody ? (requestBody || JSON.stringify(endpoint.sampleBody || {}, null, 2)) : '';

    if (language === 'curl') {
      let cmd = `curl -X ${endpoint.method} "${url}"`;
      cmd += ` \\\n  -H "Content-Type: application/json"`;
      cmd += ` \\\n  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}"`;
      if (hasBody && body) {
        cmd += ` \\\n  -d '${body.replace(/\n/g, '')}'`;
      }
      return cmd;
    }

    if (language === 'javascript') {
      return `const response = await fetch("${url}", {
  method: "${endpoint.method}",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey || 'YOUR_API_KEY'}"
  }${hasBody ? `,
  body: JSON.stringify(${body})` : ''}
});

const data = await response.json();
console.log(data);`;
    }

    if (language === 'python') {
      return `import requests

response = requests.${endpoint.method.toLowerCase()}(
    "${url}",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "${apiKey || 'YOUR_API_KEY'}"
    }${hasBody ? `,
    json=${body.replace(/"/g, "'")}` : ''}
)

data = response.json()
print(data)`;
    }

    return '';
  };

  const getStatusIcon = (path: string) => {
    const result = testResults[path];
    if (!result) return null;
    if (result.status === 'testing') return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    if (result.status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    return <XCircle className="h-4 w-4 text-red-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Terminal className="h-8 w-8 text-orange-500" />
              API & Developer Tools
            </h1>
            <p className="text-gray-400 mt-1">Test endpoints, read documentation, manage webhooks</p>
          </div>
        </div>

        {/* API Key Card - Always Visible */}
        <div className="bg-gradient-to-r from-orange-600/20 to-purple-600/20 border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Key className="h-6 w-6 text-orange-400" />
              <h2 className="text-xl font-semibold">Your API Key</h2>
            </div>
            <button
              onClick={() => setShowRegenerateConfirm(true)}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey || 'Click Regenerate to create API key'}
                readOnly
                className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 font-mono text-sm pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(apiKey, 'key')}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                >
                  {copied === 'key' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-3">
            Use header: <code className="text-orange-400 bg-black/30 px-2 py-0.5 rounded">X-API-Key: {apiKey ? apiKey.slice(0, 20) + '...' : 'your_key'}</code>
          </p>
        </div>

        {/* Main Tabs - Persist via URL */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg w-fit mb-8">
          {[
            { id: 'test' as TabType, label: 'Test', icon: Play },
            { id: 'docs' as TabType, label: 'Documentation', icon: BookOpen },
            { id: 'webhooks' as TabType, label: 'Webhooks', icon: Bell },
            { id: 'examples' as TabType, label: 'Examples', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                currentTab === tab.id 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Test Tab */}
        {currentTab === 'test' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={testAllEndpoints}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
              >
                <Play className="h-4 w-4" />
                Test All Endpoints
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Endpoints List */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold">Endpoints</h3>
                </div>
                <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                  {API_ENDPOINTS.map(category => (
                    <div key={category.category} className="border-b border-white/5 last:border-0">
                      <button
                        onClick={() => toggleCategory(category.category)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{category.icon}</span>
                          <span className="font-medium">{category.category}</span>
                          <span className="text-xs text-gray-500">({category.endpoints.length})</span>
                        </div>
                        {expandedCategories.has(category.category) 
                          ? <ChevronDown className="h-5 w-5 text-gray-400" />
                          : <ChevronRight className="h-5 w-5 text-gray-400" />
                        }
                      </button>
                      
                      {expandedCategories.has(category.category) && (
                        <div className="pb-2">
                          {category.endpoints.map((endpoint, idx) => {
                            const style = METHOD_STYLES[endpoint.method];
                            const isSelected = selectedEndpoint?.path === endpoint.path;
                            
                            return (
                              <div
                                key={idx}
                                className={`mx-2 mb-1 rounded-lg border transition-all ${
                                  isSelected 
                                    ? 'bg-orange-500/10 border-orange-500/50' 
                                    : 'bg-white/5 border-transparent hover:border-white/20'
                                }`}
                              >
                                <button
                                  onClick={() => setSelectedEndpoint(endpoint)}
                                  className="w-full flex items-center gap-3 p-3 text-left"
                                >
                                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${style.bg} ${style.text} ${style.border} border`}>
                                    {endpoint.method}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{endpoint.name}</p>
                                    <p className="text-xs text-gray-400 font-mono truncate">{endpoint.path}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(endpoint.path)}
                                    <span className={`text-xs px-2 py-0.5 rounded ${TIER_STYLES[endpoint.tier]}`}>
                                      {endpoint.tier}
                                    </span>
                                  </div>
                                </button>
                                
                                {endpoint.testable && (
                                  <div className="px-3 pb-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        testEndpoint(endpoint);
                                      }}
                                      disabled={testResults[endpoint.path]?.status === 'testing'}
                                      className="w-full flex items-center justify-center gap-2 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                      {testResults[endpoint.path]?.status === 'testing' ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Testing...</>
                                      ) : (
                                        <><Play className="h-4 w-4" /> Test Now</>
                                      )}
                                    </button>
                                    {testResults[endpoint.path]?.status === 'success' && (
                                      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                                          {testResults[endpoint.path].statusCode} OK
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {testResults[endpoint.path].time}ms
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Panel */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {selectedEndpoint ? (
                  <>
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${METHOD_STYLES[selectedEndpoint.method].bg} ${METHOD_STYLES[selectedEndpoint.method].text}`}>
                          {selectedEndpoint.method}
                        </span>
                        <span className="font-mono text-sm">{selectedEndpoint.path}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{selectedEndpoint.description}</p>
                    </div>

                    {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-400">Request Body</span>
                          <button
                            onClick={() => copyToClipboard(requestBody, 'body')}
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                          >
                            {copied === 'body' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            Copy
                          </button>
                        </div>
                        <textarea
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 font-mono text-sm resize-none"
                          placeholder="{}"
                        />
                      </div>
                    )}

                    <div className="flex border-b border-white/10">
                      <button
                        onClick={() => setActiveResponseTab('response')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          activeResponseTab === 'response' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <FileJson className="h-4 w-4 inline mr-2" />
                        Response
                      </button>
                      <button
                        onClick={() => setActiveResponseTab('code')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          activeResponseTab === 'code' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Braces className="h-4 w-4 inline mr-2" />
                        Code
                      </button>
                    </div>

                    {activeResponseTab === 'response' && (
                      <div className="p-4">
                        {testResults[selectedEndpoint.path] ? (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {testResults[selectedEndpoint.path].status === 'success' ? (
                                  <span className="flex items-center gap-2 text-green-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                    {testResults[selectedEndpoint.path].statusCode} Success
                                  </span>
                                ) : testResults[selectedEndpoint.path].status === 'testing' ? (
                                  <span className="flex items-center gap-2 text-blue-400">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Testing...
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2 text-red-400">
                                    <XCircle className="h-5 w-5" />
                                    {testResults[selectedEndpoint.path].statusCode || 'Error'}
                                  </span>
                                )}
                              </div>
                              {testResults[selectedEndpoint.path].time && (
                                <span className="text-sm text-gray-400">
                                  {testResults[selectedEndpoint.path].time}ms
                                </span>
                              )}
                            </div>
                            <pre className="bg-black/40 rounded-lg p-4 overflow-auto max-h-80 text-sm">
                              <code className="text-green-300">
                                {JSON.stringify(testResults[selectedEndpoint.path].response, null, 2)}
                              </code>
                            </pre>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-400">
                            <Play className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>Click "Test Now" to see the response</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeResponseTab === 'code' && (
                      <div className="p-4 space-y-4">
                        {(['curl', 'javascript', 'python'] as const).map((lang) => (
                          <div key={lang}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-400 capitalize">{lang}</span>
                              <button
                                onClick={() => copyToClipboard(generateCode(selectedEndpoint, lang), lang)}
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                              >
                                {copied === lang ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                Copy
                              </button>
                            </div>
                            <pre className="bg-black/40 rounded-lg p-3 overflow-x-auto text-xs">
                              <code className={lang === 'javascript' ? 'text-blue-300' : lang === 'python' ? 'text-yellow-300' : 'text-gray-300'}>
                                {generateCode(selectedEndpoint, lang)}
                              </code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <Code className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg">Select an endpoint</p>
                    <p className="text-sm">Click any endpoint to test it and see the response</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white">
                  {API_ENDPOINTS.reduce((sum, c) => sum + c.endpoints.length, 0)}
                </p>
                <p className="text-gray-400 text-sm">Total Endpoints</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-400">
                  {Object.values(testResults).filter(r => r.status === 'success').length}
                </p>
                <p className="text-gray-400 text-sm">Passing</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-400">
                  {Object.values(testResults).filter(r => r.status === 'error').length}
                </p>
                <p className="text-gray-400 text-sm">Failing</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">
                  {API_ENDPOINTS.flatMap(c => c.endpoints.filter(e => e.testable)).length}
                </p>
                <p className="text-gray-400 text-sm">Auto-Testable</p>
              </div>
            </div>
          </>
        )}

        {/* Documentation Tab */}
        {currentTab === 'docs' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <Zap className="w-8 h-8 text-yellow-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Real-time Webhooks</h3>
                <p className="text-gray-400 text-sm">Get instant notifications when candidates apply, interviews complete, or offers are accepted.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <Shield className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Data Isolation</h3>
                <p className="text-gray-400 text-sm">Client-scoped data ensures strict privacy between your different agency clients.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <Globe className="w-8 h-8 text-orange-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">White Label</h3>
                <p className="text-gray-400 text-sm">Your branding, your domain. Our engine runs invisibly in the background.</p>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Start</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 mb-2">Base URL:</p>
                  <code className="block p-3 bg-black/40 rounded-lg text-orange-400 font-mono">{baseUrl}</code>
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
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}"`}
                  </pre>
                </div>
                <div>
                  <p className="text-gray-400 mb-2">Rate Limits:</p>
                  <ul className="text-gray-300 text-sm list-disc list-inside">
                    <li>Standard: 100 requests/minute</li>
                    <li>Enterprise: 1000 requests/minute</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Recruitment Flow */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recruitment Flow</h3>
              <div className="flex flex-wrap gap-2 items-center text-sm">
                {[
                  '1. Create Client',
                  '2. Post Job',
                  '3. Receive Applications',
                  '4. Schedule Interviews',
                  '5. Send Offer',
                  '6. Placement'
                ].map((step, i) => (
                  <React.Fragment key={step}>
                    <span className={`px-3 py-1 rounded-full ${i === 5 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {step}
                    </span>
                    {i < 5 && <ArrowRight className="w-4 h-4 text-gray-500" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Full Endpoint Reference */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Endpoint Reference</h3>
              <div className="space-y-4">
                <EndpointSection icon={<Building2 className="w-5 h-5" />} title="Clients" description="Link your portal clients to BPOC">
                  <Endpoint method="GET" path="/clients" description="List all your agency's clients" />
                  <Endpoint method="POST" path="/clients/get-or-create" description="Find existing client or create new one"
                    body={`{ "name": "StepTen Inc", "email": "contact@stepten.com" }`}
                    response={`{ "clientId": "uuid", "created": true }`}
                  />
                </EndpointSection>

                <EndpointSection icon={<Briefcase className="w-5 h-5" />} title="Jobs" description="Manage job listings">
                  <Endpoint method="GET" path="/jobs" description="List all jobs"
                    params={[{ name: 'clientId', type: 'string', desc: 'Filter by client' }, { name: 'status', type: 'string', desc: 'active, paused, closed' }]}
                  />
                  <Endpoint method="GET" path="/jobs/:id" description="Get job details" />
                  <Endpoint method="POST" path="/jobs/create" description="Create a new job listing"
                    body={`{ "title": "Senior Developer", "description": "...", "clientId": "uuid", "salary_min": 50000, "salary_max": 80000 }`}
                  />
                  <Endpoint method="POST" path="/jobs/:id/approve" description="Approve a job for publishing" />
                </EndpointSection>

                <EndpointSection icon={<FileCheck className="w-5 h-5" />} title="Applications" description="Full application lifecycle management">
                  <Endpoint method="GET" path="/applications" description="List all applications"
                    params={[
                      { name: 'clientId', type: 'string', desc: 'Filter by client' },
                      { name: 'jobId', type: 'string', desc: 'Filter by job' },
                      { name: 'status', type: 'string', desc: 'submitted, shortlisted, interview, offer, hired, rejected' },
                    ]}
                  />
                  <Endpoint method="POST" path="/applications" description="Submit new application"
                    body={`{ "jobId": "uuid", "candidate": { "firstName": "John", "lastName": "Doe", "email": "john@example.com" } }`}
                  />
                  <Endpoint method="POST" path="/applications/:id/release" description="Release application to client portal" />
                </EndpointSection>

                <EndpointSection icon={<Users className="w-5 h-5" />} title="Candidates" description="Search and manage talent pool">
                  <Endpoint method="GET" path="/candidates" description="Search the talent pool"
                    params={[
                      { name: 'skills', type: 'string', desc: 'Comma-separated skills' },
                      { name: 'location', type: 'string', desc: 'City or region' },
                    ]}
                  />
                  <Endpoint method="GET" path="/candidates/:id" description="Get candidate profile" />
                </EndpointSection>

                <EndpointSection icon={<Calendar className="w-5 h-5" />} title="Interviews" description="Schedule and manage interviews">
                  <Endpoint method="GET" path="/interviews" description="List scheduled interviews" />
                  <Endpoint method="POST" path="/interviews" description="Schedule an interview"
                    body={`{ "applicationId": "uuid", "scheduledAt": "2025-02-15T10:00:00Z", "type": "video" }`}
                  />
                </EndpointSection>

                <EndpointSection icon={<Gift className="w-5 h-5" />} title="Offers" description="Create and manage job offers">
                  <Endpoint method="GET" path="/offers" description="List all offers" />
                  <Endpoint method="POST" path="/offers" description="Send a job offer"
                    body={`{ "applicationId": "uuid", "salary": 75000, "currency": "PHP", "startDate": "2025-03-01" }`}
                  />
                </EndpointSection>

                <EndpointSection icon={<Video className="w-5 h-5" />} title="Video" description="Video interviews and recordings">
                  <Endpoint method="POST" path="/video/rooms" description="Create a video room for interview"
                    body={`{ "applicationId": "uuid", "scheduledAt": "2025-02-15T10:00:00Z" }`}
                    response={`{ "roomId": "uuid", "joinUrl": "https://...", "hostToken": "..." }`}
                  />
                  <Endpoint method="GET" path="/video/recordings" description="List all recordings" />
                </EndpointSection>
              </div>
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {currentTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Webhook Setup</h3>
              <p className="text-gray-400 mb-4">Configure your webhook URL in Settings → Webhooks</p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 mb-2">Webhook Payload Format:</p>
                  <pre className="p-3 bg-black/40 rounded-lg text-gray-300 font-mono text-sm overflow-x-auto">
{`POST https://your-server.com/webhooks/bpoc
Content-Type: application/json
X-BPOC-Signature: sha256=...

{
  "event": "application.created",
  "timestamp": "2025-02-09T10:30:00Z",
  "data": { ... }
}`}
                  </pre>
                </div>

                <div>
                  <p className="text-gray-400 mb-2">Verify Signature (Node.js):</p>
                  <pre className="p-3 bg-black/40 rounded-lg text-gray-300 font-mono text-sm overflow-x-auto">
{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Available Events</h3>
              <div className="space-y-4">
                <WebhookEvent event="application.created" description="New application submitted"
                  payload={`{ "applicationId": "uuid", "jobId": "uuid", "candidateId": "uuid", "candidateName": "John Doe" }`}
                />
                <WebhookEvent event="application.status_changed" description="Application status updated"
                  payload={`{ "applicationId": "uuid", "oldStatus": "submitted", "newStatus": "shortlisted" }`}
                />
                <WebhookEvent event="interview.scheduled" description="Interview scheduled"
                  payload={`{ "interviewId": "uuid", "applicationId": "uuid", "scheduledAt": "2025-02-15T10:00:00Z" }`}
                />
                <WebhookEvent event="interview.completed" description="Interview finished"
                  payload={`{ "interviewId": "uuid", "applicationId": "uuid", "outcome": "positive", "rating": 4 }`}
                />
                <WebhookEvent event="offer.sent" description="Job offer sent to candidate"
                  payload={`{ "offerId": "uuid", "applicationId": "uuid", "salaryOffered": 75000 }`}
                />
                <WebhookEvent event="offer.accepted" description="Candidate accepted offer"
                  payload={`{ "offerId": "uuid", "applicationId": "uuid", "acceptedAt": "2025-02-10T14:00:00Z" }`}
                />
                <WebhookEvent event="offer.rejected" description="Candidate rejected offer"
                  payload={`{ "offerId": "uuid", "applicationId": "uuid", "reason": "Accepted another offer" }`}
                />
                <WebhookEvent event="placement.created" description="Candidate hired and placed"
                  payload={`{ "placementId": "uuid", "applicationId": "uuid", "startDate": "2025-03-01" }`}
                />
                <WebhookEvent event="video.recording.ready" description="Video recording processed"
                  payload={`{ "recordingId": "uuid", "roomId": "uuid", "playbackUrl": "https://..." }`}
                />
                <WebhookEvent event="video.transcript.completed" description="AI transcript ready"
                  payload={`{ "transcriptId": "uuid", "recordingId": "uuid", "summary": "Candidate demonstrated strong..." }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Examples Tab */}
        {currentTab === 'examples' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Complete Integration Flow (JavaScript)</h3>
              <pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-sm">
                <code className="text-gray-300">{`const API_KEY = '${apiKey || 'bpoc_sk_live_...'}';
const BASE_URL = '${baseUrl}';

const api = (path, options = {}) => fetch(\`\${BASE_URL}\${path}\`, {
  ...options,
  headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json', ...options.headers }
}).then(r => r.json());

// 1. Create/Link Client
const { clientId } = await api('/clients/get-or-create', {
  method: 'POST',
  body: JSON.stringify({ name: 'TechCorp', email: 'hr@techcorp.com' })
});

// 2. Create Job
const { job } = await api('/jobs/create', {
  method: 'POST',
  body: JSON.stringify({
    clientId,
    title: 'Senior React Developer',
    description: 'We are looking for...',
    salary_min: 60000,
    salary_max: 90000,
    employment_type: 'full_time'
  })
});

// 3. Submit Application
const { applicationId } = await api('/applications', {
  method: 'POST',
  body: JSON.stringify({
    jobId: job.id,
    candidate: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+63 912 345 6789'
    }
  })
});

// 4. Schedule Interview
await api('/interviews', {
  method: 'POST',
  body: JSON.stringify({
    applicationId,
    scheduledAt: '2025-02-20T10:00:00Z',
    type: 'video'
  })
});

// 5. Send Offer
await api('/offers', {
  method: 'POST',
  body: JSON.stringify({
    applicationId,
    salary: 75000,
    currency: 'PHP',
    startDate: '2025-03-01',
    benefits: ['HMO', '13th Month', 'Paid Leave']
  })
});

console.log('Full recruitment flow complete!');`}
                </code>
              </pre>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Webhook Handler (Express.js)</h3>
              <pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-sm">
                <code className="text-gray-300">{`const express = require('express');
const crypto = require('crypto');

const app = express();
const WEBHOOK_SECRET = process.env.BPOC_WEBHOOK_SECRET;

app.post('/webhooks/bpoc', express.json(), (req, res) => {
  // Verify signature
  const signature = req.headers['x-bpoc-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== expected) {
    return res.status(401).send('Invalid signature');
  }

  const { event, data } = req.body;

  switch (event) {
    case 'application.created':
      console.log('New application:', data.candidateName);
      // Update your CRM, send notification, etc.
      break;
    
    case 'offer.accepted':
      console.log('Offer accepted!', data.offerId);
      // Trigger onboarding workflow
      break;
    
    case 'placement.created':
      console.log('New placement:', data.placementId);
      // Update billing, create employee record
      break;
  }

  res.sendStatus(200);
});

app.listen(3000);`}
                </code>
              </pre>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Embed Job Board</h3>
              <pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-sm">
                <code className="text-gray-300">{`<!-- Add to your client's career page -->
<div id="bpoc-jobs"></div>

<script>
  (function() {
    const API_KEY = 'bpoc_pk_live_...'; // Public key (safe for frontend)
    const CLIENT_ID = 'your-client-uuid';
    
    fetch('${baseUrl}/embed/jobs?clientId=' + CLIENT_ID, {
      headers: { 'X-API-Key': API_KEY }
    })
    .then(r => r.text())
    .then(html => {
      document.getElementById('bpoc-jobs').innerHTML = html;
    });
  })();
</script>`}
                </code>
              </pre>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Python SDK Example</h3>
              <pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-sm">
                <code className="text-yellow-300">{`import requests

class BPOCClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = '${baseUrl}'
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def list_jobs(self, client_id=None, status=None):
        params = {}
        if client_id:
            params['clientId'] = client_id
        if status:
            params['status'] = status
        return requests.get(
            f'{self.base_url}/jobs',
            headers=self.headers,
            params=params
        ).json()
    
    def create_application(self, job_id, candidate):
        return requests.post(
            f'{self.base_url}/applications',
            headers=self.headers,
            json={'jobId': job_id, 'candidate': candidate}
        ).json()
    
    def schedule_interview(self, application_id, scheduled_at, interview_type='video'):
        return requests.post(
            f'{self.base_url}/interviews',
            headers=self.headers,
            json={
                'applicationId': application_id,
                'scheduledAt': scheduled_at,
                'type': interview_type
            }
        ).json()

# Usage
client = BPOCClient('${apiKey || 'your_api_key'}')
jobs = client.list_jobs(status='active')
print(f"Found {len(jobs['jobs'])} active jobs")`}
                </code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Regenerate Confirmation Modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-500/20 rounded-full">
                <AlertCircle className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Regenerate API Key?</h3>
            </div>
            <p className="text-gray-400 mb-6">
              This will invalidate your current API key immediately. Any integrations using the old key will stop working.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                disabled={isRegenerating}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={regenerateApiKey}
                disabled={isRegenerating}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Yes, Regenerate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Endpoint Section Component
function EndpointSection({ icon, title, description, children }: { icon: React.ReactNode, title: string, description: string, children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="bg-black/20 border border-white/10 rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="text-orange-400">{icon}</div>
          <div>
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="text-gray-500 text-sm">{description}</p>
          </div>
        </div>
        {expanded ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
      </button>
      {expanded && <div className="p-4 pt-0 space-y-3 border-t border-white/10">{children}</div>}
    </div>
  );
}

// Endpoint Component
function Endpoint({ method, path, description, params, body, response }: {
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; desc: string }[];
  body?: string;
  response?: string;
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400',
    POST: 'bg-blue-500/20 text-blue-400',
    PATCH: 'bg-orange-500/20 text-orange-400',
    DELETE: 'bg-red-500/20 text-red-400',
  };
  return (
    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${methodColors[method]}`}>{method}</span>
        <code className="text-white font-mono text-sm">{path}</code>
      </div>
      <p className="text-gray-400 text-sm mb-3">{description}</p>
      {params && (
        <div className="mb-3 text-sm">
          <p className="text-gray-500 text-xs uppercase mb-1">Query Params</p>
          {params.map((p) => (
            <div key={p.name} className="text-gray-300">
              <code className="text-orange-400">{p.name}</code>
              <span className="text-gray-500 mx-1">({p.type})</span>
              <span className="text-gray-400">{p.desc}</span>
            </div>
          ))}
        </div>
      )}
      {body && (
        <div className="mb-3">
          <p className="text-gray-500 text-xs uppercase mb-1">Request Body</p>
          <pre className="p-2 bg-black/40 rounded text-xs overflow-x-auto text-cyan-300">{body}</pre>
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

// Webhook Event Component
function WebhookEvent({ event, description, payload }: { event: string, description: string, payload: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between text-left">
        <div>
          <code className="text-orange-400 font-mono">{event}</code>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
        {expanded ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
      </button>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-gray-500 text-xs uppercase mb-1">Payload</p>
          <pre className="p-2 bg-black/40 rounded text-xs overflow-x-auto text-gray-300">{payload}</pre>
        </div>
      )}
    </div>
  );
}

// Main export with Suspense boundary for useSearchParams
export default function APIPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <APIPageContent />
    </Suspense>
  );
}
