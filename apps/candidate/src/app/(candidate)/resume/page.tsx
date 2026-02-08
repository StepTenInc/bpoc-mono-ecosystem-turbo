'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Upload, Sparkles, BarChart3, ArrowRight } from 'lucide-react'

export default function ResumePage() {
  const { user } = useAuth()
  const [hasResume, setHasResume] = useState(false)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Resume Center</h1>
        <p className="text-gray-400 mt-2">
          Build, upload, and optimize your professional resume
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/resume/upload">
          <Card className="group cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300">
            <CardHeader>
              <div className="p-3 rounded-lg bg-cyan-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6 text-cyan-400" />
              </div>
              <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
                Upload Resume
              </CardTitle>
              <CardDescription className="text-gray-400">
                Upload your existing resume for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-cyan-400 text-sm">
                <span>Get started</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/resume/build">
          <Card className="group cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300">
            <CardHeader>
              <div className="p-3 rounded-lg bg-purple-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-white group-hover:text-purple-400 transition-colors">
                AI Resume Builder
              </CardTitle>
              <CardDescription className="text-gray-400">
                Create a professional resume with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-purple-400 text-sm">
                <span>Build now</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/resume/analysis">
          <Card className="group cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all duration-300">
            <CardHeader>
              <div className="p-3 rounded-lg bg-green-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-green-400" />
              </div>
              <CardTitle className="text-white group-hover:text-green-400 transition-colors">
                Resume Analysis
              </CardTitle>
              <CardDescription className="text-gray-400">
                Get detailed insights and improvement tips
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-green-400 text-sm">
                <span>Analyze</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Current Resume Status */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            Your Resumes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasResume ? (
            <div className="text-gray-400">
              Your saved resumes will appear here
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No resumes uploaded yet</p>
              <Link href="/resume/upload">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Resume
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
