'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight,
  Play,
  Brain,
  FileText,
  Wrench,
  Briefcase,
  Target,
  Check,
  Upload,
  Sparkles,
  CheckCircle2,
  BarChart3,
  UserPlus,
  Rocket,
  Loader2,
  Star,
  Trophy
} from 'lucide-react'

// Local number formatter to avoid runtime reference issues
const formatNumberLocal = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat('en-US').format(safeValue)
}
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card'
import { AnimatedLogo } from '@/components/shared/ui/AnimatedLogo'

const typingText = [
  'Your BPO Career Starts Here',
  'AI-Powered Success',
  'Skills That Matter',
  'Dream Jobs Await'
]

const demoTabs = [
  { id: 'process', label: 'I Want a Job', icon: Rocket },
  { id: 'resume', label: 'Resume Builder', icon: FileText },
  // Career Games tab removed - feature deprecated
]

export default function Hero() {
  const router = useRouter()
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(150)
  const [activeTab, setActiveTab] = useState(0)
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    activeResumes: 0,
    activeJobs: 0
  })
  const [loading, setLoading] = useState(true)
  const resumePreviewScrollRef = useRef<HTMLDivElement>(null)

  // Resume Builder Simulation State
  const [resumeStep, setResumeStep] = useState(0) // 0: Upload, 1: Processing, 2: Extraction Complete, 3: AI Analysis, 4: AI Results, 5: Building Resume, 6: Resume Complete, 6.5: Button Click, 7: Preview
  const [resumeProgress, setResumeProgress] = useState(0)
  const [resumeLogs, setResumeLogs] = useState<string[]>([])
  const [simulatedFile, setSimulatedFile] = useState<File | null>(null)

  // Career Games Demo State
  const [gameDemoStep, setGameDemoStep] = useState(0) // 0: Typing Hero, 1: DISC
  
  // Typing Hero Demo State
  const [typingDemoWord, setTypingDemoWord] = useState('')
  const [typingDemoEffect, setTypingDemoEffect] = useState<string | null>(null)
  const typingWords = ['assist', 'create', 'design', 'manage']
  const [typingWordIndex, setTypingWordIndex] = useState(0)

  // DISC Demo State
  const [discScenarioIndex, setDiscScenarioIndex] = useState(0)
  const [discSelectedOption, setDiscSelectedOption] = useState<number | null>(null)
  const [discReaction, setDiscReaction] = useState<{ animal: string, trait: string } | null>(null)
  
  const discScenarios = [
    {
      context: 'WORK',
      title: '📞 Angry Customer',
      options: [
        { text: 'Apologize sincerely', type: 'I', animal: '🦚', trait: 'Social Star' },
        { text: 'Solve immediately', type: 'D', animal: '🦅', trait: 'Dominant' },
        { text: 'Listen carefully', type: 'S', animal: '🐢', trait: 'Steady' },
        { text: 'Analyze root cause', type: 'C', animal: '🦉', trait: 'Analyst' }
      ]
    },
    {
      context: 'FAMILY',
      title: '💰 Money Problem',
      options: [
        { text: 'Strict rules', type: 'D', animal: '🦅', trait: 'Dominant' },
        { text: 'Discuss openly', type: 'I', animal: '🦚', trait: 'Social Star' },
        { text: 'Help unconditionally', type: 'S', animal: '🐢', trait: 'Steady' },
        { text: 'Plan budget', type: 'C', animal: '🦉', trait: 'Analyst' }
      ]
    }
  ]

  // Process Demo State
  const [processStep, setProcessStep] = useState(0)

  const handleBuildResume = () => {
    router.push('/try-resume-builder')
  }

  // Auto-rotate tabs - longer for resume builder to show full flow
  useEffect(() => {
    const getTabDuration = (tabIndex: number) => {
      const tabId = demoTabs[tabIndex].id
      // Resume builder needs more time to show all steps
      if (tabId === 'resume') return 18000 
      if (tabId === 'process') return 12000
      return 10000 
    }

    let timeoutId: NodeJS.Timeout
    const scheduleNext = () => {
      const duration = getTabDuration(activeTab)
      timeoutId = setTimeout(() => {
      setActiveTab((prev) => (prev + 1) % demoTabs.length)
        scheduleNext()
      }, duration)
    }

    scheduleNext()
    return () => clearTimeout(timeoutId)
  }, [activeTab])

  // Process Demo Loop
  useEffect(() => {
    if (demoTabs[activeTab].id === 'process') {
      const interval = setInterval(() => {
        setProcessStep((prev) => (prev + 1) % 4)
      }, 3000)
      return () => clearInterval(interval)
    } else {
      setProcessStep(0)
    }
  }, [activeTab])

  // Game Demo Sequencer
  useEffect(() => {
    if (demoTabs[activeTab].id === 'tools') {
      // Reset to Typing Hero initially
      setGameDemoStep(0)
      
      // Switch to DISC after 5 seconds
      const timer = setTimeout(() => {
        setGameDemoStep(1)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [activeTab])

  // Track if resume simulation is active
  const simulationActiveRef = useRef(false)

  // Reset resume simulation when tab changes
  useEffect(() => {
    if (demoTabs[activeTab].id === 'resume') {
      // Reset state immediately
      simulationActiveRef.current = true
      setResumeStep(0)
      setResumeProgress(0)
      setResumeLogs([])
      setSimulatedFile(null)
      
      // Start simulation sequence
      const sequence = async () => {
        // Step 0: Simulate file upload after 0.8s
        await new Promise(r => setTimeout(r, 800))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setSimulatedFile({ name: 'my_resume.pdf', size: 1024 * 1024, type: 'application/pdf' } as File)
        
        // Step 1: Start processing after 1s
        await new Promise(r => setTimeout(r, 1000))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setResumeStep(1)
        
        // Simulate extraction logs
        const extractionLogs = [
          '🚀 Starting CloudConvert + GPT OCR pipeline',
          '📋 New Process: File → CloudConvert',
          '🎯 CloudConvert handles document conversion',
          '📤 Step 1: Converting file to JPEG format',
          '✅ Step 1 Complete: File converted to JPEG format',
          '🤖 Step 2: Performing GPT Vision OCR',
          '✅ Step 2 Complete: Text extracted via GPT OCR',
          '📄 Step 3: Creating organized DOCX',
          '✅ Pipeline Complete: Processing successful'
        ]
        
        for (let i = 0; i < extractionLogs.length; i++) {
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            await new Promise(r => setTimeout(r, 250))
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            
            setResumeLogs(prev => {
                // Avoid duplicates
                if (prev.includes(extractionLogs[i])) return prev
                return [...prev, extractionLogs[i]]
            })
            setResumeProgress(((i + 1) / extractionLogs.length) * 100)
        }
        
        // Step 2: Extraction Complete
        await new Promise(r => setTimeout(r, 200))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setResumeStep(2)
        setResumeProgress(100)
        
        // Wait a bit before moving to AI analysis
        await new Promise(r => setTimeout(r, 800))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        
        // Step 3: AI Analysis
        setResumeStep(3)
        setResumeProgress(0)
        setResumeLogs([]) // Clear logs for AI analysis phase
        
        // Simulate AI analysis logs
        const aiAnalysisLogs = [
          '🤖 Initializing AI analysis engine',
          '📊 Analyzing extracted resume data',
          '🔍 Identifying key skills and experiences',
          '💡 Evaluating content quality and relevance',
          '📈 Assessing ATS compatibility',
          '✨ Generating improvement suggestions',
          '🎯 Optimizing keyword density',
          '✅ Step 1: Skills analysis complete',
          '✅ Step 2: Experience validation complete',
          '✅ Step 3: Content optimization complete',
          '✅ Step 4: ATS score calculated',
          '🎉 AI analysis complete!'
        ]
        
        for (let i = 0; i < aiAnalysisLogs.length; i++) {
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            await new Promise(r => setTimeout(r, 250))
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            
            setResumeLogs(prev => {
                // Avoid duplicates
                if (prev.includes(aiAnalysisLogs[i])) return prev
                return [...prev, aiAnalysisLogs[i]]
            })
            setResumeProgress(((i + 1) / aiAnalysisLogs.length) * 100)
        }
        
        // Wait before showing results
        await new Promise(r => setTimeout(r, 500))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        
        // Step 4: Show AI Analysis Results
        setResumeStep(4)
        setResumeProgress(100)
        
        // Wait a bit to show results
        await new Promise(r => setTimeout(r, 2000))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        
        // Step 5: Building Resume
        setResumeStep(5)
        setResumeProgress(0)
        setResumeLogs([]) // Clear logs for building phase
        
        // Simulate building logs
        const buildingLogs = [
          '🎨 Analyzing extracted data structure',
          '📝 Organizing sections: Experience, Education, Skills',
          '✨ Applying AI-powered formatting',
          '🎯 Optimizing content for ATS compatibility',
          '💼 Adding professional sections',
          '✅ Step 1: Experience section generated',
          '✅ Step 2: Education section formatted',
          '✅ Step 3: Skills section optimized',
          '✅ Step 4: Summary section created',
          '🎉 Resume building complete!'
        ]
        
        for (let i = 0; i < buildingLogs.length; i++) {
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            await new Promise(r => setTimeout(r, 250))
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            
            setResumeLogs(prev => {
                // Avoid duplicates
                if (prev.includes(buildingLogs[i])) return prev
                return [...prev, buildingLogs[i]]
            })
            setResumeProgress(((i + 1) / buildingLogs.length) * 100)
        }
        
        // Step 6: Resume Complete
        await new Promise(r => setTimeout(r, 200))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setResumeStep(6)
        setResumeProgress(100)
        
        // Wait a bit then simulate preview button click
        await new Promise(r => setTimeout(r, 1500))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setResumeStep(6.5) // Show button click animation
        
        // Wait for click animation
        await new Promise(r => setTimeout(r, 500))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setResumeStep(7) // Show preview
      }
      
      sequence()
    } else {
        simulationActiveRef.current = false
    }

    return () => {
        simulationActiveRef.current = false
    }
  }, [activeTab])

  // Typing Hero Demo Loop
  useEffect(() => {
    if (demoTabs[activeTab].id === 'tools' && gameDemoStep === 0) {
      const interval = setInterval(() => {
        // Simulate typing a word
        const word = typingWords[typingWordIndex]
        let currentText = ''
        let charIndex = 0
        
        const typeInterval = setInterval(() => {
          if (charIndex < word.length) {
            currentText += word[charIndex]
            setTypingDemoWord(currentText)
            charIndex++
          } else {
            clearInterval(typeInterval)
            setTypingDemoEffect('🔥 Perfect!')
            setTimeout(() => {
              setTypingDemoEffect(null)
              setTypingDemoWord('')
              setTypingWordIndex((prev) => (prev + 1) % typingWords.length)
            }, 1000)
          }
        }, 100)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [activeTab, gameDemoStep, typingWordIndex])

  // DISC Demo Loop
  useEffect(() => {
    if (demoTabs[activeTab].id === 'tools' && gameDemoStep === 1) {
      const interval = setInterval(() => {
        // 1. Select a random option
        const randomOption = Math.floor(Math.random() * 4)
        setDiscSelectedOption(randomOption)
        
        // 2. Show reaction (animal) after a short delay
        setTimeout(() => {
          const scenario = discScenarios[discScenarioIndex]
          const option = scenario.options[randomOption]
          setDiscReaction({ animal: option.animal, trait: option.trait })
        }, 500)
        
        // 3. Reset and move to next scenario
        setTimeout(() => {
          setDiscSelectedOption(null)
          setDiscReaction(null)
          setDiscScenarioIndex((prev) => (prev + 1) % discScenarios.length)
        }, 2500)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [activeTab, gameDemoStep, discScenarioIndex])

  // Typing animation effect
  useEffect(() => {
    const currentText = typingText[currentTypingIndex]
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentText.length) {
          setDisplayText(currentText.slice(0, displayText.length + 1))
          setTypingSpeed(Math.random() * 100 + 50)
        } else {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(currentText.slice(0, displayText.length - 1))
          setTypingSpeed(25)
        } else {
          setIsDeleting(false)
          setCurrentTypingIndex((prev) => (prev + 1) % typingText.length)
        }
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [displayText, currentTypingIndex, isDeleting, typingSpeed])

  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/platform')
        if (response.ok) {
          const data = await response.json()
          setPlatformStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch platform stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Auto-scroll effect for Resume Preview
  useEffect(() => {
    if (demoTabs[activeTab].id !== 'resume' || resumeStep !== 7) return;
    
    const scrollContainer = resumePreviewScrollRef.current;
    if (!scrollContainer) return;

    let scrollPos = 0;
    let direction = 1; // 1 for down, -1 for up
    const scrollSpeed = 1.2;
    let animationFrameId: number | null = null;
    let isPaused = false;
    let pauseTimeout: NodeJS.Timeout | null = null;

    const scroll = () => {
        if (scrollContainer && resumeStep === 7 && demoTabs[activeTab].id === 'resume') {
            const maxScroll = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
            
            // Check boundaries with a small threshold
            if (direction === 1 && scrollPos >= maxScroll - 2) {
                direction = -1;
                isPaused = true;
                if (pauseTimeout) clearTimeout(pauseTimeout);
                pauseTimeout = setTimeout(() => { 
                    isPaused = false;
                    pauseTimeout = null;
                }, 2000); // Pause at bottom
            } else if (direction === -1 && scrollPos <= 2) {
                direction = 1;
                isPaused = true;
                if (pauseTimeout) clearTimeout(pauseTimeout);
                pauseTimeout = setTimeout(() => { 
                    isPaused = false;
                    pauseTimeout = null;
                }, 2000); // Pause at top
            }

            if (!isPaused && maxScroll > 0) {
                scrollPos += scrollSpeed * direction;
                // Clamp scrollPos
                scrollPos = Math.max(0, Math.min(scrollPos, maxScroll));
                scrollContainer.scrollTop = scrollPos;
            }
        }
        
        // Continue scrolling if still in preview step
        if (resumeStep === 7 && demoTabs[activeTab].id === 'resume') {
            animationFrameId = requestAnimationFrame(scroll);
        }
    };

    // Start after a delay to ensure container is ready and content is rendered
    const startTimeout = setTimeout(() => {
        if (scrollContainer && resumeStep === 7) {
            scrollContainer.scrollTop = 0; // Reset to top
            scrollPos = 0;
            animationFrameId = requestAnimationFrame(scroll);
        }
    }, 1000);

    return () => {
        clearTimeout(startTimeout);
        if (pauseTimeout) clearTimeout(pauseTimeout);
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }
    };
  }, [activeTab, resumeStep]);

  const renderDemoContent = () => {
    const currentTab = demoTabs[activeTab]
    
    switch (currentTab.id) {
      case 'process':
        const steps = [
          { icon: UserPlus, title: 'Create Account', desc: 'Join for free' },
          { icon: FileText, title: 'Build Profile', desc: 'AI Resume' },
          { icon: Wrench, title: 'Test Skills', desc: 'Play Games' },
          { icon: Briefcase, title: 'Get Hired', desc: 'Start Working' }
        ]
        
        return (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">How It Works</span>
              </div>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                Simple Steps
              </Badge>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-6">
               {steps.map((step, index) => (
                 <motion.div 
                    key={index}
                    initial={{ opacity: 0.5, x: -20 }}
                    animate={{ 
                      opacity: processStep === index ? 1 : 0.5,
                      x: processStep === index ? 0 : -10,
                      scale: processStep === index ? 1.05 : 1
                    }}
                    className={`flex items-center p-3 rounded-xl transition-colors duration-300 ${
                      processStep === index ? 'bg-white/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' : 'bg-transparent border border-transparent'
                    }`}
                 >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      processStep === index ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white' : 'bg-white/5 text-gray-500'
                    }`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${processStep === index ? 'text-white' : 'text-gray-400'}`}>{step.title}</h3>
                      <p className="text-xs text-gray-500">{step.desc}</p>
                    </div>
                    {processStep === index && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ml-auto"
                      >
                         <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </motion.div>
                    )}
                 </motion.div>
               ))}
            </div>
            
            <div className="pt-2">
               <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:scale-[1.02] transition-transform">
                  Start Your Journey <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
            </div>
          </div>
        )

      case 'resume':
        return (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">Resume Builder</span>
              </div>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                AI Powered
              </Badge>
            </div>

            {/* Resume Builder UI */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {resumeStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full"
                  >
                    <Card className="glass-card border-white/10 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-white text-lg">
                                <Upload className="h-5 w-5 text-cyan-400" />
                                Upload Files
                            </CardTitle>
                            <CardDescription className="text-gray-300 text-xs">
                                Resume • Certificates • Work Samples
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center bg-white/5 relative">
                                <Upload className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                                <h3 className="text-sm font-medium text-white mb-1">Drop Files Here</h3>
                                <p className="text-xs text-gray-400 mb-3">PDF, DOC, DOCX</p>
                                <Button size="sm" variant="outline" className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 text-xs h-8">
                                    Browse Files
                                </Button>
                                {simulatedFile && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute inset-0 bg-gray-900/90 flex items-center justify-center rounded-xl backdrop-blur-sm"
                                    >
                                        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg border border-white/10">
                                            <FileText className="h-4 w-4 text-cyan-400" />
                                            <span className="text-sm text-white">{simulatedFile.name}</span>
                                            <Check className="h-4 w-4 text-green-400" />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                  </motion.div>
                )}

                {resumeStep === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full"
                    >
                        <Card className="glass-card border-purple-500/30 bg-purple-900/10 backdrop-blur-xl h-full overflow-hidden flex flex-col shadow-neon-purple">
                             <div className="p-4 border-b border-purple-500/20 bg-purple-900/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                                    <span className="text-sm font-medium text-white">Extracting Data...</span>
                                </div>
                                <span className="text-xs text-purple-300">{Math.round(resumeProgress)}%</span>
                             </div>
                             <div 
                               className="p-3 bg-black/40 font-mono text-xs overflow-y-auto flex-1 space-y-2 max-h-[200px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                               ref={(el) => {
                                 if (el) {
                                   el.scrollTop = el.scrollHeight;
                                 }
                               }}
                             >
                                {resumeLogs.map((log, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-2"
                                    >
                                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                                        <span className={log.includes('✅') ? 'text-green-400' : 'text-gray-300'}>{log}</span>
                                    </motion.div>
                                ))}
                             </div>
                        </Card>
                    </motion.div>
                )}

                {resumeStep === 2 && (
                     <motion.div
                        key="step2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col justify-center"
                    >
                        <Card className="glass-card border-green-500/30 bg-green-900/10 p-4 text-center">
                             <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-green-500/10">
                                <Check className="h-6 w-6 text-green-400" />
                             </div>
                             <h3 className="text-lg font-bold text-white mb-1">Extraction Complete</h3>
                             <p className="text-sm text-gray-300 mb-4">Your resume has been analyzed and structured.</p>
                             <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white w-full">
                                <Brain className="h-4 w-4 mr-2" />
                                Analyzing with AI...
                             </Button>
                        </Card>
                    </motion.div>
                )}

                {resumeStep === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full"
                    >
                        <Card className="glass-card border-pink-500/30 bg-pink-900/10 backdrop-blur-xl h-full overflow-hidden flex flex-col shadow-lg shadow-pink-500/10">
                             <div className="p-4 border-b border-pink-500/20 bg-pink-900/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-pink-400 animate-pulse" />
                                    <span className="text-sm font-medium text-white">AI Analysis in Progress...</span>
                                </div>
                                <span className="text-xs text-pink-300">{Math.round(resumeProgress)}%</span>
                             </div>
                             <div 
                               className="p-3 bg-black/40 font-mono text-xs overflow-y-auto flex-1 space-y-2 max-h-[200px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                               ref={(el) => {
                                 if (el) {
                                   el.scrollTop = el.scrollHeight;
                                 }
                               }}
                             >
                                {resumeLogs.map((log, i) => (
                                    <motion.div  
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-2"
                                    >
                                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                                        <span className={log.includes('✅') || log.includes('🎉') ? 'text-green-400' : 'text-gray-300'}>{log}</span>
                                    </motion.div>
                                ))}
                             </div>
                        </Card>
                    </motion.div>
                )}

                {resumeStep === 4 && (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col overflow-hidden"
                    >
                        <Card className="glass-card border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 h-full overflow-hidden flex flex-col">
                            <div className="p-3 border-b border-cyan-500/20 bg-cyan-900/40 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-cyan-400" />
                                    <span className="text-sm font-medium text-white">AI Analysis Results</span>
                                </div>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Complete</Badge>
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                {/* Overall Score */}
                                <div className="flex justify-center mb-2">
                                    <div className="relative w-24 h-24">
                                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="rgba(255,255,255,0.1)"
                                                strokeWidth="8"
                                                fill="none"
                                            />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="url(#gradientScore)"
                                                strokeWidth="8"
                                                fill="none"
                                                strokeDasharray="231 251"
                                                className="transition-all duration-1000"
                                            />
                                            <defs>
                                                <linearGradient id="gradientScore" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#06b6d4" />
                                                    <stop offset="100%" stopColor="#8b5cf6" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">92</div>
                                                <div className="text-[10px] text-gray-400">Score</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section Analysis */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-white flex items-center gap-1 mb-2">
                                        <BarChart3 className="h-3 w-3 text-blue-400" />
                                        Section Analysis
                                    </h4>
                                    
                                    {/* Contact Section */}
                                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-semibold text-white">Contact</span>
                                            <span className="text-xs font-bold text-green-400">95/100</span>
                                        </div>
                                    </div>

                                    {/* Summary Section */}
                                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-semibold text-white">Summary</span>
                                            <span className="text-xs font-bold text-yellow-400">88/100</span>
                                        </div>
                                    </div>

                                    {/* Experience Section */}
                                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-semibold text-white">Experience</span>
                                            <span className="text-xs font-bold text-yellow-400">90/100</span>
                                        </div>
                                    </div>

                                    {/* Skills Section */}
                                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-semibold text-white">Skills</span>
                                            <span className="text-xs font-bold text-yellow-400">85/100</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-white flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                                        Recommendations
                                    </h4>
                                    <div className="space-y-1.5">
                                        {[
                                            'Add quantifiable achievements to experience',
                                            'Include more soft skills keywords',
                                            'Optimize summary for impact'
                                        ].map((rec, i) => (
                                            <div key={i} className="flex gap-2 text-[10px] text-gray-300">
                                                <div className="mt-0.5 w-1 h-1 rounded-full bg-cyan-400 flex-shrink-0" />
                                                <span>{rec}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {resumeStep === 5 && (
                    <motion.div
                        key="step5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full"
                    >
                        <Card className="glass-card border-blue-500/30 bg-blue-900/10 backdrop-blur-xl h-full overflow-hidden flex flex-col shadow-lg shadow-blue-500/10">
                             <div className="p-4 border-b border-blue-500/20 bg-blue-900/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-400 animate-pulse" />
                                    <span className="text-sm font-medium text-white">Generating Resume...</span>
                                </div>
                                <span className="text-xs text-blue-300">{Math.round(resumeProgress)}%</span>
                             </div>
                             <div 
                               className="p-3 bg-black/40 font-mono text-xs overflow-y-auto flex-1 space-y-2 max-h-[200px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                               ref={(el) => {
                                 if (el) {
                                   el.scrollTop = el.scrollHeight;
                                 }
                               }}
                             >
                                {resumeLogs.map((log, i) => (
                                    <motion.div  
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-2"
                                    >
                                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                                        <span className={log.includes('✅') || log.includes('🎉') ? 'text-green-400' : 'text-gray-300'}>{log}</span>
                                    </motion.div>
                                ))}
                             </div>
                        </Card>
                    </motion.div>
                )}

                {resumeStep >= 6 && (
                    <motion.div
                        key="step6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col justify-center relative"
                    >
                        {resumeStep === 6 && (
                            <Card className="glass-card border-green-500/30 bg-green-900/10 p-4 text-center">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-green-500/10">
                                    <Check className="h-6 w-6 text-green-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Resume Ready!</h3>
                                <p className="text-sm text-gray-300 mb-4">Your professional resume has been generated.</p>
                                <Button 
                                    size="sm" 
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white w-full shadow-lg shadow-cyan-500/25"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Resume
                                </Button>
                            </Card>
                        )}
                        {resumeStep === 6.5 && (
                           <Card className="glass-card border-green-500/30 bg-green-900/10 p-4 text-center">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-green-500/10">
                                    <Check className="h-6 w-6 text-green-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Resume Ready!</h3>
                                <p className="text-sm text-gray-300 mb-4">Your professional resume has been generated.</p>
                                <Button 
                                    size="sm" 
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white w-full shadow-lg shadow-cyan-500/25 scale-95 opacity-80"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Resume
                                </Button>
                            </Card> 
                        )}
                        {resumeStep === 7 && (
                            <Card className="glass-card border-white/20 bg-white h-full flex flex-col overflow-hidden relative group">
                                <div className="absolute top-2 right-2 z-10">
                                    <Badge className="bg-black/50 text-white backdrop-blur-md border-0">Preview</Badge>
                                </div>
                                <div 
                                    className="flex-1 overflow-hidden p-4 bg-white text-gray-800"
                                    ref={resumePreviewScrollRef}
                                >
                                    {/* Mock Resume Content */}
                                    <div className="space-y-4 text-[10px] opacity-80 pointer-events-none select-none">
                                        <div className="text-center border-b pb-2">
                                            <div className="h-4 w-32 bg-gray-800 mx-auto mb-1 rounded"></div>
                                            <div className="h-2 w-48 bg-gray-400 mx-auto rounded"></div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-2 space-y-3">
                                                <div>
                                                    <div className="h-3 w-20 bg-gray-700 mb-1 rounded"></div>
                                                    <div className="space-y-1">
                                                        <div className="h-2 w-full bg-gray-300 rounded"></div>
                                                        <div className="h-2 w-5/6 bg-gray-300 rounded"></div>
                                                        <div className="h-2 w-full bg-gray-300 rounded"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="h-3 w-20 bg-gray-700 mb-1 rounded"></div>
                                                    <div className="space-y-1">
                                                        <div className="h-2 w-full bg-gray-300 rounded"></div>
                                                        <div className="h-2 w-4/6 bg-gray-300 rounded"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="h-3 w-16 bg-gray-700 mb-1 rounded"></div>
                                                    <div className="space-y-1">
                                                        <div className="h-2 w-full bg-gray-200 rounded"></div>
                                                        <div className="h-2 w-full bg-gray-200 rounded"></div>
                                                        <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="h-3 w-16 bg-gray-700 mb-1 rounded"></div>
                                                    <div className="space-y-1">
                                                        <div className="h-2 w-full bg-gray-200 rounded"></div>
                                                        <div className="h-2 w-full bg-gray-200 rounded"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* More fake content for scrolling */}
                                        <div className="space-y-2 pt-2">
                                            <div className="h-2 w-full bg-gray-100 rounded"></div>
                                            <div className="h-2 w-full bg-gray-100 rounded"></div>
                                            <div className="h-2 w-3/4 bg-gray-100 rounded"></div>
                                            <div className="h-2 w-full bg-gray-100 rounded"></div>
                                            <div className="h-2 w-5/6 bg-gray-100 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )
      
      case 'tools':
        return (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">Career Games</span>
              </div>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                Assessments
              </Badge>
            </div>

            <div className="flex-1 relative overflow-hidden">
               <AnimatePresence mode="wait">
                  {gameDemoStep === 0 && (
                      <motion.div
                         key="typing"
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: -20 }}
                         className="h-full flex flex-col"
                      >
                         <Card className="glass-card border-orange-500/30 h-full flex flex-col justify-center items-center p-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                            <div className="text-center space-y-4 relative z-10 w-full">
                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mb-2">Typing Hero</Badge>
                                
                                <div className="bg-black/40 rounded-xl p-4 border border-white/10 backdrop-blur-md">
                                    <div className="text-xs text-gray-400 mb-1">Type this word:</div>
                                    <div className="text-2xl font-mono font-bold text-white tracking-wider mb-2">
                                        {typingWords[typingWordIndex]}
                                    </div>
                                    <div className="h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                                        <span className="font-mono text-cyan-400 text-lg animate-pulse">{typingDemoWord}<span className="w-2 h-5 bg-cyan-400 inline-block ml-0.5 animate-blink"></span></span>
                                    </div>
                                </div>

                                {typingDemoEffect && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1.2, opacity: 1 }}
                                        className="text-xl font-bold text-yellow-400 drop-shadow-glow"
                                    >
                                        {typingDemoEffect}
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white/5 p-2 rounded-lg">
                                        <div className="text-gray-400">WPM</div>
                                        <div className="text-white font-bold">45</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-lg">
                                        <div className="text-gray-400">Accuracy</div>
                                        <div className="text-green-400 font-bold">100%</div>
                                    </div>
                                </div>
                            </div>
                         </Card>
                      </motion.div>
                  )}

                  {gameDemoStep === 1 && (
                      <motion.div
                         key="disc"
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: -20 }}
                         className="h-full flex flex-col"
                      >
                          <Card className="glass-card border-purple-500/30 h-full flex flex-col justify-center p-4 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
                              <div className="space-y-3 relative z-10">
                                  <div className="flex justify-center">
                                     <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">DISC Assessment</Badge>
                                  </div>
                                  
                                  <div className="text-center">
                                      <div className="text-[10px] font-bold text-gray-500 tracking-wider mb-1">{discScenarios[discScenarioIndex].context}</div>
                                      <h3 className="text-sm font-bold text-white mb-3">{discScenarios[discScenarioIndex].title}</h3>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                      {discScenarios[discScenarioIndex].options.map((opt, i) => (
                                          <motion.div
                                            key={i}
                                            animate={{
                                                scale: discSelectedOption === i ? 0.95 : 1,
                                                backgroundColor: discSelectedOption === i ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                borderColor: discSelectedOption === i ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.1)'
                                            }}
                                            className="p-2 rounded-lg border text-xs text-center cursor-pointer relative overflow-hidden"
                                          >
                                              <span className="text-gray-300 relative z-10">{opt.text}</span>
                                              {discSelectedOption === i && (
                                                  <motion.div 
                                                    layoutId="selection"
                                                    className="absolute inset-0 bg-purple-500/20 z-0"
                                                  />
                                              )}
                                          </motion.div>
                                      ))}
                                  </div>

                                  {discReaction && (
                                      <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-purple-500/30 text-center"
                                      >
                                          <div className="text-2xl mb-1">{discReaction.animal}</div>
                                          <div className="text-sm font-bold text-white">{discReaction.trait}</div>
                                          <div className="text-[10px] text-gray-400">Analysis Complete</div>
                                      </motion.div>
                                  )}
                              </div>
                          </Card>
                      </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-[#0B0B0D]" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column: Text Content */}
          <div className="space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm shadow-glow-cyan">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-gray-300">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading stats...
                    </span>
                  ) : (
                    <>
                      <span className="text-white font-bold">{formatNumberLocal(platformStats.activeJobs)}+</span> Jobs Available Now
                    </>
                  )}
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight min-h-[3.6em] md:min-h-[2.4em]">
                <span className="block text-white mb-2">Stop Searching.</span>
                <span className="block gradient-text text-glow pb-2">
                  {displayText}
                  <span className="animate-blink inline-block ml-1 w-1 h-[0.8em] bg-cyan-400 align-middle" />
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Skip the endless scrolling. Our AI matches your skills to top BPO companies instantly. 
                Build your resume, test your skills, and get hired—all in one place.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-lg h-14 px-8 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-105 transition-all duration-300 border-0"
                onClick={() => router.push('?signup=true')}
              >
                Start Your Career
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
                onClick={() => router.push('/about')}
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                How It Works
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="pt-8 border-t border-white/10 flex items-center justify-center lg:justify-start space-x-8"
            >
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-[#0B0B0D] bg-gray-800 flex items-center justify-center overflow-hidden relative z-[${5-i}]`}>
                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+20}`} alt="User" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-[#0B0B0D] bg-gray-800 flex items-center justify-center text-xs text-white font-bold relative z-0">
                  +2k
                </div>
              </div>
              <div className="text-sm">
                <div className="flex items-center text-yellow-400 mb-0.5">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="text-gray-400">Trusted by thousands of candidates</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block h-[600px]"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 rounded-[2rem] blur-2xl transform rotate-3 scale-95" />
            
            {/* Main Card Container */}
            <div className="relative h-full bg-[#121214]/80 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
              {/* Card Header / Tabs */}
              <div className="flex border-b border-white/10 bg-black/20 p-2">
                {demoTabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(index)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeTab === index 
                        ? 'bg-white/10 text-white shadow-lg' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${activeTab === index ? 'text-cyan-400' : ''}`} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Card Body */}
              <div className="flex-1 p-6 relative">
                 {renderDemoContent()}
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  System Online
                </div>
                <div>v2.0.4</div>
              </div>
            </div>

            {/* Floating Decorative Elements */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 top-20 glass-card p-4 rounded-2xl border-white/10 shadow-xl shadow-cyan-500/20 max-w-[200px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">New Achievement</div>
                  <div className="text-sm font-bold text-white">Top 1% Typing</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -left-8 bottom-32 glass-card p-4 rounded-2xl border-white/10 shadow-xl shadow-purple-500/20 max-w-[200px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Briefcase className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Job Match</div>
                  <div className="text-sm font-bold text-white">98% Compatibility</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
