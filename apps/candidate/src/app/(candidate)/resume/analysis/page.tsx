'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Upload,
  FileText
} from 'lucide-react'

export default function ResumeAnalysisPage() {
  const { user } = useAuth()
  const [hasResume, setHasResume] = useState(false)

  // Mock analysis data
  const analysisData = {
    overallScore: 72,
    sections: [
      { name: 'Contact Info', score: 100, status: 'complete' },
      { name: 'Work Experience', score: 80, status: 'good' },
      { name: 'Education', score: 90, status: 'good' },
      { name: 'Skills', score: 60, status: 'needs-work' },
      { name: 'Summary', score: 40, status: 'needs-work' },
    ],
    suggestions: [
      'Add more quantifiable achievements to your work experience',
      'Include relevant certifications or training',
      'Expand your professional summary with specific career goals',
      'Add more industry-specific keywords for ATS optimization',
    ]
  }

  if (!hasResume) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link 
          href="/resume" 
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resume Center
        </Link>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Resume to Analyze</h2>
            <p className="text-gray-400 mb-6">
              Upload a resume first to get AI-powered insights and suggestions
            </p>
            <Link href="/resume/upload">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link 
        href="/resume" 
        className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Resume Center
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-green-400" />
          Resume Analysis
        </h1>
        <p className="text-gray-400 mt-2">
          AI-powered insights to improve your resume
        </p>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Overall Score</p>
              <p className="text-5xl font-bold text-white mt-2">{analysisData.overallScore}%</p>
              <p className="text-cyan-400 mt-2">Good - Room for improvement</p>
            </div>
            <div className="w-32 h-32 relative">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray={`${analysisData.overallScore * 2.51} 251`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Scores */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Section Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysisData.sections.map((section) => (
            <div key={section.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {section.status === 'complete' ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : section.status === 'good' ? (
                    <CheckCircle className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                  )}
                  <span className="text-white">{section.name}</span>
                </div>
                <span className="text-gray-400">{section.score}%</span>
              </div>
              <Progress value={section.score} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analysisData.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-400 text-xs font-medium">{index + 1}</span>
                </div>
                <p className="text-gray-300">{suggestion}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
