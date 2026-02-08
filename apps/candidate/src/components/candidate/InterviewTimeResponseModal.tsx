'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface InterviewTimeResponseModalProps {
  isOpen: boolean
  onClose: () => void
  application: {
    id: string
    interview_scheduled_at?: string
    interview_location?: string
    job?: {
      title?: string
      employer?: {
        company_name?: string
      }
    }
  }
  onConfirm?: (applicationId: string) => Promise<void>
  onDecline?: (applicationId: string) => Promise<void>
}

export function InterviewTimeResponseModal({
  isOpen,
  onClose,
  application,
  onConfirm,
  onDecline,
}: InterviewTimeResponseModalProps) {
  const [loading, setLoading] = useState<'confirm' | 'decline' | null>(null)

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (!onConfirm) return
    setLoading('confirm')
    try {
      await onConfirm(application.id)
      onClose()
    } catch (error) {
      console.error('Failed to confirm interview:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleDecline = async () => {
    if (!onDecline) return
    setLoading('decline')
    try {
      await onDecline(application.id)
      onClose()
    } catch (error) {
      console.error('Failed to decline interview:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-[#0B0B0D] border-white/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">
            Interview Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-gray-300">
              You've been invited for an interview for:
            </p>
            <p className="text-lg font-semibold text-cyan-400">
              {application.job?.title || 'Position'}
            </p>
            <p className="text-sm text-gray-400">
              at {application.job?.employer?.company_name || 'Company'}
            </p>
          </div>

          {application.interview_scheduled_at && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-white font-medium">
                  {new Date(application.interview_scheduled_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(application.interview_scheduled_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
          )}

          {application.interview_location && (
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Clock className="w-4 h-4 mt-0.5" />
              <span>{application.interview_location}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleDecline}
              disabled={loading !== null}
              variant="outline"
              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              {loading === 'decline' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </>
              )}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading !== null}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {loading === 'confirm' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </div>

          <button
            onClick={onClose}
            className="w-full text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            Decide Later
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
