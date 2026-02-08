'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ArrowLeft,
  File
} from 'lucide-react'

export default function ResumeUploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFile = (file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    
    setError(null)
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    setError(null)
    
    try {
      // TODO: Implement actual upload logic
      await new Promise(resolve => setTimeout(resolve, 2000))
      setUploadComplete(true)
    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link 
        href="/resume" 
        className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Resume Center
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Upload Resume</h1>
        <p className="text-gray-400 mt-2">
          Upload your existing resume for AI-powered analysis
        </p>
      </div>

      {/* Upload Area */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-6">
          {uploadComplete ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload Complete!</h3>
              <p className="text-gray-400 mb-6">Your resume has been uploaded successfully</p>
              <div className="flex gap-3 justify-center">
                <Link href="/resume/analysis">
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                    View Analysis
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-white/10"
                  onClick={() => {
                    setUploadComplete(false)
                    setSelectedFile(null)
                  }}
                >
                  Upload Another
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center transition-all
                  ${dragActive 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-white/20 hover:border-white/40'
                  }
                `}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                
                <div className="p-4 rounded-full bg-cyan-500/20 w-fit mx-auto mb-4">
                  <Upload className="h-8 w-8 text-cyan-400" />
                </div>
                
                <p className="text-white font-medium mb-1">
                  Drag and drop your resume here
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  or click to browse files
                </p>
                <p className="text-gray-500 text-xs">
                  Supports PDF, DOC, DOCX (max 10MB)
                </p>
              </div>

              {selectedFile && (
                <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">{selectedFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedFile(null)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full mt-6 bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resume
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
