'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface InterviewData {
  interview: {
    id: string;
    scheduledAt: string;
    duration: number;
    timezone: string;
    status: string;
    type: string;
  };
  candidate: {
    id: string;
    fullName: string;
    headline: string | null;
    avatar: string | null;
  };
  job: {
    title: string;
  };
  meeting: {
    url: string;
  };
  canJoin: boolean;
  minutesUntilStart: number;
  joinMessage: string;
}

export default function InterviewLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const interviewId = params.id as string;

  const [data, setData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    async function fetchInterview() {
      try {
        const res = await fetch(`/api/client/jobs/${token}/interviews/${interviewId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to load interview');
        }
        const interviewData = await res.json();
        setData(interviewData);
      } catch (err: any) {
        setError(err.message || 'Failed to load interview');
      } finally {
        setLoading(false);
      }
    }

    if (token && interviewId) {
      fetchInterview();
    }
  }, [token, interviewId]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/client/jobs/${token}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const scheduledTime = new Date(data.interview.scheduledAt);
  const minutesUntilStart = Math.floor((scheduledTime.getTime() - currentTime.getTime()) / (1000 * 60));
  const canJoinNow = minutesUntilStart <= 5 && minutesUntilStart >= -data.interview.duration;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push(`/client/jobs/${token}`)}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Interview Lobby</h1>
          <p className="text-gray-600 mt-1">{data.job.title}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Interview Status Banner */}
          <div className={`p-6 ${canJoinNow ? 'bg-green-50' : minutesUntilStart > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <div className="text-center">
              <div className="text-4xl mb-2">
                {canJoinNow ? '✅' : minutesUntilStart > 0 ? '⏰' : '⏹️'}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {canJoinNow
                  ? 'Interview is Ready!'
                  : minutesUntilStart > 0
                  ? `Interview starts in ${minutesUntilStart} minute${minutesUntilStart !== 1 ? 's' : ''}`
                  : 'Interview has ended'}
              </h2>
              <p className="text-gray-600">
                Scheduled for {scheduledTime.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Candidate Info */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-4">
              {data.candidate.avatar ? (
                <img
                  src={data.candidate.avatar}
                  alt={data.candidate.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-semibold">
                  {data.candidate.fullName.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{data.candidate.fullName}</h3>
                {data.candidate.headline && (
                  <p className="text-gray-600">{data.candidate.headline}</p>
                )}
              </div>
            </div>
          </div>

          {/* Interview Details */}
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900 mb-4">Interview Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Date & Time</p>
                <p className="text-gray-900 font-medium">{scheduledTime.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="text-gray-900 font-medium">{data.interview.duration} minutes</p>
              </div>
              <div>
                <p className="text-gray-600">Timezone</p>
                <p className="text-gray-900 font-medium">{data.interview.timezone}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="text-gray-900 font-medium capitalize">{data.interview.status}</p>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <div className="p-6">
            {canJoinNow ? (
              <div>
                <a
                  href={data.meeting.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-4 bg-green-600 text-white text-center text-lg font-semibold rounded-lg hover:bg-green-700 transition"
                >
                  🎥 Join Video Call Now
                </a>
                <p className="text-sm text-gray-600 text-center mt-4">
                  💡 Tip: Please test your camera and microphone before joining
                </p>
              </div>
            ) : minutesUntilStart > 0 ? (
              <div className="text-center">
                <button
                  disabled
                  className="w-full px-6 py-4 bg-gray-300 text-gray-500 text-lg font-semibold rounded-lg cursor-not-allowed"
                >
                  Join Button Activates 5 Minutes Before Start
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  Come back in {minutesUntilStart} minute{minutesUntilStart !== 1 ? 's' : ''} to join the interview
                </p>
              </div>
            ) : (
              <div className="text-center">
                <button
                  disabled
                  className="w-full px-6 py-4 bg-gray-300 text-gray-500 text-lg font-semibold rounded-lg cursor-not-allowed"
                >
                  Interview Has Ended
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  This interview has concluded. Contact your recruiter for next steps.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📋 Before Joining:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Ensure you have a stable internet connection</li>
            <li>✓ Test your camera and microphone</li>
            <li>✓ Find a quiet location with good lighting</li>
            <li>✓ Close unnecessary applications to improve performance</li>
            <li>✓ Have a copy of your resume handy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
