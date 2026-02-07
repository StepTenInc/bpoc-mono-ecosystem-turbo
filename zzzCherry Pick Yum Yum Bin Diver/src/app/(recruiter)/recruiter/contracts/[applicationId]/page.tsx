'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Building2, 
  User, 
  Calendar,
  DollarSign,
  FileSignature,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileCheck,
  PenTool
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/shared/ui/dialog';
import { Input } from '@/components/shared/ui/input';
import { Checkbox } from '@/components/shared/ui/checkbox';
import Link from 'next/link';
import { toast } from 'sonner';
import { getSessionToken } from '@/lib/auth-helpers';

interface Contract {
  contractId: string;
  generatedAt: string;
  employer: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  employee: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    dateOfBirth?: string;
    nationality: string;
    candidateId?: string;
  };
  position: {
    title: string;
    description: string;
    type: string;
    location: string;
  };
  compensation: {
    salary: number;
    salaryType: string;
    currency: string;
    paymentSchedule: string;
    benefits: string[];
  };
  period: {
    startDate: string;
    probationaryPeriod: string;
    endDate: string | null;
    type: string;
  };
  workingHours: {
    regularHours: string;
    weeklyHours: string;
    restDays: string;
    overtime: string;
  };
  doleTerms: Record<string, string>;
  termination: Record<string, string>;
  additionalTerms: string;
  signatures: {
    candidate: {
      signed: boolean;
      signedAt?: string;
      signatoryName?: string;
      certificateId?: string;
      documentHash?: string;
    };
    employer: {
      signed: boolean;
      signedBy?: string;
    };
  };
  legalCompliance: {
    compliantWith: string;
    jurisdiction: string;
    applicableLaws: string[];
  };
  metadata: {
    applicationId: string;
    offerId: string;
    jobId: string;
    candidateId: string;
    companyId?: string;
    offerAcceptedAt: string;
    contractGeneratedAt: string;
  };
}

