'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, Copy, Eye, EyeOff, RefreshCw, CheckCircle, Loader2, 
  Shield, ChevronDown, ChevronRight, Download, Rocket, AlertTriangle,
  Building2, Users, Briefcase, FileText, Calendar, Gift, Code, BookOpen,
  Video, Settings, UserCog, Mic, FileVideo, FileAudio
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/shared/ui/toast';
import { WebhookManager } from '@/components/recruiter/WebhookManager';

export default function ApiPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiEnabled, setApiEnabled] = useState(false);
  const [apiTier, setApiTier] = useState('enterprise');
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'examples' | 'guide' | 'webhooks'>('overview');

  useEffect(() => {
    if (user?.id) fetchApiKey();
  }, [user?.id]);

  const fetchApiKey = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/api-key', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': user?.id || '' }
      });
      const data = await response.json();
      if (response.ok) {
        setApiKey(data.apiKey);
        setApiEnabled(data.apiEnabled);
        setApiTier(data.apiTier || 'free');
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/api-key', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': user?.id || '' }
      });
      const data = await response.json();
      if (response.ok) {
        setApiKey(data.apiKey);
        setApiEnabled(true);
        toast.success('API key generated!');
      }
    } catch (error) {
      toast.error('Failed to generate API key');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleApi = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/api-key/toggle', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-user-id': user?.id || '' }
      });
      const data = await response.json();
      if (response.ok) {
        setApiEnabled(data.apiEnabled);
        toast.success(data.apiEnabled ? 'API enabled' : 'API disabled');
      }
    } catch (error) {
      toast.error('Failed');
    }
  };

  const maskedKey = apiKey ? `${apiKey.substring(0, 15)}${'•'.repeat(25)}` : null;
  const baseUrl = 'https://bpoc.io/api/v1';

  const handleDownloadGuide = () => {
    const guideContent = `
BPOC API Integration Guide
===========================
Generated: ${new Date().toLocaleDateString()}
Version: 1.0

API CREDENTIALS
---------------
Base URL: ${baseUrl}
API Key: ${apiKey || 'Generate your API key first'}

All requests MUST include this header:
X-API-Key: ${apiKey || 'your-api-key'}


CRITICAL: HOW CLIENT IDs WORK
-----------------------------
BPOC does NOT auto-create clients. You MUST:

1. Call POST /clients/get-or-create with the client's company name/email
2. Store the returned clientId in your database
3. Use that clientId for all future requests (jobs, applications, etc.)

⚠️ If you pass a clientId that doesn't exist or doesn't belong to your agency,
   you'll get 400/404 errors.


========================================
INTERVIEW TYPES - IMPORTANT!
========================================

When scheduling interviews or creating video calls via API, use these types:

⭐ YOUR INTERVIEWS (Use these when YOUR team interviews candidates):
   - client_round_1   → Your first interview with candidate
   - client_round_2   → Your second interview
   - client_final     → Your final interview
   - client_general   → Ad-hoc call with candidate

🔵 BPOC INTERNAL (When BPOC recruiters interview candidates):
   - recruiter_prescreen → Initial BPOC screening
   - recruiter_round_1   → BPOC Round 1
   - recruiter_round_2   → BPOC Round 2
   - recruiter_round_3   → BPOC Round 3
   - recruiter_offer     → BPOC Offer discussion
   - recruiter_general   → BPOC ad-hoc call


========================================
TIMEZONE HANDLING
========================================

When scheduling interviews, ALWAYS send your timezone:

POST /interviews
{
  "applicationId": "xxx",
  "type": "client_round_1",              // Use client_ types!
  "scheduledAt": "2025-01-15T08:30:00Z", // ISO 8601 UTC
  "clientTimezone": "Australia/Sydney",  // YOUR timezone!
  "notes": "First interview"
}

Response includes BOTH times for clarity:
{
  "scheduledAt": "2025-01-15T08:30:00.000Z",        // UTC
  "clientTime": "Jan 15, 2025, 8:30 AM (Sydney)",  // YOUR time
  "clientTimezone": "Australia/Sydney",
  "phTime": "Jan 15, 2025, 5:30 AM (PHT)"          // BPOC time
}


STEP 1: CREATE THE API CLIENT UTILITY
-------------------------------------
Create a file lib/bpoc-api.ts (or similar):

const BPOC_BASE_URL = '${baseUrl}';
const BPOC_API_KEY = '${apiKey || 'your-api-key'}';

export async function bpocApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(\`\${BPOC_BASE_URL}\${endpoint}\`, {
    ...options,
    headers: {
      'X-API-Key': BPOC_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('BPOC API Error:', data);
    throw new Error(data.error || \`API Error: \${response.status}\`);
  }
  
  return data;
}

// Get or create a client in BPOC
export async function getOrCreateClient(clientData: {
  name: string;
  email?: string;
  industry?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  return bpocApi('/clients/get-or-create', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
}

// List all clients
export async function listClients() {
  return bpocApi('/clients');
}

// Create a new job listing
export async function createJob(jobData: {
  title: string;
  description: string;
  clientId: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  workArrangement?: 'remote' | 'onsite' | 'hybrid';
  workType?: 'full_time' | 'part_time' | 'contract';
  shift?: 'day' | 'night' | 'flexible';
  experienceLevel?: 'entry_level' | 'mid_level' | 'senior_level';
  skills?: string[];
}) {
  return bpocApi('/jobs/create', {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
}

// Schedule YOUR interview (use client_ types!)
export async function scheduleInterview(data: {
  applicationId: string;
  type: 'client_round_1' | 'client_round_2' | 'client_final' | 'client_general';
  scheduledAt: string;       // ISO 8601
  clientTimezone: string;    // e.g., 'Australia/Sydney'
  notes?: string;
}) {
  return bpocApi('/interviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Create video room for YOUR interview
export async function createVideoRoom(data: {
  applicationId: string;
  callType: 'client_round_1' | 'client_round_2' | 'client_final' | 'client_general';
  scheduledFor?: string;
  enableRecording?: boolean;
}) {
  return bpocApi('/video/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// List jobs
export async function listJobs(clientId?: string) {
  const params = clientId ? \`?clientId=\${clientId}\` : '';
  return bpocApi(\`/jobs\${params}\`);
}


STEP 2: JOB REQUEST FORM HANDLER EXAMPLE
----------------------------------------
When a client submits a job request on your portal:

import { getOrCreateClient, createJob } from '@/lib/bpoc-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. First, get or create the client in BPOC
    const clientResult = await getOrCreateClient({
      name: body.companyName,
      email: body.companyEmail,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
    });
    
    console.log('BPOC Client:', clientResult);
    // { clientId: "uuid...", companyId: "uuid...", name: "...", created: true/false }
    
    // 2. Now create the job using that clientId
    const jobResult = await createJob({
      clientId: clientResult.clientId,  // <-- REQUIRED
      title: body.jobTitle,
      description: body.jobDescription,
      requirements: body.requirements || [],
      responsibilities: body.responsibilities || [],
      salaryMin: body.salaryMin,
      salaryMax: body.salaryMax,
      currency: body.currency || 'PHP',
      workArrangement: body.workArrangement || 'remote',
      workType: body.workType || 'full_time',
      experienceLevel: body.experienceLevel || 'mid_level',
    });
    
    return Response.json({
      success: true,
      bpocClientId: clientResult.clientId,
      bpocJobId: jobResult.job.id,
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}


STEP 3: DATABASE STORAGE (RECOMMENDED)
--------------------------------------
Store the BPOC clientId in your local database so you don't call
/clients/get-or-create every time:

async function getClientBpocId(localClientId: string) {
  // 1. Check if we already have the BPOC ID stored
  const localClient = await db.clients.findUnique({ where: { id: localClientId } });
  
  if (localClient.bpoc_client_id) {
    return localClient.bpoc_client_id;
  }
  
  // 2. If not, call BPOC to get/create and store it
  const bpocResult = await getOrCreateClient({
    name: localClient.company_name,
    email: localClient.email,
  });
  
  // 3. Save for future use
  await db.clients.update({
    where: { id: localClientId },
    data: { bpoc_client_id: bpocResult.clientId },
  });
  
  return bpocResult.clientId;
}


TESTING WITH CURL
-----------------

# 1. List existing clients
curl -X GET "${baseUrl}/clients" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}"

# 2. Create/get a test client
curl -X POST "${baseUrl}/clients/get-or-create" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test Company", "email": "test@testcompany.com"}'

# 3. Create a job (use the clientId from step 2)
curl -X POST "${baseUrl}/jobs/create" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientId": "CLIENT_ID_FROM_STEP_2",
    "title": "Virtual Assistant",
    "description": "Looking for an experienced VA..."
  }'

# 4. Schedule YOUR interview (use client_ types!)
curl -X POST "${baseUrl}/interviews" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "applicationId": "APP_ID",
    "type": "client_round_1",
    "scheduledAt": "2025-01-20T08:30:00Z",
    "clientTimezone": "Australia/Sydney"
  }'


COMMON ERRORS & FIXES
---------------------
| Error                    | Cause                                      | Fix                                        |
|--------------------------|--------------------------------------------|--------------------------------------------|
| 401 Missing API key      | No X-API-Key header                        | Add the header to every request            |
| 401 Invalid API key      | Wrong key                                  | Use exact key from this guide              |
| 400 No clients found     | Calling /jobs/create without client first  | Call /clients/get-or-create first          |
| 400 Invalid clientId     | clientId doesn't belong to your agency     | Get correct ID from /clients/get-or-create |
| 404 Client not found     | Wrong clientId in query params             | Verify ID exists via /clients              |
| 404 Job not found        | Job ID doesn't exist or wrong agency       | Check job belongs to your clients          |


SUMMARY FLOW
------------
Your Portal → Client submits job request
     │
     ▼
Call POST /clients/get-or-create
(get BPOC clientId, store it)
     │
     ▼
Call POST /jobs/create
(with clientId from above)
     │
     ▼
Job appears in BPOC Recruiter Dashboard


API ENDPOINTS REFERENCE
-----------------------

Clients:
  GET  /clients              - List all clients
  POST /clients/get-or-create - Find or create client (returns clientId)

Jobs:
  GET   /jobs                - List jobs (optional: ?clientId=xxx)
  GET   /jobs/:id            - Get single job
  POST  /jobs/create         - Create job (requires clientId)
  PATCH /jobs/:id            - Update job

Applications:
  GET   /applications              - List applications (supports mode parameter)
  GET   /applications/:id          - Get application details
  POST  /applications              - Submit application
  PATCH /applications/:id          - Update status
  POST  /applications/:id/release  - NEW: Release application to client (Recruiter Gate)
  POST  /applications/:id/send-back - NEW: Send application back to recruiter (Recruiter Gate)

Interviews:
  GET   /interviews          - List interviews (includes clientTime + phTime)
  POST  /interviews          - Schedule interview (send clientTimezone!)
  PATCH /interviews          - Update outcome

Offers:
  GET  /offers               - List offers
  POST /offers               - Send offer

VIDEO INTERVIEWS (Pro+ Plan):
  GET    /video/rooms        - List video rooms
  POST   /video/rooms        - Create video room (returns host & participant join URLs)
  GET    /video/rooms/:id    - Get room with fresh join tokens
  PATCH  /video/rooms/:id    - Update status/outcome/notes
  DELETE /video/rooms/:id    - Delete room (if not started)

  GET  /video/recordings     - List recordings
  GET  /video/recordings/:id - Get recording with download link
  POST /video/recordings/:id - Trigger transcription (Enterprise)

  GET  /video/transcripts/:id - Get full transcript with AI summary (Enterprise)

Talent Pool (Enterprise):
  GET  /candidates           - Search pre-screened candidates
  GET  /candidates/:id/complete - Get COMPLETE candidate data (Candidate Truth API)

Public Embed:
  GET  /embed/jobs?agency=slug - Get jobs for embedding (no auth)


VIDEO INTERVIEW WORKFLOW
------------------------
1. Create video room (use client_ types for YOUR interviews):
   POST /video/rooms
   { "applicationId": "xxx", "callType": "client_round_1" }

2. Response includes join URLs:
   - host.joinUrl → For YOUR team (embed in your portal)
   - participant.joinUrl → Send to candidate via email

3. Everyone joins via their URL (no app download needed)

4. After call, update outcome:
   PATCH /video/rooms/:id
   { "status": "ended", "outcome": "successful", "notes": "Great candidate!" }

5. Access recording:
   GET /video/recordings/:id
   → Returns temporary download link

6. (Enterprise) Get AI transcript:
   POST /video/recordings/:id { "action": "transcribe" }
   GET /video/transcripts/:id
   → Returns full text + AI summary + key points


INTERVIEW/CALL TYPES QUICK REFERENCE
------------------------------------

⭐ YOUR TEAM'S INTERVIEWS (use these via API):
   client_round_1, client_round_2, client_final, client_general

🔵 BPOC INTERNAL:
   recruiter_prescreen, recruiter_round_1, recruiter_round_2, 
   recruiter_round_3, recruiter_offer, recruiter_general

CALL OUTCOMES:
   successful, no_show, rescheduled, cancelled, needs_followup

INTERVIEW OUTCOMES:
   passed, failed, pending_decision, needs_followup
    `.trim();

    // Create and download the file
    const blob = new Blob([guideContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BPOC_API_Integration_Guide.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Guide downloaded!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">API Integration</h1>
        <p className="text-gray-400 mt-1">Connect your agency portal to BPOC</p>
      </div>

      {/* API Key Card */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Your API Key</h2>
                <p className="text-gray-400 text-sm">Required in all API requests</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={apiEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                {apiEnabled ? 'Active' : 'Disabled'}
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-400">{apiTier}</Badge>
            </div>
          </div>

          {apiKey ? (
            <>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-black/40 border border-white/10 font-mono">
                <code className="flex-1 text-orange-400 text-sm break-all">
                  {showKey ? apiKey : maskedKey}
                </code>
                <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)} className="text-gray-400 hover:text-white">
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(apiKey)} className="text-gray-400 hover:text-white">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={handleGenerateKey} disabled={generating} className="border-white/10">
                  {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Regenerate
                </Button>
                <Button variant="outline" onClick={handleToggleApi}
                  className={apiEnabled ? 'border-red-500/30 text-red-400' : 'border-emerald-500/30 text-emerald-400'}>
                  <Shield className="h-4 w-4 mr-2" />
                  {apiEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={handleGenerateKey} disabled={generating} className="bg-gradient-to-r from-orange-500 to-amber-600">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
              Generate API Key
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-lg w-fit flex-wrap">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'guide', label: 'Setup Guide', icon: Rocket },
          { id: 'webhooks', label: 'Webhooks', icon: Mic },
          { id: 'endpoints', label: 'All Endpoints', icon: Code },
          { id: 'examples', label: 'Code Examples', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
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
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Start</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 mb-2">Base URL:</p>
                  <code className="block p-3 bg-black/40 rounded-lg text-orange-400 font-mono">{baseUrl}</code>
                </div>

                <div>
                  <p className="text-gray-400 mb-2">Authentication (required on all requests):</p>
                  <code className="block p-3 bg-black/40 rounded-lg text-gray-300 font-mono">
                    X-API-Key: {apiKey || 'your-api-key'}
                  </code>
                </div>

                <div>
                  <p className="text-gray-400 mb-2">Test your connection:</p>
                  <pre className="p-3 bg-black/40 rounded-lg text-gray-300 font-mono text-sm overflow-x-auto">
{`curl -X GET "${baseUrl}/jobs" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}"`}
                  </pre>
                </div>

                <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/10">
                  <p className="text-orange-300 font-semibold text-sm">Important: clients are not auto-created</p>
                  <p className="text-orange-100/80 text-sm mt-1">
                    Always call <code className="bg-black/30 px-1 rounded">POST /clients/get-or-create</code> first and store the returned <code className="bg-black/30 px-1 rounded">clientId</code>.
                    Passing a <code className="bg-black/30 px-1 rounded">clientId</code> that is not linked to your agency returns 400/404, and <code className="bg-black/30 px-1 rounded">/jobs/create</code> will fail if your agency has no clients yet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">1</div>
                    <h4 className="text-white font-semibold">Link Clients</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Call <code className="bg-black/40 px-1 rounded">/clients/get-or-create</code> to get a BPOC Client ID. Store this in your database.</p>
                </div>

                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">2</div>
                    <h4 className="text-white font-semibold">Post Jobs</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Create jobs via <code className="bg-black/40 px-1 rounded">/jobs/create</code> with the clientId.</p>
                </div>

                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">3</div>
                    <h4 className="text-white font-semibold">Review Applications</h4>
                  </div>
                  <p className="text-gray-400 text-sm">List applications via <code className="bg-black/40 px-1 rounded">/applications</code> and update status.</p>
                </div>

                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">4</div>
                    <h4 className="text-white font-semibold">Schedule Interviews</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Create interviews via <code className="bg-black/40 px-1 rounded">/interviews</code> for screening.</p>
                </div>

                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">5</div>
                    <h4 className="text-white font-semibold">Video Calls</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Create rooms via <code className="bg-black/40 px-1 rounded">/video/rooms</code>. Send join URLs to participants!</p>
                </div>

                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">6</div>
                    <h4 className="text-white font-semibold">Send Offers</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Send offers via <code className="bg-black/40 px-1 rounded">/offers</code> and complete the hire!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Values Reference */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">📋 Field Values Reference</h3>
              <p className="text-gray-400 text-sm mb-4">
                The API is flexible and accepts multiple formats. Values are automatically normalized - use whichever format is easiest for your system.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Experience Level */}
                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <h4 className="text-white font-semibold mb-2">experienceLevel</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entry Level:</span>
                      <code className="text-orange-400">entry_level, entry, junior</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mid Level:</span>
                      <code className="text-orange-400">mid_level, mid, mid-level</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Senior Level:</span>
                      <code className="text-orange-400">senior_level, senior, lead</code>
                    </div>
                  </div>
                </div>

                {/* Work Type */}
                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <h4 className="text-white font-semibold mb-2">workType</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Full Time:</span>
                      <code className="text-orange-400">full_time, full-time, fulltime</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Part Time:</span>
                      <code className="text-orange-400">part_time, part-time, parttime</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contract:</span>
                      <code className="text-orange-400">contract, freelance</code>
                    </div>
                  </div>
                </div>

                {/* Work Arrangement */}
                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <h4 className="text-white font-semibold mb-2">workArrangement</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Remote:</span>
                      <code className="text-orange-400">remote, wfh, work_from_home</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">On-site:</span>
                      <code className="text-orange-400">onsite, on_site, office</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hybrid:</span>
                      <code className="text-orange-400">hybrid, mixed</code>
                    </div>
                  </div>
                </div>

                {/* Shift */}
                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <h4 className="text-white font-semibold mb-2">shift</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Day Shift:</span>
                      <code className="text-orange-400">day, daytime, morning</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Night Shift:</span>
                      <code className="text-orange-400">night, nightshift, graveyard</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Flexible:</span>
                      <code className="text-orange-400">flexible, rotating, any</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-emerald-300 text-sm">
                  <strong>✓ Flexible Input:</strong> Send values with hyphens (<code className="bg-black/30 px-1 rounded">mid-level</code>) or underscores (<code className="bg-black/30 px-1 rounded">mid_level</code>) - both work!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Setup Guide Tab */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* Download Button */}
          <div className="flex justify-end">
            <Button onClick={handleDownloadGuide} className="bg-gradient-to-r from-orange-500 to-amber-600">
              <Download className="h-4 w-4 mr-2" />
              Download Guide (.txt)
            </Button>
          </div>

          {/* Intro */}
          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Complete Integration Setup Guide</h3>
                  <p className="text-gray-400">
                    Follow this step-by-step guide to integrate your portal with BPOC. 
                    This guide is designed to be copy-pasted directly into Cursor or any AI coding assistant.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Credentials */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">📌 Your API Credentials</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Base URL:</p>
                  <code className="block p-3 bg-black/40 rounded-lg text-orange-400 font-mono text-sm">{baseUrl}</code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">API Key:</p>
                  <code className="block p-3 bg-black/40 rounded-lg text-orange-400 font-mono text-sm break-all">
                    {apiKey || 'Generate your API key first'}
                  </code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Required Header (all requests):</p>
                  <code className="block p-3 bg-black/40 rounded-lg text-gray-300 font-mono text-sm">
                    X-API-Key: {apiKey || 'your-api-key'}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Warning */}
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ CRITICAL: How Client IDs Work</h3>
                  <p className="text-red-200/80 mb-3">
                    BPOC does <strong>NOT</strong> auto-create clients. You MUST:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-red-200/80">
                    <li>Call <code className="bg-black/30 px-1 rounded">POST /clients/get-or-create</code> with the client&apos;s company name/email</li>
                    <li>Store the returned <code className="bg-black/30 px-1 rounded">clientId</code> in your database</li>
                    <li>Use that <code className="bg-black/30 px-1 rounded">clientId</code> for all future requests (jobs, applications, etc.)</li>
                  </ol>
                  <p className="text-red-300 mt-3 font-semibold">
                    If you pass a clientId that doesn&apos;t exist or doesn&apos;t belong to your agency, you&apos;ll get 400/404 errors.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1 */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg">1</div>
                <h3 className="text-xl font-bold text-white">Create the API Client Utility</h3>
              </div>
              <p className="text-gray-400 mb-4">Create a file <code className="bg-black/40 px-2 py-1 rounded">lib/bpoc-api.ts</code> in your project:</p>
              <pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                <code className="text-gray-300">{`// lib/bpoc-api.ts
const BPOC_BASE_URL = '${baseUrl}';
const BPOC_API_KEY = '${apiKey || 'your-api-key'}';

export async function bpocApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(\`\${BPOC_BASE_URL}\${endpoint}\`, {
    ...options,
    headers: {
      'X-API-Key': BPOC_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('BPOC API Error:', data);
    throw new Error(data.error || \`API Error: \${response.status}\`);
  }
  
  return data;
}

// ============================================
// CLIENT FUNCTIONS
// ============================================

/**
 * Get or create a client in BPOC
 * IMPORTANT: Call this first and store the clientId!
 */
export async function getOrCreateClient(clientData: {
  name: string;           // Required - company name
  email?: string;         // Used for matching existing clients
  industry?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  return bpocApi('/clients/get-or-create', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
}

/**
 * List all clients for your agency
 */
export async function listClients() {
  return bpocApi('/clients');
}

// ============================================
// JOB FUNCTIONS
// ============================================

/**
 * Create a new job listing
 */
export async function createJob(jobData: {
  title: string;                    // Required
  description: string;              // Required
  clientId: string;                 // Required - from getOrCreateClient
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;                // Default: PHP
  workArrangement?: 'remote' | 'onsite' | 'hybrid';
  workType?: 'full_time' | 'part_time' | 'contract';
  shift?: 'day' | 'night' | 'flexible';
  experienceLevel?: 'entry_level' | 'mid_level' | 'senior_level';
  skills?: string[];
}) {
  return bpocApi('/jobs/create', {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
}

/**
 * List jobs (optionally filter by client)
 */
export async function listJobs(clientId?: string) {
  const params = clientId ? \`?clientId=\${clientId}\` : '';
  return bpocApi(\`/jobs\${params}\`);
}

/**
 * Get single job details
 */
export async function getJob(jobId: string) {
  return bpocApi(\`/jobs/\${jobId}\`);
}

/**
 * Update a job
 */
export async function updateJob(jobId: string, updates: {
  title?: string;
  description?: string;
  status?: 'active' | 'paused' | 'closed';
  salaryMin?: number;
  salaryMax?: number;
}) {
  return bpocApi(\`/jobs/\${jobId}\`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ============================================
// APPLICATION FUNCTIONS
// ============================================

export async function submitApplication(data: {
  jobId: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}) {
  return bpocApi('/applications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listApplications(filters?: {
  clientId?: string;
  job_id?: string;
  status?: string;
  mode?: 'recruiter' | 'client';  // NEW: recruiter = all apps, client = only released
}) {
  const params = new URLSearchParams(filters as any).toString();
  return bpocApi(\`/applications\${params ? \`?\${params}\` : ''}\`);
}

// NEW: Release application to client (Recruiter Gate)
export async function releaseApplication(applicationId: string, data: {
  released_by: string;
  share_calls_with_client?: Array<{ room_id: string; share?: boolean }>;
  share_calls_with_candidate?: Array<{ room_id: string; share?: boolean }>;
  status?: string;
}) {
  return bpocApi(\`/applications/\${applicationId}/release\`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// NEW: Send application back to recruiter (Recruiter Gate)
export async function sendBackToRecruiter(applicationId: string, data: {
  reason: string;
  requested_by?: string;
}) {
  return bpocApi(\`/applications/\${applicationId}/send-back\`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateApplicationStatus(applicationId: string, data: {
  // Tip: send 'under_review' (preferred). 'reviewed' is accepted as an alias for backwards compatibility.
  status: 'invited' | 'submitted' | 'under_review' | 'reviewed' | 'shortlisted' | 'rejected' | 'interview_scheduled' | 'offer_pending' | 'offer_sent' | 'offer_accepted' | 'interviewed' | 'hired' | 'withdrawn';
  notes?: string;
}) {
  return bpocApi(\`/applications/\${applicationId}\`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============================================
// INTERVIEW & OFFER FUNCTIONS
// ============================================

export async function scheduleInterview(data: {
  applicationId: string;
  type: 'recruiter_prescreen' | 'recruiter_round_1' | 'recruiter_round_2' | 'client_round_1' | 'client_final';
  scheduledAt?: string;
  notes?: string;
}) {
  return bpocApi('/interviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function sendOffer(data: {
  applicationId: string;
  salary: number;
  currency?: string;
  startDate?: string;
  expiresAt?: string;
  benefits?: string[];
  message?: string;
}) {
  return bpocApi('/offers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}`}</code>
              </pre>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg">2</div>
                <h3 className="text-xl font-bold text-white">Job Request Form Handler</h3>
              </div>
              <p className="text-gray-400 mb-4">When a client on your portal submits a job request:</p>
              <pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                <code className="text-gray-300">{`// Example: app/api/client/job-requests/route.ts
import { getOrCreateClient, createJob } from '@/lib/bpoc-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. First, get or create the client in BPOC
    //    You should ideally store this clientId in your database after first call
    const clientResult = await getOrCreateClient({
      name: body.companyName,
      email: body.companyEmail,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
    });
    
    console.log('BPOC Client:', clientResult);
    // clientResult = { clientId: "uuid...", companyId: "uuid...", name: "...", created: true/false }
    
    // 2. Now create the job using that clientId
    const jobResult = await createJob({
      clientId: clientResult.clientId,  // <-- REQUIRED
      title: body.jobTitle,
      description: body.jobDescription,
      requirements: body.requirements || [],
      responsibilities: body.responsibilities || [],
      benefits: body.benefits || [],
      salaryMin: body.salaryMin,
      salaryMax: body.salaryMax,
      currency: body.currency || 'PHP',
      workArrangement: body.workArrangement || 'remote',
      workType: body.workType || 'full_time',
      experienceLevel: body.experienceLevel || 'mid_level',
      skills: body.skills || [],
    });
    
    console.log('BPOC Job Created:', jobResult);
    // jobResult = { success: true, job: { id: "uuid...", title: "...", slug: "...", status: "active" } }
    
    return Response.json({
      success: true,
      bpocClientId: clientResult.clientId,
      bpocJobId: jobResult.job.id,
      message: 'Job request submitted to BPOC',
    });
    
  } catch (error: any) {
    console.error('Error submitting job request:', error);
    return Response.json(
      { error: error.message || 'Failed to create job request' },
      { status: 500 }
    );
  }
}`}</code>
              </pre>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg">3</div>
                <h3 className="text-xl font-bold text-white">Database Storage (Recommended)</h3>
              </div>
              <p className="text-gray-400 mb-4">Store the BPOC <code className="bg-black/40 px-1 rounded">clientId</code> in your local database so you don&apos;t call <code className="bg-black/40 px-1 rounded">/clients/get-or-create</code> every time:</p>
              <pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-sm">
                <code className="text-gray-300">{`// Add a column to your clients table: bpoc_client_id (string, nullable)

async function getClientBpocId(localClientId: string) {
  // 1. Check if we already have the BPOC ID stored
  const localClient = await db.clients.findUnique({ where: { id: localClientId } });
  
  if (localClient.bpoc_client_id) {
    return localClient.bpoc_client_id;
  }
  
  // 2. If not, call BPOC to get/create and store it
  const bpocResult = await getOrCreateClient({
    name: localClient.company_name,
    email: localClient.email,
  });
  
  // 3. Save for future use
  await db.clients.update({
    where: { id: localClientId },
    data: { bpoc_client_id: bpocResult.clientId },
  });
  
  return bpocResult.clientId;
}`}</code>
              </pre>
            </CardContent>
          </Card>

          {/* Common Errors */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">🔧 Common Errors & Fixes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-gray-400">Error</th>
                      <th className="text-left py-2 px-3 text-gray-400">Cause</th>
                      <th className="text-left py-2 px-3 text-gray-400">Fix</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-3"><code className="text-red-400">401 Missing API key</code></td>
                      <td className="py-2 px-3">No X-API-Key header</td>
                      <td className="py-2 px-3">Add the header to every request</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-3"><code className="text-red-400">401 Invalid API key</code></td>
                      <td className="py-2 px-3">Wrong key</td>
                      <td className="py-2 px-3">Use exact key from this page</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-3"><code className="text-red-400">400 No clients found</code></td>
                      <td className="py-2 px-3">Calling /jobs/create without client first</td>
                      <td className="py-2 px-3">Call /clients/get-or-create first</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-3"><code className="text-red-400">400 Invalid clientId</code></td>
                      <td className="py-2 px-3">clientId doesn&apos;t belong to your agency</td>
                      <td className="py-2 px-3">Get correct ID from /clients/get-or-create</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-3"><code className="text-red-400">404 Client not found</code></td>
                      <td className="py-2 px-3">Wrong clientId in query params</td>
                      <td className="py-2 px-3">Verify ID exists via /clients</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3"><code className="text-red-400">404 Job not found</code></td>
                      <td className="py-2 px-3">Job ID doesn&apos;t exist or wrong agency</td>
                      <td className="py-2 px-3">Check job belongs to your clients</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Flow */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">📋 Summary Flow</h3>
              <div className="p-4 bg-black/40 rounded-lg font-mono text-sm text-gray-300">
                <pre>{`Your Portal (ShoreAgents.ai)
           │
           ▼
   Client submits job request
           │
           ▼
   Call POST /clients/get-or-create
   (get BPOC clientId, store it)
           │
           ▼
   Call POST /jobs/create
   (with clientId from above)
           │
           ▼
   Job appears in BPOC Recruiter Dashboard
   (ShoreAgents can manage it there)`}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Download Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={handleDownloadGuide} size="lg" className="bg-gradient-to-r from-orange-500 to-amber-600">
              <Download className="h-5 w-5 mr-2" />
              Download Complete Guide
            </Button>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Real-Time Webhooks</h3>
                  <p className="text-gray-400">
                    Receive instant HTTP POST notifications when events occur in BPOC (applications created, status changes, interviews scheduled, etc.).
                    No more polling - get real-time updates pushed directly to your server.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <WebhookManager />

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">How to Verify Webhook Signatures</h3>
              <p className="text-gray-400 mb-4">
                All webhooks include an <code className="bg-black/40 px-2 py-1 rounded text-purple-400">X-Webhook-Signature</code> header
                for security. Verify it in your webhook receiver:
              </p>
              <pre className="p-4 bg-black/40 rounded-lg text-gray-300 font-mono text-sm overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = 'sha256=' +
    crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler:
app.post('/api/webhooks/bpoc', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.BPOC_WEBHOOK_SECRET;

  if (!verifyWebhook(payload, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }

  // Process the webhook
  const { event, data } = req.body;
  console.log('Received event:', event, data);

  res.status(200).send('OK');
});`}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          
          {/* CLIENTS */}
          <EndpointSection icon={<Building2 />} title="Clients" description="Link your portal clients to BPOC">
            <Endpoint
              method="GET"
              path="/clients"
              description="List all your agency's clients"
              response={`{
  "clients": [
    {
      "id": "b3244902-fcf9-...",
      "name": "StepTen Inc",
      "industry": "Technology",
      "website": "https://stepten.com",
      "status": "active",
      "contactName": "John Smith",
      "contactEmail": "john@stepten.com"
    }
  ],
  "total": 1
}`}
            />
            
            <Endpoint
              method="POST"
              path="/clients/get-or-create"
              description="Find existing client or create new one. Returns BPOC client ID to store in your database."
              body={`{
  "name": "StepTen Inc",        // Required
  "email": "contact@stepten.com", // Used for matching
  "industry": "Technology",
  "website": "https://stepten.com",
  "contactName": "John Smith",
  "contactEmail": "john@stepten.com",
  "contactPhone": "+63 912 345 6789"
}`}
              response={`{
  "clientId": "b3244902-fcf9-...",  // ← Store this!
  "companyId": "c8c36c71-...",
  "name": "StepTen Inc",
  "created": false  // true if newly created
}`}
            />
          </EndpointSection>

          {/* JOBS */}
          <EndpointSection icon={<Briefcase />} title="Jobs" description="Manage job listings">
            <Endpoint
              method="GET"
              path="/jobs"
              description="List all jobs"
              params={[
                { name: 'clientId', type: 'string', desc: 'Filter by client (optional)' },
                { name: 'status', type: 'string', desc: 'active, paused, closed, all (default: active)' },
                { name: 'limit', type: 'number', desc: 'Results per page (default: 50, max: 100)' },
                { name: 'offset', type: 'number', desc: 'Pagination offset' },
              ]}
              response={`{
  "jobs": [
    {
      "id": "49046ab8-...",
      "title": "Virtual Assistant",
      "slug": "virtual-assistant-abc123",
      "description": "Looking for a VA...",
      "requirements": ["English fluency", "2+ years experience"],
      "responsibilities": ["Handle emails", "Schedule meetings"],
      "benefits": ["Health insurance", "Remote work"],
      "salary": {
        "min": 30000,
        "max": 50000,
        "type": "monthly",
        "currency": "PHP"
      },
      "workArrangement": "remote",
      "workType": "full_time",
      "shift": "day",
      "experienceLevel": "mid_level",
      "status": "active",
      "views": 150,
      "applicantsCount": 12,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}`}
            />

            <Endpoint
              method="GET"
              path="/jobs/:id"
              description="Get single job with full details including client info"
              response={`{
  "job": {
    "id": "49046ab8-...",
    "title": "Virtual Assistant",
    "description": "...",
    "client": {
      "id": "b3244902-...",
      "name": "StepTen Inc",
      "industry": "Technology"
    },
    ...
  }
}`}
            />

            <Endpoint
              method="PATCH"
              path="/jobs/:id"
              description="Update job details or status"
              body={`{
  "title": "Senior Virtual Assistant",
  "status": "paused",  // active, paused, closed
  "salaryMin": 35000,
  "salaryMax": 55000,
  "description": "Updated description..."
}`}
              response={`{
  "success": true,
  "job": {
    "id": "49046ab8-...",
    "title": "Senior Virtual Assistant",
    "status": "paused",
    "updatedAt": "2025-01-02T00:00:00Z"
  }
}`}
            />

            <Endpoint
              method="POST"
              path="/jobs/create"
              description="Create a new job listing"
              body={`{
  "title": "Customer Service Rep",    // Required
  "description": "We are looking...", // Required
  "clientId": "b3244902-...",         // Optional (uses first client if not provided)
  "requirements": ["English fluency", "Customer service experience"],
  "responsibilities": ["Handle inquiries", "Process orders"],
  "benefits": ["HMO", "13th month pay"],
  "salaryMin": 25000,
  "salaryMax": 35000,
  "currency": "PHP",
  "workArrangement": "remote",     // remote, onsite, hybrid
  "workType": "full_time",         // full_time, part_time, contract
  "shift": "day",                  // day, night, flexible
  "experienceLevel": "entry_level", // entry_level, mid_level, senior_level
  "skills": ["Communication", "Problem Solving"]
}`}
              response={`{
  "success": true,
  "job": {
    "id": "new-job-uuid",
    "title": "Customer Service Rep",
    "slug": "customer-service-rep-xyz789",
    "status": "active",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}`}
            />
          </EndpointSection>

          {/* APPLICATIONS */}
          <EndpointSection icon={<FileText />} title="Applications" description="Handle candidate applications from your portal">
            <Endpoint
              method="GET"
              path="/applications"
              description="List applications (supports Recruiter Gate mode filtering)"
              params={[
                { name: 'clientId', type: 'string', desc: 'Filter by client' },
                { name: 'job_id', type: 'string', desc: 'Filter by job' },
                { name: 'status', type: 'string', desc: 'Filter by status' },
                { name: 'mode', type: 'string', desc: 'NEW: recruiter (all apps) or client (only released apps). Default: client' },
                { name: 'limit', type: 'number', desc: 'Results per page (default: 50, max: 100)' },
                { name: 'offset', type: 'number', desc: 'Pagination offset' },
              ]}
              response={`{
  "applications": [
    {
      "id": "66d2331d-...",
      "jobId": "49046ab8-...",
      "jobTitle": "Virtual Assistant",
      "candidate": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "submitted",
      
      // Recruiter Gate Fields (NEW)
      "released_to_client": false,
      "released_at": null,
      "released_by": null,
      // Sharing is now per-call (video_call_rooms.share_with_client/share_with_candidate)
      
      "appliedAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}`}
            />

            <Endpoint
              method="GET"
              path="/applications/:id"
              description="Get full application details with candidate profile, skills, assessments"
              response={`{
  "application": {
    "id": "66d2331d-...",
    "status": "shortlisted",
    "appliedAt": "2025-01-01T00:00:00Z",
    "recruiterNotes": "Great candidate",
    "job": {
      "id": "49046ab8-...",
      "title": "Virtual Assistant",
      "client": {
        "id": "b3244902-...",
        "name": "StepTen Inc"
      }
    },
    "candidate": {
      "id": "e79288cc-...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+63 912 345 6789",
      "avatarUrl": "https://...",
      "headline": "Experienced Virtual Assistant",
      "bio": "5 years of experience...",
      "location": "Manila, Philippines",
      "experienceYears": 5,
      "skills": ["Communication", "Excel", "Data Entry"],
      "hasResume": true,
      "resumeUrl": "https://...",
      "aiScore": 85,
      "strengths": ["Strong communication", "Detail-oriented"],
      "assessments": {
        "typing": { "wpm": 65, "accuracy": 98 },
        "disc": "DC"
      }
    }
  }
}`}
            />

            <Endpoint
              method="POST"
              path="/applications"
              description="Submit application from your portal on behalf of candidate"
              body={`{
  "jobId": "49046ab8-...",  // Required
  "candidate": {
    "firstName": "John",    // Required
    "lastName": "Doe",      // Required
    "email": "john@example.com", // Required
    "phone": "+63 912 345 6789"
  }
}`}
              response={`{
  "success": true,
  "applicationId": "66d2331d-...",
  "candidateId": "e79288cc-...",
  "message": "Application submitted successfully"
}`}
            />

            <Endpoint
              method="PATCH"
              path="/applications/:id"
              description="Update application status"
              body={`{
  "status": "shortlisted",  // Required
  "notes": "Great candidate for the role"
}`}
              response={`{
  "success": true,
  "application": {
    "id": "66d2331d-...",
    "status": "shortlisted",
    "updatedAt": "2025-01-02T00:00:00Z"
  }
}`}
            />

            <Endpoint
              method="POST"
              path="/applications/:id/release"
              description="🔒 NEW: Release application to client (Recruiter Gate feature)"
              body={`{
  "released_by": "uuid-of-recruiter",         // Required - UUID of recruiter releasing
  "share_calls_with_client": [                // Optional - Which calls to share with client
    { "room_id": "uuid-of-room", "share": true }
  ],
  "share_calls_with_candidate": [             // Optional - Which calls to share with candidate
    { "room_id": "uuid-of-room", "share": true }
  ],
  "status": "shortlisted"                     // Optional - Status to set (default: "shortlisted")
}`}
              response={`{
  "success": true,
  "application": {
    "id": "66d2331d-...",
    "released_to_client": true,
    "released_at": "2026-01-02T12:00:00Z",
    "released_by": "recruiter-uuid",
    "status": "shortlisted",
    "updatedAt": "2026-01-02T12:00:00Z"
  }
}`}
            />

            <Endpoint
              method="POST"
              path="/applications/:id/send-back"
              description="🔒 NEW: Client sends application back to recruiter (Recruiter Gate feature)"
              body={`{
  "reason": "Need more information about technical skills",  // Required - Reason for sending back
  "requested_by": "client-uuid"                              // Optional - Client UUID
}`}
              response={`{
  "success": true,
  "message": "Application sent back to recruiter",
  "application": {
    "id": "66d2331d-...",
    "released_to_client": false,
    "status": "reviewed",
    "updatedAt": "2026-01-02T14:00:00Z"
  }
}`}
            />
            
            <div className="p-3 bg-black/20 rounded-lg border border-white/10 mt-2">
              <p className="text-gray-400 text-sm mb-2"><strong>Valid statuses:</strong></p>
              <div className="flex flex-wrap gap-2">
                {['submitted', 'reviewed', 'shortlisted', 'rejected', 'interview_scheduled', 'offer_sent', 'hired'].map(s => (
                  <Badge key={s} variant="outline" className="border-white/20 text-xs">{s}</Badge>
                ))}
              </div>
            </div>

            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg mt-2">
              <p className="text-orange-300 text-sm mb-2"><strong>🔒 Recruiter Gate Feature:</strong></p>
              <p className="text-orange-200/80 text-xs mb-2">
                Applications are hidden from clients by default (<code className="bg-black/30 px-1 rounded">released_to_client = false</code>). 
                Use <code className="bg-black/30 px-1 rounded">POST /applications/:id/release</code> to make them visible to clients.
              </p>
              <p className="text-orange-200/80 text-xs">
                When <code className="bg-black/30 px-1 rounded">mode=client</code> is used, pre-screen data is filtered based on sharing preferences.
              </p>
            </div>
          </EndpointSection>

          {/* INTERVIEWS */}
          <EndpointSection icon={<Calendar />} title="Interviews" description="Schedule and manage interviews">
            <Endpoint
              method="GET"
              path="/interviews"
              description="List interviews"
              params={[
                { name: 'clientId', type: 'string', desc: 'Filter by client' },
                { name: 'status', type: 'string', desc: 'Filter by status' },
              ]}
              response={`{
  "interviews": [
    {
      "id": "int-uuid",
      "applicationId": "66d2331d-...",
      "jobTitle": "Virtual Assistant",
      "candidate": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "type": "recruiter_prescreen",
      "status": "scheduled",
      "outcome": null,
      "scheduledAt": "2025-01-15T10:00:00Z",
      "clientTime": "Jan 15, 2025, 5:00 AM (New York)",
      "clientTimezone": "America/New_York",
      "phTime": "Jan 15, 2025, 6:00 PM (PHT)",
      "notes": "Initial screening call",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1
}`}
            />

            <Endpoint
              method="POST"
              path="/interviews"
              description="Schedule an interview for a candidate"
              body={`{
  "applicationId": "66d2331d-...",  // Required
  "type": "client_round_1",         // YOUR interview type (see reference below)
  "scheduledAt": "2025-01-15T08:30:00Z",  // ISO 8601 format
  "clientTimezone": "Australia/Sydney",   // YOUR timezone (required for accurate display)
  "notes": "Initial interview with candidate"
}`}
              response={`{
  "success": true,
  "interview": {
    "id": "int-uuid",
    "type": "client_round_1",
    "status": "scheduled",
    "scheduledAt": "2025-01-15T08:30:00.000Z",
    "clientTime": "Jan 15, 2025, 8:30 AM (Sydney)",
    "clientTimezone": "Australia/Sydney",
    "phTime": "Jan 15, 2025, 5:30 AM (PHT)"
  },
  "message": "Interview scheduled for Jan 15, 2025, 5:30 AM (PHT) / Jan 15, 2025, 8:30 AM (Sydney)"
}`}
            />

            <Endpoint
              method="PATCH"
              path="/interviews"
              description="Update interview outcome, rating, and feedback"
              body={`{
  "interviewId": "int-uuid",  // Required
  "outcome": "passed",        // passed, failed, pending_decision, needs_followup
  "rating": 4,                // 1-5 star rating
  
  // Feedback - accepts STRING or OBJECT:
  "feedback": "Great candidate, strong skills"  // Simple text
  // OR structured:
  // "feedback": {
  //   "communication": 4,
  //   "technicalSkills": 5,
  //   "overallImpression": "Strong candidate"
  // }
  
  "notes": "Additional notes"
}`}
              response={`{
  "success": true,
  "interview": {
    "id": "int-uuid",
    "outcome": "passed",
    "rating": 4,
    "feedback": {...},
    "notes": "...",
    "status": "completed"
  }
}`}
            />
            
            <div className="p-3 bg-black/20 rounded-lg border border-white/10 mt-2">
              <p className="text-orange-400 text-sm mb-2 font-semibold">⭐ YOUR INTERVIEWS (Use these when scheduling via API):</p>
              <p className="text-gray-500 text-xs mb-2">These are interviews YOUR team conducts with candidates</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {['client_round_1', 'client_round_2', 'client_final', 'client_general'].map(s => (
                  <Badge key={s} variant="outline" className="border-orange-500/30 text-orange-400 text-xs">{s}</Badge>
                ))}
              </div>
              <p className="text-blue-400 text-sm mb-2"><strong>BPOC Internal (BPOC team conducts):</strong></p>
              <p className="text-gray-500 text-xs mb-2">These are used when BPOC recruiters interview candidates</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {['recruiter_prescreen', 'recruiter_round_1', 'recruiter_round_2', 'recruiter_round_3', 'recruiter_offer', 'recruiter_general'].map(s => (
                  <Badge key={s} variant="outline" className="border-blue-500/30 text-blue-400 text-xs">{s}</Badge>
                ))}
              </div>
              <p className="text-gray-400 text-sm mb-2"><strong>Interview Outcomes:</strong></p>
              <div className="flex flex-wrap gap-2">
                {['passed', 'failed', 'pending_decision', 'needs_followup'].map(s => (
                  <Badge key={s} variant="outline" className="border-white/20 text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          </EndpointSection>

          {/* OFFERS */}
          <EndpointSection icon={<Gift />} title="Offers" description="Send and manage job offers">
            <Endpoint
              method="GET"
              path="/offers"
              description="List offers"
              params={[
                { name: 'clientId', type: 'string', desc: 'Filter by client' },
                { name: 'status', type: 'string', desc: 'draft, sent, viewed, accepted, rejected, negotiating, expired, withdrawn' },
              ]}
              response={`{
  "offers": [
    {
      "id": "offer-uuid",
      "applicationId": "66d2331d-...",
      "jobTitle": "Virtual Assistant",
      "candidate": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "salary_offered": 45000,
      "currency": "PHP",
      "salaryOffered": 45000,
      "startDate": "2025-02-01",
      "status": "sent",
      "expiresAt": "2025-01-20T00:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1
}`}
            />

            <Endpoint
              method="POST"
              path="/offers"
              description="Send a job offer (Requires Enterprise plan)"
              body={`{
  "applicationId": "66d2331d-...",  // Required - must belong to your agency
  "salary": 45000,                   // Required - number (DECIMAL)
  "currency": "PHP",                 // Optional - defaults to "PHP"
  "startDate": "2025-02-01",         // Optional - ISO date (YYYY-MM-DD)
  "expiresAt": "2025-01-20T00:00:00Z", // Optional - ISO datetime
  "benefits": ["HMO", "13th month", "Remote work"],  // Optional - array of strings
  "message": "We are pleased to offer you the position..."  // Optional - offer message
}`}
              response={`{
  "success": true,
  "offer": {
    "id": "offer-uuid",
    "salary_offered": 45000,
    "currency": "PHP",
    "status": "sent",  // Automatically set to 'sent' when created via API
    "startDate": "2025-02-01"
  }
}`}
            />

            <Endpoint
              method="GET"
              path="/offers/:offerId/counter"
              description="List counter offers for an offer (Enterprise)"
              response={`{
  "counterOffers": [
    {
      "id": "counter-uuid",
      "offer_id": "offer-uuid",
      "requested_salary": 48000,
      "requested_currency": "PHP",
      "candidate_message": "Can we do 48k?",
      "employer_response": null,
      "response_type": null,
      "status": "pending",
      "created_at": "2026-01-08T00:00:00Z",
      "responded_at": null
    }
  ]
}`}
            />

            <Endpoint
              method="POST"
              path="/offers/:offerId/counter/accept"
              description="Accept a counter offer (Enterprise)"
              body={`{
  "counterOfferId": "counter-uuid",
  "employerMessage": "Accepted at your requested salary."
}`}
              response={`{ "success": true }`}
            />

            <Endpoint
              method="POST"
              path="/offers/:offerId/counter/reject"
              description="Reject a counter offer (optionally send revised counter) (Enterprise)"
              body={`{
  "counterOfferId": "counter-uuid",
  "employerMessage": "We can't do that, but here's our best offer.",
  "sendNewCounter": true,
  "revisedSalary": 47000,
  "revisedCurrency": "PHP"
}`}
              response={`{ "success": true }`}
            />
            
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mt-2">
              <p className="text-amber-300 text-sm mb-2"><strong>⚠️ Enterprise Plan Required</strong></p>
              <p className="text-amber-200/80 text-xs mb-2">This endpoint requires Enterprise tier API access.</p>
              <p className="text-amber-200/80 text-xs mb-2"><strong>Valid Status Values:</strong></p>
              <div className="flex flex-wrap gap-2">
                {['draft', 'sent', 'viewed', 'accepted', 'rejected', 'negotiating', 'expired', 'withdrawn'].map(s => (
                  <Badge key={s} variant="outline" className="border-amber-500/30 text-amber-400 text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          </EndpointSection>

          {/* CANDIDATES */}
          <EndpointSection icon={<Users />} title="Talent Pool" description="Search and browse candidates (Enterprise)">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-4">
              <p className="text-purple-300 text-sm">
                <strong>⭐ Candidate Truth API:</strong> Use <code className="bg-black/40 px-1 rounded">GET /candidates/:id/complete</code> to get ALL candidate data in one call!
              </p>
            </div>

            <Endpoint
              method="GET"
              path="/candidates"
              description="Search candidates in the talent pool"
              params={[
                { name: 'search', type: 'string', desc: 'Search by name or email' },
                { name: 'skills', type: 'string', desc: 'Filter by skills (comma-separated)' },
                { name: 'hasResume', type: 'boolean', desc: 'Only candidates with resumes' },
                { name: 'limit', type: 'number', desc: 'Results per page (max 100)' },
                { name: 'offset', type: 'number', desc: 'Pagination offset' },
              ]}
              response={`{
  "candidates": [
    {
      "id": "e79288cc-...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+63 912 345 6789",
      "avatarUrl": "https://...",
      "headline": "Experienced Virtual Assistant",
      "location": "Manila, Philippines",
      "experienceYears": 5,
      "skills": ["Communication", "Excel", "Data Entry"],
      "hasResume": true,
      "assessments": {
        "typing": { "wpm": 65, "accuracy": 98 },
        "disc": "DC"
      },
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "limit": 50,
  "offset": 0
}`}
            />

            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-4">
              <p className="text-purple-300 text-xs mb-2">
                <strong>⭐ Candidate Truth API:</strong> Get ALL candidate data in one call - skills, assessments, work history, education, resume, AI analysis, and more!
              </p>
              <p className="text-purple-200/70 text-xs">
                ⚠️ Contact details (email/phone) are NOT included. Use BPOC platform to contact candidates.
                <br />
                <strong>Enterprise tier:</strong> Access ANY candidate. <strong>Pro/Free:</strong> Only candidates who applied to your jobs.
              </p>
            </div>
            <Endpoint
              method="GET"
              path="/candidates/:id/complete"
              description="⭐ Get COMPLETE candidate data - everything in one response (Candidate Truth API)"
              response={`{
  "candidate": {
    "id": "e79288cc-...",
    "firstName": "Marco",
    "lastName": "Delgado",
    "fullName": "Marco Delgado",
    "avatarUrl": "https://...",
    "headline": "Virtual Assistant / Customer Support Specialist",
    "bio": "Experienced Virtual Assistant...",
    "location": "Makati City, Metro Manila, Philippines",
    "experienceYears": 5.0,
    "skills": [
      {
        "name": "Customer Support",
        "category": "Customer Service",
        "proficiencyLevel": "expert",
        "yearsExperience": 5.0,
        "isPrimary": true,
        "verified": true
      }
    ],
    "assessments": {
      "typing": {
        "wpm": 78,
        "accuracy": 98.8,
        "completedAt": "2025-12-30T..."
      },
      "disc": {
        "primaryType": "I",
        "secondaryType": "S",
        "completedAt": "2025-12-30T..."
      }
    },
    "workExperiences": [
      {
        "role": "Virtual Assistant",
        "company": "XYZ Corp",
        "startDate": "2020-01",
        "endDate": "2023-12",
        "description": "..."
      }
    ],
    "educations": [
      {
        "degree": "Bachelor of Science",
        "institution": "University of Manila",
        "year": 2019
      }
    ],
    "resume": {
      "url": "https://...",
      "uploadedAt": "2025-12-30T..."
    },
    "aiAnalysis": {
      "overallScore": 85,
      "strengths": ["Strong communication", "Detail-oriented"],
      "areasForGrowth": ["Technical skills"]
    }
  }
}`}
            />
          </EndpointSection>

          {/* VIDEO CALLS */}
          <EndpointSection icon={<Video />} title="Video Interviews" description="BPOC-hosted video calls for interviews (Pro+)">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-4">
              <p className="text-emerald-300 text-sm">
                <strong>✓ Zero Setup Required:</strong> BPOC hosts all video infrastructure via Daily.co. 
                Just create a room and share the join URLs with participants!
              </p>
            </div>

            <Endpoint
              method="GET"
              path="/video/rooms"
              description="List all video rooms for your agency"
              params={[
                { name: 'applicationId', type: 'string', desc: 'Filter by application' },
                { name: 'callType', type: 'string', desc: 'recruiter_prescreen, recruiter_round_1, client_round_1, client_final, etc.' },
                { name: 'status', type: 'string', desc: 'created, active, ended' },
                { name: 'outcome', type: 'string', desc: 'successful, no_show, rescheduled, cancelled' },
                { name: 'from', type: 'string', desc: 'Filter from date (ISO)' },
                { name: 'to', type: 'string', desc: 'Filter to date (ISO)' },
                { name: 'limit', type: 'number', desc: 'Results per page (default: 50)' },
                { name: 'offset', type: 'number', desc: 'Pagination offset' },
              ]}
              response={`{
  "rooms": [
    {
      "id": "room-uuid",
      "roomName": "agency-interview-abc123",
      "roomUrl": "https://bpoc.daily.co/agency-interview-abc123",
      "status": "ended",
      "callType": "client_round_1",
      "title": "Initial Screening - John Doe",
      "outcome": "successful",
      "notes": "Great candidate!",
      "scheduledFor": "2025-01-15T10:00:00Z",
      "startedAt": "2025-01-15T10:02:00Z",
      "endedAt": "2025-01-15T10:45:00Z",
      "recordingEnabled": true,
      "applicationId": "app-uuid",
      "candidateId": "candidate-uuid"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}`}
            />

            <Endpoint
              method="POST"
              path="/video/rooms"
              description="Create a new video room for an interview. Returns join URLs for host and participant."
              body={`{
  "applicationId": "app-uuid",           // Required
  "callType": "recruiter_prescreen",     // Required: recruiter_prescreen, recruiter_round_1, recruiter_round_2, recruiter_offer, client_round_1, client_round_2, client_final
  "interviewId": "interview-uuid",       // Optional: link to job_interviews record
  "candidateName": "John Doe",           // Optional: display name
  "title": "Initial Screening - John",   // Optional: auto-generated if omitted
  "scheduledFor": "2025-01-20T10:00:00Z", // Optional
  "enableRecording": true,               // Default: true
  "enableTranscription": true,           // Default: true (Enterprise only)
  "expiresInHours": 3                    // Default: 3
}`}
              response={`{
  "success": true,
  "room": {
    "id": "room-uuid",
    "roomName": "agency-interview-xyz789",
    "roomUrl": "https://bpoc.daily.co/agency-interview-xyz789",
    "status": "created",
    "callType": "client_round_1",
    "title": "Initial Screening - John Doe",
    "scheduledFor": "2025-01-20T10:00:00Z",
    "expiresAt": "2025-01-20T13:00:00Z",
    "recordingEnabled": true
  },
  "host": {
    "joinUrl": "https://bpoc.daily.co/...?t=HOST_TOKEN",  // ← For client/recruiter
    "token": "HOST_TOKEN"
  },
  "participant": {
    "name": "John Doe",
    "joinUrl": "https://bpoc.daily.co/...?t=PARTICIPANT_TOKEN",  // ← Send to candidate
    "token": "PARTICIPANT_TOKEN"
  },
  "applicationId": "app-uuid",
  "candidateId": "candidate-uuid"
}`}
            />

            <Endpoint
              method="GET"
              path="/video/rooms/:roomId"
              description="Get room details with fresh join tokens (tokens expire after 2 hours)"
              response={`{
  "room": {
    "id": "room-uuid",
    "roomName": "agency-interview-xyz789",
    "roomUrl": "https://bpoc.daily.co/agency-interview-xyz789",
    "status": "created",
    "callType": "client_round_1",
    "title": "Initial Screening - John Doe",
    "scheduledFor": "2025-01-20T10:00:00Z",
    "outcome": null,
    "notes": null
  },
  "host": {
    "joinUrl": "https://bpoc.daily.co/...?t=FRESH_HOST_TOKEN",
    "token": "FRESH_HOST_TOKEN"
  },
  "participant": {
    "name": "John Doe",
    "joinUrl": "https://bpoc.daily.co/...?t=FRESH_PARTICIPANT_TOKEN",
    "token": "FRESH_PARTICIPANT_TOKEN"
  }
}`}
            />

            <Endpoint
              method="PATCH"
              path="/video/rooms/:roomId"
              description="Update room status, outcome, or notes after a call"
              body={`{
  "status": "ended",                     // Optional: ended
  "outcome": "successful",               // Optional: successful, no_show, rescheduled, cancelled, needs_followup
  "notes": "Great candidate! Strong communication skills.",
  "title": "Updated title"               // Optional
}`}
              response={`{
  "success": true,
  "room": {
    "id": "room-uuid",
    "status": "ended",
    "outcome": "successful",
    "notes": "Great candidate! Strong communication skills.",
    "updatedAt": "2025-01-20T10:45:00Z"
  }
}`}
            />

            <Endpoint
              method="DELETE"
              path="/video/rooms/:roomId"
              description="Delete a video room (only if call hasn't started)"
              response={`{
  "success": true,
  "message": "Room deleted"
}`}
            />

            <div className="p-3 bg-black/20 rounded-lg border border-white/10 mt-2">
              <p className="text-gray-400 text-sm mb-2"><strong>Recruiter-Led Call Types:</strong></p>
              <div className="flex flex-wrap gap-2 mb-2">
                {['recruiter_prescreen', 'recruiter_round_1', 'recruiter_round_2', 'recruiter_round_3', 'recruiter_offer', 'recruiter_general'].map(s => (
                  <Badge key={s} variant="outline" className="border-blue-500/30 text-blue-400 text-xs">{s}</Badge>
                ))}
              </div>
              <p className="text-gray-400 text-sm mb-2"><strong>Client-Led Call Types:</strong></p>
              <div className="flex flex-wrap gap-2">
                {['client_round_1', 'client_round_2', 'client_final', 'client_general'].map(s => (
                  <Badge key={s} variant="outline" className="border-orange-500/30 text-orange-400 text-xs">{s}</Badge>
                ))}
              </div>
              <p className="text-gray-400 text-sm mt-3 mb-2"><strong>Outcomes:</strong></p>
              <div className="flex flex-wrap gap-2">
                {['successful', 'no_show', 'rescheduled', 'cancelled', 'needs_followup'].map(s => (
                  <Badge key={s} variant="outline" className="border-white/20 text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          </EndpointSection>

          {/* RECORDINGS */}
          <EndpointSection icon={<FileVideo />} title="Recordings" description="Access interview recordings (Pro+)">
            <Endpoint
              method="GET"
              path="/video/recordings"
              description="List all recordings"
              params={[
                { name: 'roomId', type: 'string', desc: 'Filter by video room' },
                { name: 'applicationId', type: 'string', desc: 'Filter by application' },
                { name: 'status', type: 'string', desc: 'pending, ready, error' },
                { name: 'hasTranscript', type: 'boolean', desc: 'Only with transcripts' },
                { name: 'limit', type: 'number', desc: 'Results per page' },
                { name: 'offset', type: 'number', desc: 'Pagination offset' },
              ]}
              response={`{
  "recordings": [
    {
      "id": "rec-uuid",
      "roomId": "room-uuid",
      "applicationId": "app-uuid",
      "status": "ready",
      "duration": 2580,
      "size": 125000000,
      "hasTranscript": true,
      "transcriptId": "trans-uuid",
      "createdAt": "2025-01-15T10:45:00Z"
    }
  ],
  "total": 10
}`}
            />

            <Endpoint
              method="GET"
              path="/video/recordings/:recordingId"
              description="Get recording details with temporary download link (valid for 1 hour)"
              response={`{
  "recording": {
    "id": "rec-uuid",
    "roomId": "room-uuid",
    "status": "ready",
    "duration": 2580,
    "size": 125000000,
    "hasTranscript": true,
    "transcriptId": "trans-uuid"
  },
  "download": {
    "url": "https://storage.daily.co/...",  // ← Temporary download link
    "expiresAt": "2025-01-15T11:45:00Z"
  },
  "transcript": {
    "id": "trans-uuid",
    "status": "completed"
  }
}`}
            />

            <Endpoint
              method="POST"
              path="/video/recordings/:recordingId"
              description="Trigger AI transcription for a recording (Enterprise only)"
              body={`{
  "action": "transcribe"
}`}
              response={`{
  "success": true,
  "transcriptId": "trans-uuid",
  "status": "processing",
  "message": "Transcription started"
}`}
            />
          </EndpointSection>

          {/* TRANSCRIPTS */}
          <EndpointSection icon={<FileAudio />} title="Transcripts" description="AI-powered interview transcripts (Enterprise)">
            <Endpoint
              method="GET"
              path="/video/transcripts/:transcriptId"
              description="Get full transcript with AI-generated summary and key points"
              response={`{
  "transcript": {
    "id": "trans-uuid",
    "recordingId": "rec-uuid",
    "roomId": "room-uuid",
    "status": "completed",
    "fullText": "Complete transcript of the interview conversation...",
    "summary": "AI-generated summary: The candidate demonstrated strong communication skills and relevant experience in customer service. Key discussion points included their 5 years of VA experience and familiarity with CRM tools.",
    "keyPoints": [
      "5 years of virtual assistant experience",
      "Proficient in Salesforce and HubSpot CRM",
      "Strong English communication skills",
      "Available to start immediately"
    ],
    "wordCount": 3245,
    "createdAt": "2025-01-15T11:00:00Z"
  },
  "candidate": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "room": {
    "id": "room-uuid",
    "title": "Initial Screening - John Doe",
    "callType": "client_round_1"
  }
}`}
            />
          </EndpointSection>

          {/* AGENCY ADMIN */}
          <EndpointSection icon={<Settings />} title="Agency Admin" description="Manage your agency settings and team">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-amber-300 text-sm">
                <strong>⚠️ Note:</strong> These endpoints are for managing your agency via API. 
                They allow team management, client oversight, and configuration.
              </p>
            </div>

            <Endpoint
              method="GET"
              path="/clients"
              description="List all clients linked to your agency"
              response={`{
  "clients": [
    {
      "id": "client-uuid",
      "name": "Acme Corporation",
      "industry": "Technology",
      "website": "https://acme.com",
      "status": "active",
      "contactName": "Jane Smith",
      "contactEmail": "jane@acme.com",
      "contactPhone": "+63 912 345 6789",
      "jobCount": 5,
      "activeJobCount": 3,
      "totalApplications": 47,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 10
}`}
            />

            <Endpoint
              method="POST"
              path="/clients/get-or-create"
              description="Link a client to your agency. Use this to connect your portal's clients to BPOC."
              body={`{
  "name": "Acme Corporation",        // Required
  "email": "hr@acme.com",           // Used for matching existing
  "industry": "Technology",
  "website": "https://acme.com",
  "contactName": "Jane Smith",
  "contactEmail": "jane@acme.com",
  "contactPhone": "+63 912 345 6789"
}`}
              response={`{
  "clientId": "client-uuid",  // ← Store this in your database!
  "companyId": "company-uuid",
  "name": "Acme Corporation",
  "created": true  // false if existing client matched
}`}
            />
          </EndpointSection>

          {/* EMBED */}
          <EndpointSection icon={<Code />} title="Public Embed" description="Embed job listings on external websites">
            <Endpoint
              method="GET"
              path="/embed/jobs"
              description="Get active jobs for embedding on external websites (no auth required)"
              params={[
                { name: 'agency', type: 'string', desc: 'Your agency slug (required)' },
                { name: 'client', type: 'string', desc: 'Filter by client ID' },
                { name: 'limit', type: 'number', desc: 'Max jobs to return' },
              ]}
              response={`{
  "jobs": [
    {
      "id": "job-uuid",
      "title": "Virtual Assistant",
      "slug": "virtual-assistant-abc123",
      "description": "Short description...",
      "location": "Remote",
      "workType": "full_time",
      "experienceLevel": "mid_level",
      "salary": {
        "min": 30000,
        "max": 50000,
        "currency": "PHP"
      },
      "postedAt": "2025-01-01T00:00:00Z",
      "applyUrl": "https://bpoc.io/jobs/virtual-assistant-abc123"
    }
  ],
  "agency": {
    "name": "Your Agency Name",
    "logo": "https://..."
  }
}`}
            />

            <div className="p-3 bg-black/20 rounded-lg border border-white/10 mt-2">
              <p className="text-gray-400 text-sm mb-2"><strong>Example Embed:</strong></p>
              <pre className="text-xs text-gray-300 bg-black/40 p-2 rounded overflow-x-auto">{`<script>
  fetch('https://bpoc.io/api/v1/embed/jobs?agency=your-slug')
    .then(r => r.json())
    .then(data => {
      // Render jobs on your website
      data.jobs.forEach(job => {
        document.getElementById('jobs').innerHTML += \`
          <div class="job">
            <h3>\${job.title}</h3>
            <p>\${job.description}</p>
            <a href="\${job.applyUrl}">Apply Now</a>
          </div>
        \`;
      });
    });
</script>`}</pre>
            </div>
          </EndpointSection>

        </div>
      )}

      {/* Examples Tab */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">JavaScript/TypeScript Example</h3>
              <pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-sm">
                <code className="text-gray-300">{`// api-client.ts
const API_KEY = '${apiKey || 'your-api-key'}';
const BASE_URL = '${baseUrl}';

async function bpocApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(\`\${BASE_URL}\${endpoint}\`, {
    ...options,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }
  
  return response.json();
}

// Get or create client
async function linkClient(name: string, email: string) {
  return bpocApi('/clients/get-or-create', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}

// List jobs for a client
async function getClientJobs(clientId: string) {
  return bpocApi(\`/jobs?clientId=\${clientId}\`);
}

// Submit application
async function submitApplication(jobId: string, candidate: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}) {
  return bpocApi('/applications', {
    method: 'POST',
    body: JSON.stringify({ jobId, candidate }),
  });
}

// Update application status
async function updateApplicationStatus(appId: string, status: string, notes?: string) {
  return bpocApi(\`/applications/\${appId}\`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

// NEW: Release application to client (Recruiter Gate)
async function releaseApplication(applicationId: string, data: {
  released_by: string;
  share_calls_with_client?: Array<{ room_id: string; share?: boolean }>;
  share_calls_with_candidate?: Array<{ room_id: string; share?: boolean }>;
  status?: string;
}) {
  return bpocApi(\`/applications/\${applicationId}/release\`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// NEW: Send application back to recruiter (Recruiter Gate)
async function sendBackToRecruiter(applicationId: string, reason: string, requestedBy?: string) {
  return bpocApi(\`/applications/\${applicationId}/send-back\`, {
    method: 'POST',
    body: JSON.stringify({ reason, requested_by: requestedBy }),
  });
}

// Schedule interview
async function scheduleInterview(applicationId: string, type: string, scheduledAt?: string) {
  return bpocApi('/interviews', {
    method: 'POST',
    body: JSON.stringify({ applicationId, type, scheduledAt }),
  });
}

// ============================================
// VIDEO FUNCTIONS (Pro+ Plan)
// ============================================

// Create video room for interview
async function createVideoRoom(data: {
  applicationId: string;
  callType: 'recruiter_prescreen' | 'recruiter_round_1' | 'recruiter_round_2' | 'recruiter_offer' | 'client_round_1' | 'client_round_2' | 'client_final' | 'recruiter_general';
  scheduledFor?: string;
  enableRecording?: boolean;
}) {
  return bpocApi('/video/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get room with fresh join tokens
async function getVideoRoom(roomId: string) {
  return bpocApi(\`/video/rooms/\${roomId}\`);
}

// Update call outcome after interview
async function updateCallOutcome(roomId: string, outcome: string, notes?: string) {
  return bpocApi(\`/video/rooms/\${roomId}\`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ended', outcome, notes }),
  });
}

// List recordings
async function listRecordings(roomId?: string) {
  const params = roomId ? \`?roomId=\${roomId}\` : '';
  return bpocApi(\`/video/recordings\${params}\`);
}

// Get recording with download link
async function getRecording(recordingId: string) {
  return bpocApi(\`/video/recordings/\${recordingId}\`);
}

// Send offer
async function sendOffer(applicationId: string, salary: number, currency = 'PHP') {
  return bpocApi('/offers', {
    method: 'POST',
    body: JSON.stringify({ applicationId, salary, currency }),
  });
}

// Usage example
async function main() {
  // 1. Link client
  const { clientId } = await linkClient('StepTen Inc', 'contact@stepten.com');
  console.log('BPOC Client ID:', clientId);
  
  // 2. Get jobs for this client
  const { jobs } = await getClientJobs(clientId);
  console.log('Jobs:', jobs);
  
  // 3. Submit application when candidate applies
  const { applicationId } = await submitApplication(jobs[0].id, {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
  });
  
  // 4. Client reviews and shortlists
  await updateApplicationStatus(applicationId, 'shortlisted', 'Great candidate!');
  
  // 5. Schedule interview
  await scheduleInterview(applicationId, 'screening', '2025-01-20T10:00:00Z');
  
  // 6. Create video room for the interview
  const videoRoom = await createVideoRoom({
    applicationId,
    callType: 'client_round_1',
    scheduledFor: '2025-01-20T10:00:00Z',
  });
  
  console.log('Send to candidate:', videoRoom.participant.joinUrl);
  console.log('Client joins via:', videoRoom.host.joinUrl);
  
  // 7. After interview - update outcome
  await updateCallOutcome(videoRoom.room.id, 'successful', 'Excellent candidate!');
  
  // 8. Access recording
  const recordings = await listRecordings(videoRoom.room.id);
  if (recordings.recordings.length > 0) {
    const recording = await getRecording(recordings.recordings[0].id);
    console.log('Download URL:', recording.download?.url);
  }
  
  // 9. Send offer after successful interview
  await sendOffer(applicationId, 45000, 'PHP');
  
  // 10. Mark as hired
  await updateApplicationStatus(applicationId, 'hired');
}
`}</code>
              </pre>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">cURL Examples</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 mb-2 font-semibold">Link Client:</p>
                  <pre className="p-3 bg-black/40 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-300">{`curl -X POST "${baseUrl}/clients/get-or-create" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "StepTen Inc", "email": "contact@stepten.com"}'`}</code>
                  </pre>
                </div>

                <div>
                  <p className="text-gray-400 mb-2 font-semibold">List Jobs for Client:</p>
                  <pre className="p-3 bg-black/40 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-300">{`curl -X GET "${baseUrl}/jobs?clientId=b3244902-fcf9-..." \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}"`}</code>
                  </pre>
                </div>

                <div>
                  <p className="text-gray-400 mb-2 font-semibold">Submit Application:</p>
                  <pre className="p-3 bg-black/40 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-300">{`curl -X POST "${baseUrl}/applications" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jobId": "49046ab8-...",
    "candidate": {
      "firstName": "John",
      "lastName": "Doe", 
      "email": "john@example.com"
    }
  }'`}</code>
                  </pre>
                </div>

                <div>
                  <p className="text-gray-400 mb-2 font-semibold">Create Video Room:</p>
                  <pre className="p-3 bg-black/40 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-300">{`curl -X POST "${baseUrl}/video/rooms" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "applicationId": "app-uuid",
    "callType": "client_round_1",
    "recruiterUserId": "recruiter-user-uuid",   // Optional (recommended): BPOC auth.users.id (agency_recruiters.user_id)
    "recruiterName": "Stephen Atcheler",        // Optional (recommended)
    "scheduledFor": "2025-01-20T10:00:00Z"
  }'

# Response includes:
# host.joinUrl → For client/recruiter
# participant.joinUrl → Send to candidate`}</code>
                  </pre>
                </div>

                <div>
                  <p className="text-gray-400 mb-2 font-semibold">Update Call Outcome:</p>
                  <pre className="p-3 bg-black/40 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-300">{`curl -X PATCH "${baseUrl}/video/rooms/room-uuid" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "ended",
    "outcome": "successful",
    "notes": "Excellent candidate!"
  }'`}</code>
                  </pre>
                </div>

                <div>
                  <p className="text-gray-400 mb-2 font-semibold">Get Recording Download:</p>
                  <pre className="p-3 bg-black/40 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-300">{`curl -X GET "${baseUrl}/video/recordings/rec-uuid" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}"

# Response includes download.url (valid for 1 hour)`}</code>
                  </pre>
                </div>

                <div>
                  <p className="text-gray-400 mb-2 font-semibold">🔒 Release Application to Client (Recruiter Gate):</p>
                  <pre className="p-3 bg-black/40 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-300">{`curl -X POST "${baseUrl}/applications/app-uuid/release" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "released_by": "recruiter-uuid-123",
    "share_calls_with_client": [{ "room_id": "room-uuid-1", "share": true }],
    "share_calls_with_candidate": [{ "room_id": "room-uuid-1", "share": true }],
    "status": "shortlisted"
  }'`}</code>
                  </pre>
                </div>

                <div>
                  <p className="text-gray-400 mb-2 font-semibold">🔒 Send Application Back to Recruiter (Recruiter Gate):</p>
                  <pre className="p-3 bg-black/40 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-300">{`curl -X POST "${baseUrl}/applications/app-uuid/send-back" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reason": "Need more information about technical skills",
    "requested_by": "client-uuid-456"
  }'`}</code>
                  </pre>
                </div>

                <div>
                  <p className="text-gray-400 mb-2 font-semibold">List Applications with Mode Filter (Recruiter Gate):</p>
                  <pre className="p-3 bg-black/40 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-300">{`# Get ALL applications (recruiter view)
curl -X GET "${baseUrl}/applications?mode=recruiter" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}"

# Get ONLY released applications (client view - default)
curl -X GET "${baseUrl}/applications?mode=client" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}"`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Endpoint Section Component
function EndpointSection({ icon, title, description, children }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <Card className="bg-white/5 border-white/10">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="text-orange-400">{icon}</div>
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

// Endpoint Component
function Endpoint({ method, path, description, params, body, response }: {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  params?: { name: string; type: string; desc: string }[];
  body?: string;
  response?: string;
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/20 text-emerald-400',
    POST: 'bg-cyan-500/20 text-cyan-400',
    PATCH: 'bg-amber-500/20 text-amber-400',
    PUT: 'bg-purple-500/20 text-purple-400',
    DELETE: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <Badge className={methodColors[method]}>{method}</Badge>
        <code className="text-white font-mono">{path}</code>
      </div>
      <p className="text-gray-400 text-sm mb-3">{description}</p>
      
      {params && (
        <div className="mb-3">
          <p className="text-gray-500 text-xs uppercase mb-1">Query Parameters</p>
          <div className="space-y-1">
            {params.map(p => (
              <div key={p.name} className="text-sm">
                <code className="text-orange-400">{p.name}</code>
                <span className="text-gray-500 mx-2">({p.type})</span>
                <span className="text-gray-400">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {body && (
        <div className="mb-3">
          <p className="text-gray-500 text-xs uppercase mb-1">Request Body</p>
          <pre className="p-2 bg-black/40 rounded text-xs overflow-x-auto">
            <code className="text-gray-300">{body}</code>
          </pre>
        </div>
      )}

      {response && (
        <div>
          <p className="text-gray-500 text-xs uppercase mb-1">Response</p>
          <pre className="p-2 bg-black/40 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto">
            <code className="text-gray-300">{response}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
