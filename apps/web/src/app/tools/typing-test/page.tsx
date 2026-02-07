'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { Progress } from '@/components/shared/ui/progress'
import { Zap, Award, ArrowRight, Trophy } from 'lucide-react'
import Header from '@/components/shared/layout/Header'

const TEST_DURATION = 60 // seconds
const SAMPLE_TEXT = "Thank you for contacting our customer support team. I understand your concern regarding your recent order. Let me check the status of your shipment and provide you with an update. I appreciate your patience while I look into this matter for you. Please allow me a moment to review your account details."

export default function TypingTestPage() {
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION)
  const [typedText, setTypedText] = useState('')
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (started && !finished && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setFinished(true)
            calculateResults()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [started, finished, timeLeft])

  useEffect(() => {
    if (started && !finished && typedText.length > 0) {
      const wordsTyped = typedText.trim().split(/\s+/).length
      const timeElapsed = TEST_DURATION - timeLeft
      const currentWpm = timeElapsed > 0 ? Math.round((wordsTyped / timeElapsed) * 60) : 0
      setWpm(currentWpm)

      // Calculate accuracy
      let correct = 0
      for (let i = 0; i < typedText.length && i < SAMPLE_TEXT.length; i++) {
        if (typedText[i] === SAMPLE_TEXT[i]) correct++
      }
      const acc = typedText.length > 0 ? Math.round((correct / typedText.length) * 100) : 100
      setAccuracy(acc)
    }
  }, [typedText, timeLeft, started, finished])

  const startTest = () => {
    setStarted(true)
    setFinished(false)
    setTimeLeft(TEST_DURATION)
    setTypedText('')
    setWpm(0)
    setAccuracy(100)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const calculateResults = () => {
    const wordsTyped = typedText.trim().split(/\s+/).length
    const finalWpm = Math.round((wordsTyped / TEST_DURATION) * 60)
    setWpm(finalWpm)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!started || finished) return
    setTypedText(e.target.value)
  }

  const getColorClass = (char: string, index: number) => {
    if (index >= typedText.length) return 'text-gray-400'
    if (typedText[index] === char) return 'text-green-400'
    return 'text-red-400'
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-950 via-black to-orange-950 opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-yellow-500/10 rounded-full blur-[150px]" />

      {/* Most Popular Badge */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="fixed top-8 right-8 z-50"
      >
        <Badge className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-black font-black text-lg shadow-[0_0_60px_rgba(251,191,36,0.8)]">
          <Trophy className="w-5 h-5 mr-2 inline" />
          MOST POPULAR
        </Badge>
      </motion.div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-6 px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30">
            <Zap className="w-5 h-5 mr-2 inline" />
            Get Verified • ₱50 Certificate
          </Badge>

          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(251,191,36,0.5)]">
              Typing Speed Test
            </span>
          </h1>

          <p className="text-2xl text-gray-400 max-w-2xl mx-auto">
            Test your typing speed and get certified to stand out to recruiters
          </p>
        </motion.div>

        {/* Start Screen */}
        {!started && !finished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-16 border-2 border-gray-800/50 hover:border-yellow-500/70 transition-all duration-500 shadow-[0_30px_90px_-15px_rgba(251,191,36,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

              <div className="relative z-10 text-center space-y-8">
                <Zap className="w-24 h-24 mx-auto text-yellow-400" />
                <p className="text-2xl text-gray-300">You'll have <span className="font-bold text-yellow-400">{TEST_DURATION} seconds</span> to type the passage.</p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={startTest}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 shadow-[0_0_60px_rgba(251,191,36,0.4)] hover:shadow-[0_0_80px_rgba(251,191,36,0.6)] border-0 text-black font-black text-2xl px-12 py-8 rounded-2xl"
                  >
                    Start Test
                    <Zap className="ml-3 w-6 h-6" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Test In Progress */}
        {started && !finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl mx-auto space-y-8"
          >
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-gray-900/90 to-black rounded-2xl p-6 border-2 border-gray-800/50 text-center shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)]"
              >
                <div className="text-5xl font-black text-yellow-400 mb-2">{timeLeft}s</div>
                <div className="text-sm text-gray-400 font-semibold">Time Left</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-gray-900/90 to-black rounded-2xl p-6 border-2 border-yellow-500/50 text-center shadow-[0_20px_70px_-15px_rgba(251,191,36,0.4)]"
              >
                <div className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(251,191,36,0.6)] mb-2">
                  {wpm}
                </div>
                <div className="text-sm text-gray-400 font-semibold">Words Per Minute</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-gray-900/90 to-black rounded-2xl p-6 border-2 border-gray-800/50 text-center shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)]"
              >
                <div className="text-5xl font-black text-green-400 mb-2">{accuracy}%</div>
                <div className="text-sm text-gray-400 font-semibold">Accuracy</div>
              </motion.div>
            </div>

            {/* Typing Interface */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-gray-800/50 hover:border-yellow-500/70 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-3xl" />

              <div className="relative z-10 space-y-6">
                <h2 className="text-2xl font-black text-yellow-400 mb-4">Type this text:</h2>

                {/* Sample Text with Color-Coded Characters */}
                <div className="font-mono text-xl leading-relaxed bg-black/50 p-8 rounded-2xl border border-yellow-500/30 shadow-[inset_0_0_40px_rgba(251,191,36,0.1)]">
                  {SAMPLE_TEXT.split('').map((char, i) => (
                    <span key={i} className={`${getColorClass(char, i)} transition-colors`}>
                      {char}
                    </span>
                  ))}
                </div>

                {/* Input Textarea */}
                <textarea
                  ref={inputRef}
                  value={typedText}
                  onChange={handleTextChange}
                  className="w-full h-40 bg-black/70 border-2 border-gray-800 rounded-2xl p-6 text-white font-mono text-xl placeholder-gray-500 focus:border-yellow-500/70 focus:outline-none focus:shadow-[0_0_40px_rgba(251,191,36,0.3)] transition-all resize-none"
                  placeholder="Start typing here..."
                  spellCheck={false}
                  autoFocus
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Results Screen */}
        {finished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-12 border-2 border-yellow-500/70 shadow-[0_30px_90px_-15px_rgba(251,191,36,0.6)]">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl" />

              <div className="relative z-10 space-y-8">
                <div className="text-center">
                  <Trophy className="w-24 h-24 mx-auto mb-6 text-yellow-400" />
                  <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Test Complete! 🎉
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-8 text-center">
                  <div className="bg-black/50 rounded-2xl p-8 border border-yellow-500/30">
                    <div className="text-7xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(251,191,36,0.6)] mb-3">
                      {wpm}
                    </div>
                    <div className="text-gray-400 text-xl font-semibold">Words Per Minute</div>
                  </div>
                  <div className="bg-black/50 rounded-2xl p-8 border border-green-500/30">
                    <div className="text-7xl font-black text-green-400 mb-3">{accuracy}%</div>
                    <div className="text-gray-400 text-xl font-semibold">Accuracy</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6 rounded-2xl border border-blue-500/30">
                  <p className="font-bold text-blue-300 mb-3 text-lg">💡 Your Result:</p>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {wpm < 30 && "Keep practicing! Average BPO typing speed is 40-50 WPM."}
                    {wpm >= 30 && wpm < 40 && "Good! You're getting there. Aim for 40+ WPM for most BPO roles."}
                    {wpm >= 40 && wpm < 50 && "Great! You meet the standard for most BPO positions."}
                    {wpm >= 50 && "Excellent! Your typing speed is above average for BPO roles. 🚀"}
                  </p>
                </div>

                <div className="flex gap-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={startTest}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 shadow-[0_0_40px_rgba(251,191,36,0.4)] border-0 text-black font-bold text-lg py-6 rounded-2xl"
                    >
                      Try Again
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-2 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 font-bold text-lg py-6 rounded-2xl"
                    >
                      <Award className="mr-2 w-5 h-5" />
                      Download Certificate (₱50)
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </>
  )
}
