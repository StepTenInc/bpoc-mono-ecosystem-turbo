'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { Card, CardContent } from '@/components/shared/ui/card'
import { Label } from '@/components/shared/ui/label'
import { Textarea } from '@/components/shared/ui/textarea'
import { 
  Linkedin, CheckCircle, XCircle, AlertTriangle, Lightbulb, 
  ArrowRight, Copy, Check, ThumbsUp, ThumbsDown, Facebook,
  Sparkles, Target, Award, TrendingUp, FileText, Edit3, Zap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Header from '@/components/shared/layout/Header'

// BPO-specific keywords for analysis
const BPO_KEYWORDS = {
  roles: ['customer service', 'technical support', 'call center', 'bpo', 'contact center', 'csr', 'tsr', 'team leader', 'quality analyst', 'trainer', 'workforce', 'operations'],
  skills: ['communication', 'problem solving', 'multitasking', 'empathy', 'active listening', 'troubleshooting', 'time management', 'adaptability'],
  tools: ['zendesk', 'salesforce', 'freshdesk', 'genesys', 'avaya', 'nice', 'five9', 'microsoft office', 'excel', 'crm'],
  metrics: ['csat', 'nps', 'aht', 'fcr', 'quality score', 'calls per day', 'resolution rate', 'customer satisfaction', '%', 'handled', 'resolved', 'achieved'],
  certs: ['tesda', 'ielts', 'toeic', 'nc ii', 'itil', 'copc']
}

interface AnalysisResult {
  overallScore: number
  sections: {
    headline: { score: number; issues: string[]; suggestions: string[] }
    about: { score: number; issues: string[]; suggestions: string[] }
    experience: { score: number; issues: string[]; suggestions: string[] }
    skills: { score: number; issues: string[]; suggestions: string[] }
  }
  rewrittenHeadline: string
  rewrittenAbout: string
  quickWins: string[]
}

export default function LinkedInOptimizerPage() {
  const { toast } = useToast()
  const [profileText, setProfileText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [rated, setRated] = useState<'up' | 'down' | null>(null)

  const analyzeProfile = async () => {
    if (!profileText.trim()) return
    
    setAnalyzing(true)
    
    // Simulate brief processing
    await new Promise(r => setTimeout(r, 800))
    
    const text = profileText.toLowerCase()
    const lines = profileText.split('\n').filter(l => l.trim())
    
    // Extract sections (basic heuristic)
    const headline = lines[0] || ''
    const aboutIndex = lines.findIndex(l => l.toLowerCase().includes('about') || l.length > 100)
    const about = aboutIndex >= 0 ? lines.slice(aboutIndex, aboutIndex + 5).join(' ') : ''
    
    // Analyze Headline
    const headlineAnalysis = analyzeHeadline(headline)
    
    // Analyze About
    const aboutAnalysis = analyzeAbout(about, text)
    
    // Analyze Experience (look for metrics)
    const expAnalysis = analyzeExperience(text)
    
    // Analyze Skills
    const skillsAnalysis = analyzeSkills(text)
    
    // Calculate overall score
    const overallScore = Math.round(
      (headlineAnalysis.score * 0.25) +
      (aboutAnalysis.score * 0.30) +
      (expAnalysis.score * 0.30) +
      (skillsAnalysis.score * 0.15)
    )
    
    // Generate rewrites
    const rewrittenHeadline = generateHeadlineRewrite(headline, text)
    const rewrittenAbout = generateAboutRewrite(about, text)
    
    // Quick wins
    const quickWins = generateQuickWins(headlineAnalysis, aboutAnalysis, expAnalysis, skillsAnalysis)
    
    setResult({
      overallScore,
      sections: {
        headline: headlineAnalysis,
        about: aboutAnalysis,
        experience: expAnalysis,
        skills: skillsAnalysis
      },
      rewrittenHeadline,
      rewrittenAbout,
      quickWins
    })
    
    setAnalyzing(false)
  }

  function analyzeHeadline(headline: string): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 100
    
    const h = headline.toLowerCase()
    
    if (!headline || headline.length < 10) {
      issues.push('No headline or too short - this is the first thing recruiters see!')
      score -= 35
    }
    
    if (h.includes('looking for') || h.includes('seeking') || h.includes('open to')) {
      issues.push('Avoid "looking for opportunities" - sounds desperate to recruiters')
      suggestions.push('Lead with your expertise, not your job search status')
      score -= 20
    }
    
    if (h.includes('unemployed') || h.includes('job seeker')) {
      issues.push('Never mention unemployment in headline')
      score -= 25
    }
    
    const hasBPOKeyword = BPO_KEYWORDS.roles.some(k => h.includes(k))
    if (!hasBPOKeyword) {
      issues.push('No BPO-related keywords - recruiters search for these!')
      suggestions.push('Add role keywords: Customer Service, Technical Support, etc.')
      score -= 15
    }
    
    if (headline.length > 120) {
      issues.push('Headline too long - keep it punchy and scannable')
      score -= 10
    }
    
    if (!/\d/.test(headline)) {
      suggestions.push('Add metrics: "5+ years" or "500+ calls/day" makes you stand out')
    }
    
    return { score: Math.max(0, score), issues, suggestions }
  }

  function analyzeAbout(about: string, fullText: string): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 100
    
    const wordCount = about.split(/\s+/).length
    
    if (wordCount < 50) {
      issues.push('About section too short - recruiters want to know your story')
      suggestions.push('Aim for 150-300 words covering your experience, skills, and what makes you unique')
      score -= 30
    } else if (wordCount < 100) {
      suggestions.push('Add more detail - explain your BPO journey and achievements')
      score -= 15
    }
    
    const hasMetrics = BPO_KEYWORDS.metrics.some(m => fullText.includes(m))
    if (!hasMetrics) {
      issues.push('No metrics or achievements mentioned')
      suggestions.push('Add numbers: "Maintained 95% CSAT", "Handled 100+ calls daily"')
      score -= 20
    }
    
    const a = about.toLowerCase()
    if (a.includes('hard worker') || a.includes('team player') || a.includes('go-getter')) {
      issues.push('Avoid clichés like "hard worker" or "team player" - show, don\'t tell')
      score -= 10
    }
    
    if (!a.includes('i ') && !a.includes("i'm") && !a.includes('my ')) {
      suggestions.push('Write in first person (I, my) - it\'s more engaging')
    }
    
    const hasTools = BPO_KEYWORDS.tools.some(t => fullText.includes(t))
    if (!hasTools) {
      suggestions.push('Mention tools you know: Zendesk, Salesforce, etc.')
      score -= 10
    }
    
    return { score: Math.max(0, score), issues, suggestions }
  }

  function analyzeExperience(text: string): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 100
    
    const hasNumbers = /\d+/.test(text)
    const hasPercentages = /%/.test(text)
    const hasActionVerbs = /(achieved|increased|reduced|managed|led|improved|handled|resolved|maintained)/i.test(text)
    
    if (!hasNumbers) {
      issues.push('No numbers in experience - quantify your achievements!')
      suggestions.push('Add metrics: calls handled, CSAT scores, team size, etc.')
      score -= 25
    }
    
    if (!hasPercentages) {
      suggestions.push('Add percentages: "Improved CSAT by 15%", "99% attendance"')
      score -= 10
    }
    
    if (!hasActionVerbs) {
      issues.push('Missing action verbs - start bullets with Achieved, Led, Improved')
      score -= 15
    }
    
    const hasBPOTerms = ['aht', 'csat', 'nps', 'fcr', 'quality score', 'call volume'].some(t => text.includes(t))
    if (!hasBPOTerms) {
      suggestions.push('Add BPO metrics: AHT, CSAT, NPS, FCR to show you know the industry')
      score -= 10
    }
    
    return { score: Math.max(0, score), issues, suggestions }
  }

  function analyzeSkills(text: string): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 100
    
    const foundSkills = BPO_KEYWORDS.skills.filter(s => text.includes(s))
    const foundTools = BPO_KEYWORDS.tools.filter(t => text.includes(t))
    
    if (foundSkills.length < 3) {
      issues.push('Few relevant skills detected')
      suggestions.push(`Add skills like: ${BPO_KEYWORDS.skills.slice(0, 5).join(', ')}`)
      score -= 20
    }
    
    if (foundTools.length === 0) {
      issues.push('No BPO tools mentioned')
      suggestions.push(`Add tools: ${BPO_KEYWORDS.tools.slice(0, 5).join(', ')}`)
      score -= 15
    }
    
    const hasCerts = BPO_KEYWORDS.certs.some(c => text.includes(c))
    if (!hasCerts) {
      suggestions.push('Mention certifications: TESDA NC II, IELTS score, etc.')
      score -= 10
    }
    
    return { score: Math.max(0, score), issues, suggestions }
  }

  function generateHeadlineRewrite(current: string, fullText: string): string {
    const templates = [
      "Customer Service Professional | [X]+ Years BPO Experience | [Skill] Expert",
      "Technical Support Specialist | Zendesk & Salesforce | 95%+ CSAT",
      "Senior CSR | Voice & Non-Voice | Healthcare/Finance Account Experience",
      "BPO Team Leader | Managing 15+ Agents | COPC Certified",
      "Quality Analyst | Call Center QA | Driving CSAT Improvements"
    ]
    
    // Try to personalize based on detected info
    const hasYears = fullText.match(/(\d+)\s*(years?|yrs?)/i)
    const hasTechSupport = /technical support|tech support|tsr/i.test(fullText)
    const hasTeamLead = /team lead|supervisor|manage|led/i.test(fullText)
    
    if (hasTeamLead) {
      return `BPO Team Leader | ${hasYears ? hasYears[1] + '+ Years' : '5+ Years'} Experience | Coaching & Quality Focus`
    }
    if (hasTechSupport) {
      return `Technical Support Specialist | ${hasYears ? hasYears[1] + '+ Years' : '3+ Years'} | Troubleshooting Expert | High CSAT`
    }
    
    return `Customer Service Professional | ${hasYears ? hasYears[1] + '+ Years' : '2+ Years'} BPO Experience | Voice & Non-Voice`
  }

  function generateAboutRewrite(current: string, fullText: string): string {
    const hasYears = fullText.match(/(\d+)\s*(years?|yrs?)/i)
    const years = hasYears ? hasYears[1] : '3'
    
    return `Results-driven BPO professional with ${years}+ years of experience in customer service and technical support. Known for maintaining high CSAT scores (95%+) while handling 100+ customer interactions daily.

Key Strengths:
• Strong communication and problem-solving skills
• Proficient in Zendesk, Salesforce, and multiple CRM platforms
• Experience in voice and non-voice support channels
• Consistent top performer in quality metrics

I thrive in fast-paced environments and am passionate about delivering exceptional customer experiences. Looking to leverage my skills in a growth-oriented organization.

Open to: Customer Service, Technical Support, Quality Analyst roles`
  }

  function generateQuickWins(headline: any, about: any, exp: any, skills: any): string[] {
    const wins: string[] = []
    
    if (headline.score < 70) wins.push('Rewrite your headline with BPO keywords and metrics')
    if (about.score < 70) wins.push('Expand your About section to 150+ words')
    if (exp.score < 70) wins.push('Add numbers to every experience bullet point')
    if (skills.score < 70) wins.push('Add 10+ relevant skills to your profile')
    
    // Always include these
    wins.push('Add a professional headshot (profiles with photos get 21x more views)')
    wins.push('Get 3+ recommendations from colleagues or supervisors')
    
    return wins.slice(0, 5)
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast({ title: 'Copied!', description: 'Paste it into your LinkedIn profile' })
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/30' }
    if (score >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/30' }
    return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30' }
  }

  const shareScore = () => {
    if (!result) return
    const text = encodeURIComponent(`I scored ${result.overallScore}/100 on the BPOC LinkedIn Optimizer! 💼 Check how recruiter-ready YOUR profile is:`)
    const url = encodeURIComponent('https://bpoc.io/tools/linkedin-optimizer')
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank')
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-black to-indigo-950 opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]" />

        <div className="relative z-10 container mx-auto px-4 py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-300">
              <Linkedin className="w-5 h-5 mr-2 inline" />
              Profile Analysis Tool
            </Badge>

            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                LinkedIn Profile
              </span>
              <br />
              <span className="text-white">Optimizer</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get specific, actionable tips to make your profile stand out to BPO recruiters.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardContent className="p-6 md:p-8 space-y-6">
                      <div>
                        <Label className="text-white mb-2 block text-lg">Paste Your LinkedIn Profile</Label>
                        <p className="text-gray-500 text-sm mb-4">
                          Go to your LinkedIn profile → Click the 3 dots → "Save to PDF" → Copy the text here.
                          Or just copy/paste your headline, about, and experience sections.
                        </p>
                        <Textarea
                          value={profileText}
                          onChange={e => setProfileText(e.target.value)}
                          placeholder={`Paste your profile here. Include:

• Your headline (the text under your name)
• Your About section
• Your Experience (job titles, descriptions)
• Skills listed on your profile

Example:
John Dela Cruz
Customer Service Representative

About:
Dedicated customer service professional with 3 years of experience...

Experience:
Customer Service Representative at ABC Company
• Handled 100+ calls daily
• Maintained 95% CSAT score...`}
                          className="min-h-[300px] bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none"
                        />
                      </div>

                      <Button
                        onClick={analyzeProfile}
                        disabled={!profileText.trim() || analyzing}
                        className="w-full py-6 text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50"
                      >
                        {analyzing ? (
                          <>Analyzing...</>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Analyze My Profile
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Score Card */}
                  <Card className={`bg-gradient-to-br ${getScoreColor(result.overallScore).bg}/20 ${getScoreColor(result.overallScore).border} backdrop-blur-xl`}>
                    <CardContent className="p-8 text-center">
                      <div className="relative inline-block mb-4">
                        <svg className="w-32 h-32">
                          <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                          <circle 
                            cx="64" cy="64" r="56" fill="none" 
                            stroke={result.overallScore >= 80 ? '#22c55e' : result.overallScore >= 60 ? '#eab308' : '#ef4444'}
                            strokeWidth="8" 
                            strokeDasharray={`${result.overallScore * 3.52} 352`}
                            strokeLinecap="round"
                            transform="rotate(-90 64 64)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-4xl font-black ${getScoreColor(result.overallScore).text}`}>
                            {result.overallScore}
                          </span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {result.overallScore >= 80 ? 'Great Profile! 🎉' : 
                         result.overallScore >= 60 ? 'Good, But Room to Improve' : 
                         'Needs Work 💪'}
                      </h2>
                      <p className="text-gray-400">
                        {result.overallScore >= 80 ? 'Your profile is recruiter-ready!' :
                         result.overallScore >= 60 ? 'A few tweaks will make you stand out' :
                         'Follow the tips below to boost your visibility'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Section Breakdown */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(result.sections).map(([key, section]) => (
                      <Card key={key} className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-semibold capitalize">{key}</h3>
                            <Badge className={`${getScoreColor(section.score).bg}/20 ${getScoreColor(section.score).text}`}>
                              {section.score}/100
                            </Badge>
                          </div>
                          
                          {section.issues.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {section.issues.map((issue, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-400">{issue}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {section.suggestions.length > 0 && (
                            <div className="space-y-1">
                              {section.suggestions.slice(0, 2).map((sug, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-400">{sug}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Rewritten Content */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6 space-y-6">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-blue-400" />
                        Suggested Rewrites (Copy These!)
                      </h3>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-blue-400">Better Headline</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.rewrittenHeadline, 'headline')}
                            className="text-gray-400 hover:text-white"
                          >
                            {copiedField === 'headline' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <div className="p-3 bg-black/40 rounded-lg text-white">
                          {result.rewrittenHeadline}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-blue-400">Better About Section</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.rewrittenAbout, 'about')}
                            className="text-gray-400 hover:text-white"
                          >
                            {copiedField === 'about' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <div className="p-3 bg-black/40 rounded-lg text-gray-300 whitespace-pre-line text-sm">
                          {result.rewrittenAbout}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Wins */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Quick Wins (Do These Today!)
                      </h3>
                      <div className="space-y-2">
                        {result.quickWins.map((win, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                              {i + 1}
                            </div>
                            <span className="text-gray-300">{win}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => { setResult(null); setProfileText(''); }}
                      variant="outline"
                      className="flex-1 border-white/10 text-white hover:bg-white/5"
                    >
                      ← Analyze Another Profile
                    </Button>
                    <Button
                      onClick={shareScore}
                      className="flex-1 bg-[#1877f2] hover:bg-[#166fe5]"
                    >
                      <Facebook className="w-4 h-4 mr-2" /> Share My Score
                    </Button>
                  </div>

                  {/* Rating */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white">Did this help improve your profile?</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRated('up')}
                            className={`p-2 rounded-lg transition-colors ${rated === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'}`}
                          >
                            <ThumbsUp className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setRated('down')}
                            className={`p-2 rounded-lg transition-colors ${rated === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400'}`}
                          >
                            <ThumbsDown className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <p className="text-gray-500 mb-4">Profile ready? Now find your next opportunity!</p>
            <Button 
              asChild
              variant="outline" 
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <a href="/jobs">
                Browse BPO Jobs <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  )
}
