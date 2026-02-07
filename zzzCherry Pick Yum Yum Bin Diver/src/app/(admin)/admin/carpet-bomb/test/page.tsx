'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Clock,
} from 'lucide-react';

interface SendResult {
  email: string;
  status: 'success' | 'failed';
  error?: string;
  messageId?: string;
}

export default function TestSendPage() {
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    sent: number;
    failed: number;
    details: SendResult[];
  } | null>(null);
  const [emailCount, setEmailCount] = useState(100);
  const [fromEmail, setFromEmail] = useState('onboarding@resend.dev');

  const handleTestSend = async () => {
    if (!confirm(`Send ${emailCount} test emails? This will use your Resend quota.`)) {
      return;
    }

    setSending(true);
    setResults(null);

    try {
      const response = await fetch('/api/admin/carpet-bomb/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: emailCount,
          fromEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test emails');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (error: any) {
      console.error('Test send error:', error);
      alert(error.message || 'Failed to send test emails');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Test Email Sending</h1>
        <p className="text-gray-400">
          Send test emails to verify your Resend configuration is working
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm space-y-4">
        <h2 className="text-xl font-semibold text-white">Test Configuration</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Number of Emails
            </label>
            <input
              type="number"
              value={emailCount}
              onChange={(e) => setEmailCount(parseInt(e.target.value))}
              min={1}
              max={500}
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">Max 500 for testing</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              From Email
            </label>
            <select
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="onboarding@resend.dev">
                onboarding@resend.dev (No domain setup needed)
              </option>
              <option value="team@bpoc.com">team@bpoc.com (Requires verified domain)</option>
              <option value="jobs@bpoc.com">jobs@bpoc.com (Requires verified domain)</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <strong>Note:</strong> If using onboarding@resend.dev, you can only send 100/day. For
            team@bpoc.com, verify your domain first.
          </p>
        </div>

        <button
          onClick={handleTestSend}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending Emails...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Send {emailCount} Test Emails
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 text-center">
              <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{results.total}</p>
              <p className="text-sm text-gray-400 mt-1">Total Attempted</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-400">{results.sent}</p>
              <p className="text-sm text-gray-400 mt-1">Successfully Sent</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-red-400">{results.failed}</p>
              <p className="text-sm text-gray-400 mt-1">Failed</p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Success Rate</span>
              <span className="text-2xl font-bold text-white">
                {results.total > 0
                  ? ((results.sent / results.total) * 100).toFixed(1)
                  : '0'}
                %
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{
                  width: `${results.total > 0 ? (results.sent / results.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Detailed Results ({results.details.length})
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.details.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    result.status === 'success'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  {result.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{result.email}</p>
                    {result.error && (
                      <p className="text-xs text-red-400 mt-1">{result.error}</p>
                    )}
                    {result.messageId && (
                      <p className="text-xs text-gray-500 mt-1">ID: {result.messageId}</p>
                    )}
                  </div>

                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      result.status === 'success'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {results.failed > 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <strong>{results.failed} emails failed.</strong> Common issues: Invalid email
                format, domain not verified, rate limits exceeded.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Instructions */}
      {!results && !sending && (
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">What This Does:</h3>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-start gap-2">
              <Clock className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>
                Sends test emails to {emailCount} leads from your carpet_bomb_leads table
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>Shows you real-time success/failure for each email</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>Verifies your Resend API key and email configuration work</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Using onboarding@resend.dev works without domain setup but
                has daily limits
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
