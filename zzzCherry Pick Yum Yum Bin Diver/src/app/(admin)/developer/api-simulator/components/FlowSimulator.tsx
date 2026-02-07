'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Card } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import {
  CheckCircle2,
  Circle,
  Loader2,
  UserPlus,
  FileText,
  Briefcase,
  Filter,
  Send,
  Video,
  FileSignature,
  PartyPopper,
  ChevronRight,
  Webhook,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface FlowStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'pending' | 'running' | 'completed' | 'error';
  webhookEvent?: string;
  apiEndpoint?: string;
  testData?: any;
  result?: any;
}

export default function FlowSimulator() {
  const [apiKey] = useState('bpoc_d1e04a4c83cef0444783880f050b7581debc29465ab08c30');
  const [agencyId] = useState('8dc7ed68-5e76-4d23-8863-6ba190b91039');
  const [currentStep, setCurrentStep] = useState(0);
  const [testData, setTestData] = useState<any>({});
  const testDataRef = useRef<any>({}); // Use ref for immediate access

  const [steps, setSteps] = useState<FlowStep[]>([
    {
      id: 'candidate-signup',
      title: '1. Candidate Signs Up',
      description: 'New candidate registers and completes profile',
      icon: UserPlus,
      status: 'pending',
      webhookEvent: 'candidate.created',
      apiEndpoint: 'POST /api/v1/candidates',
    },
    {
      id: 'job-creation',
      title: '2. Client/Recruiter Creates Job',
      description: 'Job posting is created via API or platform',
      icon: Briefcase,
      status: 'pending',
      webhookEvent: 'job.created',
      apiEndpoint: 'POST /api/v1/jobs/create',
    },
    {
      id: 'candidate-applies',
      title: '3. Candidate Applies',
      description: 'Candidate submits application to job',
      icon: FileText,
      status: 'pending',
      webhookEvent: 'application.created',
      apiEndpoint: 'POST /api/v1/applications',
    },
    {
      id: 'recruiter-prescreen',
      title: '4. Recruiter Pre-screens',
      description: 'Recruiter filters and tests candidates',
      icon: Filter,
      status: 'pending',
      webhookEvent: 'application.prescreened',
      apiEndpoint: 'POST /api/v1/applications/[id]/card/prescreen',
    },
    {
      id: 'release-to-client',
      title: '5. Release to Client',
      description: 'Recruiter releases candidate to client',
      icon: Send,
      status: 'pending',
      webhookEvent: 'application.released',
      apiEndpoint: 'POST /api/v1/applications/[id]/release',
    },
    {
      id: 'schedule-interview',
      title: '6. Schedule Interview',
      description: 'Client schedules video interview',
      icon: Video,
      status: 'pending',
      webhookEvent: 'interview.scheduled',
      apiEndpoint: 'POST /api/v1/interviews',
    },
    {
      id: 'send-offer',
      title: '7. Send Job Offer',
      description: 'Client sends offer to candidate',
      icon: FileSignature,
      status: 'pending',
      webhookEvent: 'offer.created',
      apiEndpoint: 'POST /api/v1/offers',
    },
    {
      id: 'negotiate-offer',
      title: '8. Offer Negotiation',
      description: 'Candidate accepts or counter-offers',
      icon: FileText,
      status: 'pending',
      webhookEvent: 'offer.accepted',
      apiEndpoint: 'POST /api/v1/offers/[id]/sign',
    },
    {
      id: 'sign-contract',
      title: '9. Sign Contract',
      description: 'E-signature and contract finalization',
      icon: FileSignature,
      status: 'pending',
      webhookEvent: 'contract.signed',
      apiEndpoint: 'POST /api/v1/applications/[id]/card/hired',
    },
    {
      id: 'hired',
      title: '10. Candidate Hired!',
      description: 'Process complete - candidate is hired',
      icon: PartyPopper,
      status: 'pending',
      webhookEvent: 'application.hired',
    },
  ]);

  const executeStep = async (stepIndex: number) => {
    const step = steps[stepIndex];

    // Update step to running
    setSteps(prev => prev.map((s, i) =>
      i === stepIndex ? { ...s, status: 'running' } : s
    ));

    try {
      let result;

      switch (step.id) {
        case 'candidate-signup':
          result = await createTestCandidate();
          break;
        case 'job-creation':
          result = await createTestJob();
          break;
        case 'candidate-applies':
          result = await submitApplication();
          break;
        case 'recruiter-prescreen':
          result = await prescreenCandidate();
          break;
        case 'release-to-client':
          result = await releaseToClient();
          break;
        case 'schedule-interview':
          result = await scheduleInterview();
          break;
        case 'send-offer':
          result = await sendOffer();
          break;
        case 'negotiate-offer':
          result = await acceptOffer();
          break;
        case 'sign-contract':
          result = await signContract();
          break;
        case 'hired':
          result = { success: true, message: 'Candidate hired successfully!' };
          break;
      }

      // Update step to completed
      setSteps(prev => prev.map((s, i) =>
        i === stepIndex ? { ...s, status: 'completed', result } : s
      ));

      setCurrentStep(stepIndex + 1);

    } catch (error) {
      // Update step to error
      setSteps(prev => prev.map((s, i) =>
        i === stepIndex ? {
          ...s,
          status: 'error',
          result: { error: error instanceof Error ? error.message : 'Unknown error' }
        } : s
      ));
    }
  };

  const createTestCandidate = async () => {
    const candidateEmail = `test.candidate.${Date.now()}@test.com`;

    const response = await fetch('/api/v1/candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        email: candidateEmail,
        firstName: 'Test',
        lastName: 'Candidate',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create candidate: ${response.statusText}`);
    }

    const data = await response.json();
    // Update both state and ref
    testDataRef.current = {
      ...testDataRef.current,
      candidateId: data.id,
      candidateEmail: candidateEmail
    };
    setTestData(testDataRef.current);
    return data;
  };

  const createTestJob = async () => {
    // First, get or create a client
    const clientResponse = await fetch('/api/v1/clients/get-or-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        name: 'Test Client Company',
        email: 'client@testcompany.com',
      }),
    });

    const clientData = await clientResponse.json();
    const clientId = clientData.clientId;

    // Update ref immediately
    testDataRef.current = { ...testDataRef.current, clientId };
    setTestData(testDataRef.current);

    // Create the job
    const response = await fetch('/api/v1/jobs/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        clientId,
        title: 'Customer Service Representative',
        description: 'Handle customer inquiries and provide excellent service',
        requirements: ['Excellent English', '2+ years experience'],
        salaryMin: 25000,
        salaryMax: 35000,
        currency: 'PHP',
        workArrangement: 'remote',
        workType: 'full_time',
        shift: 'day',
        experienceLevel: 'mid_level',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create job: ${response.statusText}`);
    }

    const data = await response.json();
    // Update ref immediately
    testDataRef.current = { ...testDataRef.current, jobId: data.job.id };
    setTestData(testDataRef.current);
    return data;
  };

  const submitApplication = async () => {
    // Read from ref for immediate access
    const candidateEmail = testDataRef.current.candidateEmail || `test.candidate.${Date.now()}@test.com`;
    const jobId = testDataRef.current.jobId;

    if (!jobId) {
      throw new Error('No job ID found. Please run step 2 first.');
    }

    const response = await fetch('/api/v1/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        jobId: jobId,
        candidate: {
          email: candidateEmail,
          firstName: 'Test',
          lastName: 'Candidate',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to submit application: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    // Update ref immediately
    testDataRef.current = { ...testDataRef.current, applicationId: data.applicationId };
    setTestData(testDataRef.current);
    return data;
  };

  const prescreenCandidate = async () => {
    // Simulate prescreen
    return { success: true, message: 'Candidate prescreened' };
  };

  const releaseToClient = async () => {
    // Simulate release
    return { success: true, message: 'Candidate released to client' };
  };

  const scheduleInterview = async () => {
    // Simulate interview scheduling
    return { success: true, message: 'Interview scheduled' };
  };

  const sendOffer = async () => {
    // Simulate offer creation
    return { success: true, message: 'Offer sent to candidate' };
  };

  const acceptOffer = async () => {
    // Simulate offer acceptance
    return { success: true, message: 'Offer accepted' };
  };

  const signContract = async () => {
    // Simulate contract signing
    return { success: true, message: 'Contract signed' };
  };

  const resetFlow = () => {
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending', result: undefined })));
    setCurrentStep(0);
    testDataRef.current = {};
    setTestData({});
  };

  const runFullFlow = async () => {
    for (let i = 0; i < steps.length; i++) {
      await executeStep(i);
      // Small delay between steps for visibility
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Complete Recruitment Flow</h3>
          <p className="text-sm text-slate-400">Test the entire lifecycle step-by-step</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={resetFlow}
            variant="outline"
            className="border-slate-700 text-slate-300"
          >
            Reset Flow
          </Button>
          <Button
            onClick={runFullFlow}
            disabled={currentStep > 0}
            className="bg-gradient-to-r from-cyan-500 to-blue-500"
          >
            Run Full Flow
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-1">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`h-2 flex-1 rounded ${
              step.status === 'completed'
                ? 'bg-green-500'
                : step.status === 'running'
                ? 'bg-cyan-500 animate-pulse'
                : step.status === 'error'
                ? 'bg-red-500'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const canExecute = index === currentStep && step.status !== 'running';

          return (
            <Card
              key={step.id}
              className={`bg-slate-900/50 border p-4 transition-all ${
                isActive
                  ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                  : step.status === 'completed'
                  ? 'border-green-500/30'
                  : step.status === 'error'
                  ? 'border-red-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Status Icon */}
                  <div className={`p-2 rounded-lg ${
                    step.status === 'completed'
                      ? 'bg-green-500/20'
                      : step.status === 'running'
                      ? 'bg-cyan-500/20'
                      : step.status === 'error'
                      ? 'bg-red-500/20'
                      : 'bg-slate-800'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    ) : step.status === 'running' ? (
                      <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
                    ) : step.status === 'error' ? (
                      <AlertCircle className="h-6 w-6 text-red-400" />
                    ) : (
                      <Icon className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold">{step.title}</h4>
                      {step.webhookEvent && (
                        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                          <Webhook className="h-3 w-3 mr-1" />
                          {step.webhookEvent}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{step.description}</p>

                    {step.apiEndpoint && (
                      <code className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                        {step.apiEndpoint}
                      </code>
                    )}

                    {/* Result */}
                    {step.result && (
                      <div className={`mt-3 p-3 rounded text-xs ${
                        step.status === 'error'
                          ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                          : 'bg-green-500/10 border border-green-500/20 text-green-400'
                      }`}>
                        <pre>{JSON.stringify(step.result, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {canExecute && (
                  <Button
                    onClick={() => executeStep(index)}
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    Execute
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