export default function ContractViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const applicationId = params.applicationId as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Signature dialog states
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signingInProgress, setSigningInProgress] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // PDF download state
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (user && applicationId) {
      fetchContract();
    }
  }, [user, applicationId]);

  async function fetchContract() {
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/contracts/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user.id
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load contract');
      }

      const data = await response.json();
      setContract(data.contract);
      
      // Pre-fill signature name with employee name if user is the candidate
      if (data.contract?.employee?.name && user.id === data.contract.employee.candidateId) {
        setSignatureName(data.contract.employee.name);
      }
    } catch (err: any) {
      console.error('Error fetching contract:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignContract() {
    if (!signatureName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setSigningInProgress(true);
    
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('Not authenticated');

      const consentText = `I, ${signatureName}, hereby agree to the terms and conditions outlined in this employment contract. I acknowledge that this electronic signature is legally binding under the Philippine E-Commerce Act (RA 8792) and the Labor Code of the Philippines. By signing, I confirm that I have read, understood, and accept all terms, conditions, and obligations stated in this contract.`;

      const response = await fetch(`/api/contracts/${applicationId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signatoryName: signatureName,
          signatureMethod: 'typed_name',
          consentText
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign contract');
      }

      toast.success('Contract signed successfully!');
      setShowSignDialog(false);
      
      // Refresh contract to show updated signature status
      await fetchContract();
      
    } catch (err: any) {
      console.error('Error signing contract:', err);
      toast.error(err.message);
    } finally {
      setSigningInProgress(false);
    }
  }

  async function handleDownloadPDF() {
    setDownloadingPdf(true);
    
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('Not authenticated');

      toast.info('Generating PDF... This may take a moment.');

      const response = await fetch(`/api/contracts/${applicationId}/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user.id
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate PDF');
      }

      // Open the signed URL in a new tab to download
      window.open(data.pdfUrl, '_blank');
      
      toast.success(`PDF generated successfully! ${data.isSigned ? '✓ Signed' : '⚠ Unsigned'}`);
      
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      toast.error(err.message);
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Error Loading Contract</h3>
                <p className="text-sm text-gray-400 mt-1">{error || 'Contract not found'}</p>
              </div>
            </div>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] pb-12">
      {/* Header */}
      <div className="border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/30">
                <FileCheck className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Employment Contract</h1>
                <p className="text-sm text-gray-400 mt-1">Contract ID: {contract.contractId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg border ${
                contract.signatures.candidate.signed 
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              }`}>
                {contract.signatures.candidate.signed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                    Signed
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 inline mr-2" />
                    Pending Signature
                  </>
                )}
              </div>
              
              {/* Show Sign button if candidate hasn't signed yet and user is the candidate */}
              {!contract.signatures.candidate.signed && user.id === contract.employee.candidateId && (
                <Button
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                  onClick={() => setShowSignDialog(true)}
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Sign Contract
                </Button>
              )}
              
              <Button
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* DOLE Compliance Badge */}
          <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-white">DOLE Compliant Contract</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {contract.legalCompliance.compliantWith} • {contract.legalCompliance.jurisdiction}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parties */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Employer */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-5 h-5 text-orange-400" />
                  <h3 className="font-semibold text-white">Employer</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Company:</span>
                    <p className="text-white font-medium">{contract.employer.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Address:</span>
                    <p className="text-white">{contract.employer.address}</p>
                  </div>
                  {contract.employer.email && (
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <p className="text-white">{contract.employer.email}</p>
                    </div>
                  )}
                  {contract.employer.phone && (
                    <div>
                      <span className="text-gray-400">Phone:</span>
                      <p className="text-white">{contract.employer.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employee */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-white">Employee</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <p className="text-white font-medium">{contract.employee.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="text-white">{contract.employee.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Nationality:</span>
                    <p className="text-white">{contract.employee.nationality}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Address:</span>
                    <p className="text-white">{contract.employee.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Position Details */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                Position Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Job Title:</span>
                  <p className="text-white font-medium">{contract.position.title}</p>
                </div>
                <div>
                  <span className="text-gray-400">Employment Type:</span>
                  <p className="text-white capitalize">{contract.position.type}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-400">Location:</span>
                  <p className="text-white">{contract.position.location}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-400">Job Description:</span>
                  <p className="text-white mt-1">{contract.position.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-600/10 border-orange-500/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-400" />
                Compensation & Benefits
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-gray-400 text-sm">Salary</p>
                    <p className="text-2xl font-bold text-white">
                      {contract.compensation.currency} {contract.compensation.salary.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 capitalize">{contract.compensation.salaryType}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Payment Schedule:</p>
                  <p className="text-white">{contract.compensation.paymentSchedule}</p>
                </div>
                {contract.compensation.benefits.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Additional Benefits:</p>
                    <div className="space-y-1">
                      {contract.compensation.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-white text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employment Period */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Employment Period
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Start Date:</span>
                  <p className="text-white font-medium">
                    {new Date(contract.period.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Probationary Period:</span>
                  <p className="text-white">{contract.period.probationaryPeriod}</p>
                </div>
                <div>
                  <span className="text-gray-400">Employment Type:</span>
                  <p className="text-white">{contract.period.type}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DOLE Labor Code Terms */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Philippine Labor Code Protections
              </h3>
              <div className="space-y-3 text-sm">
                {Object.entries(contract.doleTerms).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4">Working Hours</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {Object.entries(contract.workingHours).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <p className="text-white">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Termination Terms */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4">Termination Provisions</h3>
              <div className="space-y-3 text-sm">
                {Object.entries(contract.termination).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <p className="text-white mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-purple-400" />
                Signatures
              </h3>
              <div className="space-y-4">
                {/* Candidate Signature */}
                <div className={`p-4 rounded-lg border ${
                  contract.signatures.candidate.signed
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Employee Signature</p>
                      {contract.signatures.candidate.signed ? (
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="text-emerald-400">✓ Signed by {contract.signatures.candidate.signatoryName}</p>
                          <p className="text-gray-400">
                            {new Date(contract.signatures.candidate.signedAt!).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            Certificate: {contract.signatures.candidate.certificateId}
                          </p>
                        </div>
                      ) : (
                        <p className="text-amber-400 text-sm mt-1">Awaiting signature</p>
                      )}
                    </div>
                    {contract.signatures.candidate.signed && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Employer Signature */}
                <div className="p-4 rounded-lg border bg-white/5 border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Employer Signature</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {contract.signatures.employer.signedBy || contract.employer.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Compliance Footer */}
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-3 text-sm">Applicable Laws & Regulations</h3>
              <div className="flex flex-wrap gap-2">
                {contract.legalCompliance.applicableLaws.map((law, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs text-cyan-300"
                  >
                    {law}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sign Contract Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <PenTool className="w-6 h-6 text-emerald-400" />
              Sign Employment Contract
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              By signing this contract, you acknowledge that you have read, understood, and agree to all terms and conditions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Legal Notice */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300 space-y-2">
                  <p className="font-semibold text-white">Legal E-Signature Notice</p>
                  <p>
                    This electronic signature is legally binding under the Philippine E-Commerce Act (RA 8792) 
                    and the Labor Code of the Philippines. Your signature will be recorded with:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                    <li>Timestamp and date</li>
                    <li>IP address and device information</li>
                    <li>Unique certificate ID</li>
                    <li>SHA-256 document hash for integrity</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Full Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Full Legal Name <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="Enter your full legal name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                disabled={signingInProgress}
              />
              <p className="text-xs text-gray-500">
                Type your full name as it appears on official documents
              </p>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <Checkbox
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                disabled={signingInProgress}
                className="mt-1"
              />
              <div className="flex-1 text-sm text-gray-300">
                <p className="font-medium text-white mb-2">Agreement to Terms</p>
                <p className="text-gray-400 leading-relaxed">
                  I hereby confirm that:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2 ml-2">
                  <li>I have read and understood the entire employment contract</li>
                  <li>I agree to all terms, conditions, and obligations stated</li>
                  <li>I understand this electronic signature is legally binding</li>
                  <li>All information provided is accurate and complete</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSignDialog(false)}
              disabled={signingInProgress}
              className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignContract}
              disabled={!signatureName.trim() || !agreedToTerms || signingInProgress}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              {signingInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4 mr-2" />
                  Sign Contract
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

