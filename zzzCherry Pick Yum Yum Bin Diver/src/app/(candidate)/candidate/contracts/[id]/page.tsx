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
  FileCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
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

export default function CandidateContractViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const applicationId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
          'x-user-id': user?.id || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load contract');
      }

      const data = await response.json();
      setContract(data.contract);
    } catch (err: any) {
      console.error('Error fetching contract:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignContract(signatureData: { signatoryName: string; signatureMethod: string }) {
    setSigning(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('Not authenticated');

      // Generate consent text
      const consentText = `I, ${signatureData.signatoryName}, hereby accept and agree to all terms and conditions stated in this employment contract. I understand that this constitutes a legally binding agreement under Philippine law (Republic Act 8792 - E-Commerce Act of 2000). I confirm that I have read, understood, and voluntarily agree to the employment terms for the position of ${contract?.position.title} with compensation of ${contract?.compensation.currency} ${contract?.compensation.salary.toLocaleString()} per ${contract?.compensation.salaryType}.`;

      const response = await fetch(`/api/contracts/${applicationId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signatoryName: signatureData.signatoryName,
          signatureMethod: signatureData.signatureMethod,
          consentText: consentText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign contract');
      }

      toast.success('Contract signed successfully!');
      setShowSignDialog(false);

      // Refresh contract data to show updated signature status
      await fetchContract();
    } catch (err: any) {
      console.error('Error signing contract:', err);
      toast.error(err.message || 'Failed to sign contract');
    } finally {
      setSigning(false);
    }
  }

  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('Not authenticated');

      // Call the PDF generation endpoint
      const response = await fetch(`/api/contracts/${applicationId}/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const data = await response.json();

      if (!data.pdfUrl) {
        throw new Error('No PDF URL returned from server');
      }

      // Fetch the PDF from the signed URL
      const pdfResponse = await fetch(data.pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error('Failed to download PDF file');
      }

      // Get the PDF blob
      const blob = await pdfResponse.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with contract details
      const filename = `Employment_Contract_${contract?.position.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Contract downloaded successfully!');
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      toast.error(err.message || 'Failed to download contract. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your contract...</p>
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
            <Link href="/candidate/placement">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Placement
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] pb-12">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 px-4 sm:px-8 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/candidate/placement">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Placement
              </Button>
            </Link>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex-shrink-0">
                <FileCheck className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-white">Your Employment Contract</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Contract ID: {contract.contractId}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className={`px-3 sm:px-4 py-2 rounded-lg border text-sm ${
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
                    Pending
                  </>
                )}
              </div>
              {!contract.signatures.candidate.signed && (
                <Button
                  className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold shadow-lg min-h-[44px] text-sm"
                  onClick={() => setShowSignDialog(true)}
                >
                  <FileSignature className="w-4 h-4 mr-2" />
                  Sign Contract
                </Button>
              )}
              <Button
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 min-h-[44px] text-sm"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
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
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
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
                  <Building2 className="w-5 h-5 text-cyan-400" />
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
                  <User className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-white">Employee (You)</h3>
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
                <FileText className="w-5 h-5 text-cyan-400" />
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
          <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-600/10 border-cyan-500/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                Your Compensation & Benefits
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
                <Calendar className="w-5 h-5 text-purple-400" />
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
                    <div className="flex-1">
                      <p className="text-white font-medium">Your Signature</p>
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
                        <div className="mt-2">
                          <p className="text-amber-400 text-sm mb-3">Awaiting your signature</p>
                          <Button
                            onClick={() => setShowSignDialog(true)}
                            className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white"
                          >
                            <FileSignature className="w-4 h-4 mr-2" />
                            Sign Now
                          </Button>
                        </div>
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
          <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
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

      {/* E-Signature Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="bg-[#0B0B0D] border-cyan-500/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <FileSignature className="w-6 h-6 text-cyan-400" />
              Sign Your Employment Contract
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete your e-signature to finalize your employment agreement
            </DialogDescription>
          </DialogHeader>

          <ContractSignatureCapture
            applicationId={applicationId}
            contractDetails={{
              position: contract?.position.title || '',
              salary: contract?.compensation.salary || 0,
              currency: contract?.compensation.currency || 'PHP',
              salaryType: contract?.compensation.salaryType || 'month',
            }}
            candidateName={contract?.employee.name || ''}
            onSignatureComplete={handleSignContract}
            signing={signing}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Contract Signature Capture Component (adapted from ESignatureCapture)
interface ContractSignatureCaptureProps {
  applicationId: string;
  contractDetails: {
    position: string;
    salary: number;
    currency: string;
    salaryType: string;
  };
  candidateName: string;
  onSignatureComplete: (data: { signatoryName: string; signatureMethod: string }) => void;
  signing: boolean;
}

function ContractSignatureCapture({
  applicationId,
  contractDetails,
  candidateName,
  onSignatureComplete,
  signing,
}: ContractSignatureCaptureProps) {
  const [step, setStep] = useState<'consent' | 'confirm'>('consent');
  const [fullName, setFullName] = useState(candidateName);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const consentText = `I, ${fullName || '[Your Name]'}, hereby accept and agree to all terms and conditions stated in this employment contract. I understand that this constitutes a legally binding agreement under Philippine law (Republic Act 8792 - E-Commerce Act of 2000). I confirm that I have read, understood, and voluntarily agree to the employment terms for the position of ${contractDetails.position} with compensation of ${contractDetails.currency} ${contractDetails.salary.toLocaleString()} per ${contractDetails.salaryType}.`;

  const handleSign = () => {
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!hasReadTerms) {
      toast.error('Please confirm that you have read and agree to all terms');
      return;
    }

    onSignatureComplete({
      signatoryName: fullName,
      signatureMethod: 'click_to_sign',
    });
  };

  return (
    <div className="space-y-4">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {step === 'consent' && (
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Electronic Signature Agreement
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Please review the contract terms before signing
                  </p>
                </div>
              </div>

              {/* Contract Summary */}
              <div className="mb-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium text-white mb-2">Contract Details:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Position:</span>
                    <span className="text-white font-medium">{contractDetails.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Compensation:</span>
                    <span className="text-emerald-400 font-semibold">
                      {contractDetails.currency} {contractDetails.salary.toLocaleString()} / {contractDetails.salaryType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Consent Text */}
              <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-400 font-medium">
                    Legal Agreement (Republic Act 8792)
                  </p>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {consentText}
                </p>
              </div>

              <Button
                onClick={() => setStep('confirm')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                I Have Read and Understand
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && (
          <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <FileSignature className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Confirm Your Identity
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Please enter your full legal name exactly as it appears on official documents
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Full Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Juan Dela Cruz"
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    autoFocus
                    disabled={signing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be used as your legal signature
                  </p>
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={hasReadTerms}
                    onChange={(e) => setHasReadTerms(e.target.checked)}
                    className="mt-1 cursor-pointer"
                    disabled={signing}
                  />
                  <label htmlFor="consent" className="text-sm text-gray-300 cursor-pointer flex-1">
                    I confirm that I have read, understood, and agree to all terms and conditions of this employment contract. I understand this is a legally binding electronic signature under Philippine law (RA 8792).
                  </label>
                </div>

                {/* Legal Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Legally Binding
                  </span>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs flex items-center gap-1">
                    <FileCheck className="h-3 w-3" />
                    Secure & Encrypted
                  </span>
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Timestamp Verified
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('consent')}
                    className="flex-1"
                    disabled={signing}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSign}
                    disabled={!fullName.trim() || !hasReadTerms || signing}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                  >
                    {signing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <FileSignature className="mr-2 h-4 w-4" />
                        Sign Contract
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

