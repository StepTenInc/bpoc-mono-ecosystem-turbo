'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  Users,
  Brain,
  Keyboard,
  Zap,
  Video,
  CheckCircle,
  Play,
  ChevronRight,
  Search,
  Filter,
  Star,
  TrendingUp,
  Clock,
  DollarSign,
  Code,
  Palette,
  Globe,
  ArrowRight,
  Target,
  Award,
  BarChart3,
  FileText,
  Settings,
  Eye,
  Copy,
  Check,
  Briefcase,
  ChevronDown,
  X,
  Mail,
  Building2,
  MessageSquare,
  ArrowDown,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';

// ============================================================================
// ANIMATED COUNTER COMPONENT
// ============================================================================

const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}</span>;
};

// ============================================================================
// FAKE DATA GENERATION
// ============================================================================

interface FakeCandidate {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  location: string;
  englishLevel: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
  skills: string[];
  experience: number;
  matchScore: number;
}

const generateFakeCandidates = (count: number): FakeCandidate[] => {
  const filipinoFirstNames = ['Maria', 'Juan', 'Ana', 'Jose', 'Rosa', 'Pedro', 'Christina', 'Mark', 'Angel', 'Ken', 'Rica', 'John', 'Michelle', 'Carlo', 'Rina'];
  const filipinoLastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Rivera', 'Gonzales', 'Lopez', 'Martinez', 'Hernandez', 'Dela Cruz', 'Villanueva', 'Ramos'];
  const bpoSkills = ['Customer Service', 'Zendesk', 'Salesforce', 'Live Chat', 'Email Support', 'Technical Support', 'Data Entry', 'Microsoft Office', 'CRM', 'Typing', 'English Communication', 'Problem Solving', 'Telecalling', 'Collections', 'Sales'];
  const englishLevels: Array<'Basic' | 'Conversational' | 'Fluent' | 'Native'> = ['Basic', 'Conversational', 'Fluent', 'Native'];
  const locations = ['Manila', 'Makati', 'BGC', 'Ortigas', 'Cebu', 'Davao', 'Clark', 'Quezon City'];

  const candidates: FakeCandidate[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = filipinoFirstNames[Math.floor(Math.random() * filipinoFirstNames.length)];
    const lastName = filipinoLastNames[Math.floor(Math.random() * filipinoLastNames.length)];
    const skillCount = Math.floor(Math.random() * 4) + 3; // 3-6 skills
    const randomSkills = [...bpoSkills]
      .sort(() => Math.random() - 0.5)
      .slice(0, skillCount);

    candidates.push({
      id: `candidate-${i}`,
      firstName,
      lastName,
      avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=f97316&color=fff&size=150`,
      location: locations[Math.floor(Math.random() * locations.length)],
      englishLevel: englishLevels[Math.floor(Math.random() * englishLevels.length)],
      skills: randomSkills,
      experience: Math.floor(Math.random() * 9), // 0-8 years
      matchScore: Math.floor(Math.random() * 35) + 65 // 65-99%
    });
  }

  return candidates;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InteractiveDemoPage() {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<FakeCandidate | null>(null);

  // Talent Pool Filters
  const [selectedEnglish, setSelectedEnglish] = useState<string>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceMin, setExperienceMin] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // White Label Generator
  const [agencyName, setAgencyName] = useState('Your Agency');
  const [brandColor, setBrandColor] = useState('#FF6B00');

  // ROI Calculator
  const [monthlyHires, setMonthlyHires] = useState(10);
  const [currentTimeToFill, setCurrentTimeToFill] = useState(45);
  const [currentCostPerHire, setCurrentCostPerHire] = useState(50000);

  // Pricing View Toggle
  const [pricingView, setPricingView] = useState<'recruiter' | 'client' | 'api'>('recruiter');

  // API Playground
  const [apiExpanded, setApiExpanded] = useState(false);
  const [apiCodeTab, setApiCodeTab] = useState<'curl' | 'javascript' | 'python'>('javascript');
  const [copiedCode, setCopiedCode] = useState(false);

  // Contact Form
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  // Generate fake candidates (30) - Client-side only to prevent hydration mismatch
  const [allCandidates, setAllCandidates] = useState<FakeCandidate[]>([]);

  useEffect(() => {
    setAllCandidates(generateFakeCandidates(30));
  }, []);

  // All available skills for filter
  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    allCandidates.forEach(c => c.skills.forEach(s => skillSet.add(s)));
    return Array.from(skillSet).sort();
  }, [allCandidates]);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return allCandidates.filter(candidate => {
      // English
      if (selectedEnglish !== 'all' && candidate.englishLevel !== selectedEnglish) {
        return false;
      }

      // Skills
      if (selectedSkills.length > 0) {
        const hasSkill = selectedSkills.some(skill => candidate.skills.includes(skill));
        if (!hasSkill) return false;
      }

      // Experience
      if (candidate.experience < experienceMin) {
        return false;
      }

      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
        const hasMatchingSkill = candidate.skills.some(skill =>
          skill.toLowerCase().includes(query)
        );
        if (!fullName.includes(query) && !hasMatchingSkill) {
          return false;
        }
      }

      return true;
    });
  }, [allCandidates, selectedEnglish, selectedSkills, experienceMin, searchQuery]);

  // ROI Calculations
  const roiCalculations = useMemo(() => {
    const bpocTimeToFill = Math.round(currentTimeToFill * 0.4); // 60% faster
    const timeSaved = currentTimeToFill - bpocTimeToFill;
    const hoursSaved = Math.round(monthlyHires * timeSaved * 2); // 2 hours per day saved
    const monthlyCostSavings = Math.round(monthlyHires * (currentCostPerHire * 0.3)); // 30% cost reduction
    const annualSavings = monthlyCostSavings * 12;

    return {
      bpocTimeToFill,
      timeSaved,
      hoursSaved,
      monthlyCostSavings,
      annualSavings
    };
  }, [monthlyHires, currentTimeToFill, currentCostPerHire]);

  const journeySteps = [
    {
      number: 1,
      icon: Sparkles,
      title: 'Discover BPOC',
      description: 'Candidate finds the platform through job boards or direct search',
      recruiterView: 'See when candidates sign up, their source, and initial profile data'
    },
    {
      number: 2,
      icon: FileText,
      title: 'AI Resume Builder',
      description: 'Canva-like drag-drop builder with AI assistance and templates',
      recruiterView: 'View AI-scored resumes (0-100) with ATS compatibility analysis'
    },
    {
      number: 3,
      icon: Brain,
      title: 'Skill Assessment',
      description: 'Comprehensive candidate evaluation and verification',
      recruiterView: 'Filter candidates by verified skills and AI-analyzed resume scores'
    },
    {
      number: 4,
      icon: Zap,
      title: 'AI Job Matching',
      description: 'Algorithm automatically matches candidate skills to your job requirements',
      recruiterView: 'See match percentage scores for each candidate per job opening'
    },
    {
      number: 5,
      icon: Target,
      title: 'Apply',
      description: 'One-click application process with pre-filled resume data',
      recruiterView: 'Review applications with complete assessment scores and match data'
    },
    {
      number: 6,
      icon: Video,
      title: 'Video Interview',
      description: 'In-platform video screening with recording and transcription',
      recruiterView: 'Conduct interviews, review recordings, read transcripts, share with clients'
    },
    {
      number: 7,
      icon: CheckCircle,
      title: 'Get Hired',
      description: 'Receive offer, negotiate terms, sign contract, complete onboarding',
      recruiterView: 'Send offers, handle negotiations, track signatures, manage onboarding tasks'
    }
  ];

  const handleCopyCode = () => {
    const code = apiCodeSnippets[apiCodeTab];
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const apiCodeSnippets = {
    curl: `curl -X GET "https://api.bpoc.io/v1/candidates" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "filters": {
      "englishLevel": "Fluent",
      "experience": { "min": 2 },
      "skills": ["Customer Service", "Technical Support"]
    },
    "limit": 20
  }'`,
    javascript: `// Fetch candidates matching criteria
const response = await fetch('https://api.bpoc.io/v1/candidates', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    filters: {
      englishLevel: 'Fluent',
      experience: { min: 2 },
      skills: ['Customer Service', 'Technical Support']
    },
    limit: 20
  })
});

const { candidates } = await response.json();
console.log(candidates);`,
    python: `import requests

url = "https://api.bpoc.io/v1/candidates"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "filters": {
        "englishLevel": "Fluent",
        "experience": {"min": 2},
        "skills": ["Customer Service", "Technical Support"]
    },
    "limit": 20
}

response = requests.get(url, headers=headers, json=data)
candidates = response.json()["candidates"]
print(candidates)`
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] selection:bg-orange-500/20 selection:text-orange-200">

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-orange-400/3 rounded-full blur-[100px] animate-pulse-slow delay-500" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0B0B0D]/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/recruiter/signup" className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors">
            ← Back to Signup
          </Link>
          <Link href="/recruiter/signup">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-full px-6">
              Start Free
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">

        {/* SECTION 1: HERO */}
        <section className="pt-20 pb-32">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8">
                <Play className="w-4 h-4" />
                <span>Interactive Demo - No Signup Required</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Experience <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">BPOC</span> in Action
              </h1>

              <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
                Explore our platform. No signup required.
              </p>

              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => scrollToSection('journey-section')}
                  className="h-14 px-10 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20"
                >
                  Explore Demo Below
                  <ArrowDown className="ml-2 w-5 h-5" />
                </Button>
                <Link href="/recruiter/signup">
                  <Button size="lg" className="h-14 px-10 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-full">
                    Start Free
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 2: CANDIDATE JOURNEY TIMELINE */}
        <section id="journey-section" className="py-24 bg-white/5 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                The Candidate <span className="text-orange-400">Journey</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Click each step to see what happens and what data YOU get as a recruiter
              </p>
            </div>

            {/* Timeline - Horizontal on Desktop */}
            <div className="hidden lg:block relative max-w-7xl mx-auto mb-12">
              <div className="absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500/20 via-orange-500/50 to-orange-500/20" />

              <div className="grid grid-cols-7 gap-4">
                {journeySteps.map((step, i) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedStep(selectedStep === step.number ? null : step.number)}
                    className="relative cursor-pointer group"
                  >
                    <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto">
                      <div className={`absolute inset-0 rounded-full opacity-20 blur-xl transition-all duration-300 ${
                        selectedStep === step.number
                          ? 'bg-gradient-to-br from-orange-500 to-amber-600 scale-110'
                          : 'bg-gradient-to-br from-orange-500/50 to-amber-600/50'
                      }`} />
                      <div className={`relative w-full h-full rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        selectedStep === step.number
                          ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-400'
                          : 'bg-[#0B0B0D] border-orange-500/30 group-hover:border-orange-500/50'
                      }`}>
                        <step.icon className="w-10 h-10 text-orange-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="text-center text-sm font-bold text-white mt-4">{step.title}</h3>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile Timeline */}
            <div className="lg:hidden space-y-4">
              {journeySteps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedStep(selectedStep === step.number ? null : step.number)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-orange-500/30 transition-colors"
                >
                  <div className="relative flex items-center justify-center w-16 h-16 flex-shrink-0">
                    <div className={`absolute inset-0 rounded-full opacity-20 blur-xl ${
                      selectedStep === step.number ? 'bg-gradient-to-br from-orange-500 to-amber-600' : ''
                    }`} />
                    <div className={`relative w-full h-full rounded-full flex items-center justify-center border-2 ${
                      selectedStep === step.number
                        ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-400'
                        : 'bg-[#0B0B0D] border-orange-500/30'
                    }`}>
                      <step.icon className="w-7 h-7 text-orange-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{step.title}</h3>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${selectedStep === step.number ? 'rotate-90' : ''}`} />
                </motion.div>
              ))}
            </div>

            {/* Expanded Step Details */}
            <AnimatePresence>
              {selectedStep !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-12 overflow-hidden"
                >
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30">
                    <div className="grid lg:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-4">
                          {journeySteps[selectedStep - 1].title}
                        </h3>
                        <p className="text-gray-300 text-lg mb-6">
                          {journeySteps[selectedStep - 1].description}
                        </p>
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                          <div className="flex items-start gap-3">
                            <Eye className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                            <div>
                              <p className="text-sm font-semibold text-orange-400 mb-1">What YOU See</p>
                              <p className="text-gray-300 text-sm">
                                {journeySteps[selectedStep - 1].recruiterView}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-full h-64 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <div className="text-center text-gray-400">
                            {React.createElement(journeySteps[selectedStep - 1].icon, { className: "w-16 h-16 mx-auto mb-4 text-orange-400" })}
                            <p className="text-sm">Animated Mockup</p>
                            <p className="text-xs mt-2">(Platform interface preview)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* SECTION 3: LIVE TALENT POOL DEMO */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Try the <span className="text-orange-400">Talent Search</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                This is a WORKING demo with real filters. Search and filter {allCandidates.length} pre-loaded Filipino candidates.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="max-w-7xl mx-auto mb-8">
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Search Bar */}
                <div className="lg:col-span-5">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name or skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50"
                    />
                  </div>
                </div>

                {/* English Level Filter */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">English Level</h3>
                  </div>
                  <select
                    value={selectedEnglish}
                    onChange={(e) => setSelectedEnglish(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-orange-500/50 focus:outline-none"
                  >
                    <option value="all">All Levels</option>
                    <option value="Basic">Basic</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Native">Native</option>
                  </select>
                </div>

                {/* Experience Filter */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">Experience</h3>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Min: {experienceMin} years</label>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      value={experienceMin}
                      onChange={(e) => setExperienceMin(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                </div>

                {/* Results Count */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">Results</h3>
                  </div>
                  <div className="text-3xl font-bold text-orange-400">
                    {filteredCandidates.length}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">candidates match</p>
                </div>
              </div>
            </div>

            {/* Candidate Grid */}
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredCandidates.slice(0, 12).map((candidate, i) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedCandidate(candidate)}
                    className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={candidate.avatar}
                        alt={`${candidate.firstName} ${candidate.lastName}`}
                        className="w-16 h-16 rounded-full border-2 border-orange-500/30"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate group-hover:text-orange-400 transition-colors">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        <p className="text-sm text-gray-400">{candidate.location}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            {candidate.englishLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Match Score</span>
                        <span className="text-sm font-bold text-orange-400">{candidate.matchScore}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                          style={{ width: `${candidate.matchScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.slice(0, 2).map((skill, idx) => (
                        <Badge key={idx} className="bg-white/5 text-gray-300 border-white/10 text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 2 && (
                        <Badge className="bg-white/5 text-gray-400 border-white/10 text-xs">
                          +{candidate.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredCandidates.length === 0 && (
              <div className="text-center py-12">
                <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No candidates match your filters</p>
                <Button
                  onClick={() => {
                    setSelectedEnglish('all');
                    setSelectedSkills([]);
                    setExperienceMin(0);
                    setSearchQuery('');
                  }}
                  className="mt-4 bg-white/10 hover:bg-white/20 text-white"
                >
                  Reset Filters
                </Button>
              </div>
            )}

            {filteredCandidates.length > 12 && (
              <div className="text-center mt-8">
                <p className="text-gray-400">
                  Showing 12 of {filteredCandidates.length} candidates
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Candidate Modal */}
        <AnimatePresence>
          {selectedCandidate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCandidate(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#121217] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-start gap-6 mb-6">
                  <img
                    src={selectedCandidate.avatar}
                    alt={`${selectedCandidate.firstName} ${selectedCandidate.lastName}`}
                    className="w-24 h-24 rounded-full border-4 border-orange-500/30"
                  />
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {selectedCandidate.firstName} {selectedCandidate.lastName}
                    </h2>
                    <p className="text-gray-400 mb-4">{selectedCandidate.location}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {selectedCandidate.englishLevel} English
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {selectedCandidate.experience} years exp
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Match Score</span>
                    <span className="text-2xl font-bold text-orange-400">{selectedCandidate.matchScore}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                      style={{ width: `${selectedCandidate.matchScore}%` }}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill, idx) => (
                      <Badge key={idx} className="bg-white/10 text-gray-300 border-white/20">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white">
                    View Full Profile
                  </Button>
                  <Button className="flex-1 bg-white/10 hover:bg-white/20 text-white">
                    Start Video Call
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION 4: DASHBOARD PREVIEW */}
        <section className="py-24 bg-white/5 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Your <span className="text-orange-400">Dashboard</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                See stats, manage applications, and track your hiring pipeline
              </p>
            </div>

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Active Jobs', value: 12, icon: Briefcase, color: 'orange' },
                { label: 'Applications', value: 234, icon: Users, color: 'blue' },
                { label: 'Interviews', value: 8, icon: Video, color: 'green' },
                { label: 'Placements', value: 5, icon: Award, color: 'purple' }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-8 h-8 text-orange-400" />
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">
                    <AnimatedCounter value={stat.value} duration={2} />
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Recent Applications */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Recent Applications</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Maria Santos', job: 'Customer Service Rep', time: '5 min ago', status: 'New' },
                      { name: 'Juan Reyes', job: 'Technical Support', time: '1 hour ago', status: 'Reviewed' },
                      { name: 'Ana Cruz', job: 'Virtual Assistant', time: '3 hours ago', status: 'Shortlisted' }
                    ].map((app, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{app.name}</p>
                          <p className="text-sm text-gray-400">{app.job}</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Interviews */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Upcoming Interviews</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Pedro Torres', job: 'Sales Rep', time: 'Today, 2:00 PM', type: 'Video Call' },
                      { name: 'Christina Flores', job: 'Data Entry', time: 'Tomorrow, 10:00 AM', type: 'Pre-screen' }
                    ].map((interview, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Video className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{interview.name}</p>
                          <p className="text-sm text-gray-400">{interview.job} • {interview.time}</p>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          {interview.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Overlay CTA */}
              <div className="relative p-12 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D]/90 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-4">Sign Up to Access Your Dashboard</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Track applications, manage interviews, and close placements faster
                  </p>
                  <Link href="/recruiter/signup">
                    <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white">
                      Create Free Account
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: PLATFORM TIER COMPARISON */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Choose Your <span className="text-orange-400">Plan</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
                From free recruiting to white-label enterprise solutions
              </p>

              {/* View Tabs */}
              <div className="inline-flex items-center gap-2 p-1 rounded-full bg-white/5 border border-white/10">
                <button
                  onClick={() => setPricingView('recruiter')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    pricingView === 'recruiter'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Recruiter View
                </button>
                <button
                  onClick={() => setPricingView('client')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    pricingView === 'client'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Client View
                </button>
                <button
                  onClick={() => setPricingView('api')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    pricingView === 'api'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  API Response
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {pricingView === 'recruiter' && (
                <motion.div
                  key="recruiter"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
                >
                  {/* Free Tier */}
                  <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">BPOC Free</h3>
                      <p className="text-gray-400 text-sm mb-6">Use BPOC.io platform</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">FREE</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">Pay per placement</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {[
                        'Unlimited job posts',
                        'Full talent pool access',
                        'AI candidate matching',
                        'Video interviews',
                        'Pipeline management'
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full bg-white/10 hover:bg-white/20 text-white">
                      Start Free
                    </Button>
                  </div>

                  {/* Pro Tier */}
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-2 border-orange-500/30 relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white border-none">
                        Most Popular
                      </Badge>
                    </div>
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">BPOC Pro</h3>
                      <p className="text-gray-400 text-sm mb-6">Everything in Free +</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">$199</span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">Lower placement fee</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {[
                        'REST API access',
                        'Webhooks',
                        'Bulk export',
                        'Priority support',
                        'Advanced analytics'
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white">
                      Upgrade to Pro
                    </Button>
                  </div>

                  {/* Enterprise */}
                  <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                      <p className="text-gray-400 text-sm mb-6">White-label solution</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">Custom</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">Volume pricing</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {[
                        'Custom domain',
                        'Your logo & colors',
                        'Client portals',
                        'Dedicated account manager',
                        'SLA guarantee'
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full bg-white/10 hover:bg-white/20 text-white">
                      Contact Sales
                    </Button>
                  </div>
                </motion.div>
              )}

              {pricingView === 'client' && (
                <motion.div
                  key="client"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-3xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10"
                >
                  <h3 className="text-2xl font-bold text-white mb-6">What Your Clients See</h3>
                  <div className="space-y-4">
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-2">Branded Portal</h4>
                      <p className="text-gray-400">Your clients log in to YOUR branded portal (youragency.bpoc.io) to review candidates, approve interviews, and track placements.</p>
                    </div>
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-2">Restricted Access</h4>
                      <p className="text-gray-400">Clients only see candidates assigned to their jobs. Complete data isolation ensures privacy and professionalism.</p>
                    </div>
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-2">Your Branding</h4>
                      <p className="text-gray-400">Every page shows YOUR logo, YOUR colors, YOUR company name. They never see "BPOC" branding.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {pricingView === 'api' && (
                <motion.div
                  key="api"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-3xl mx-auto p-8 rounded-2xl bg-[#0a0a0f] border border-white/10"
                >
                  <h3 className="text-2xl font-bold text-white mb-6">Sample API Response</h3>
                  <pre className="p-6 rounded-xl bg-black/50 border border-white/5 overflow-x-auto">
                    <code className="text-sm text-gray-300 font-mono whitespace-pre">
{`{
  "tier": "pro",
  "features": {
    "unlimited_jobs": true,
    "talent_pool_access": true,
    "ai_matching": true,
    "video_interviews": true,
    "api_access": true,
    "webhooks": true,
    "white_label": false
  },
  "limits": {
    "api_calls_per_month": 100000,
    "webhook_endpoints": 10,
    "team_members": "unlimited"
  },
  "support": {
    "type": "priority",
    "response_time_hours": 4,
    "dedicated_manager": false
  }
}`}
                    </code>
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* WHITE LABEL GENERATOR */}
        <section className="py-24 bg-white/5 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                White-Label <span className="text-orange-400">Preview</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                See what YOUR branded platform could look like
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Your Agency Name</label>
                  <Input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Enter agency name..."
                    className="h-12 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Your Brand Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-12 w-20 bg-white/5 border border-white/10 rounded-lg cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="flex-1 h-12 bg-white/5 border-white/10 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Login Page Preview */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">Login Page</h3>
                  </div>
                  <div className="p-6 rounded-xl bg-white">
                    <div className="text-center mb-6">
                      <div
                        className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl"
                        style={{ backgroundColor: brandColor }}
                      >
                        {agencyName.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{agencyName}</h3>
                      <p className="text-gray-600 text-sm">Candidate Portal</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-100 rounded border border-gray-300" />
                      <div className="h-8 bg-gray-100 rounded border border-gray-300" />
                      <button
                        className="w-full h-8 rounded text-white text-sm font-semibold"
                        style={{ backgroundColor: brandColor }}
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-4">
                    {agencyName.toLowerCase().replace(/\s+/g, '')}.bpoc.io
                  </p>
                </div>

                {/* Dashboard Preview */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutDashboard className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">Dashboard</h3>
                  </div>
                  <div className="p-6 rounded-xl bg-white">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: brandColor }}
                        >
                          {agencyName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{agencyName}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-gray-200" />
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">Active Jobs</span>
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ backgroundColor: brandColor, opacity: 0.2 }}
                          />
                        </div>
                        <div className="text-lg font-bold text-gray-900">12</div>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="h-2 bg-gray-200 rounded w-3/4 mb-1" />
                        <div className="h-2 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI CALCULATOR */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Calculate Your <span className="text-orange-400">ROI</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                See how much time and money you'll save with BPOC
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Input Column */}
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <label className="text-sm text-gray-400 mb-3 block">Monthly Hires</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={monthlyHires}
                        onChange={(e) => setMonthlyHires(Number(e.target.value))}
                        className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <span className="text-2xl font-bold text-orange-400 w-16 text-right">{monthlyHires}</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <label className="text-sm text-gray-400 mb-3 block">Current Time-to-Fill (days)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="7"
                        max="60"
                        value={currentTimeToFill}
                        onChange={(e) => setCurrentTimeToFill(Number(e.target.value))}
                        className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <span className="text-2xl font-bold text-orange-400 w-16 text-right">{currentTimeToFill}</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <label className="text-sm text-gray-400 mb-3 block">Current Cost Per Hire (₱)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="5000"
                        max="100000"
                        step="5000"
                        value={currentCostPerHire}
                        onChange={(e) => setCurrentCostPerHire(Number(e.target.value))}
                        className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <span className="text-2xl font-bold text-orange-400 w-24 text-right">₱{(currentCostPerHire / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                </div>

                {/* Results Column */}
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-6 h-6 text-green-400" />
                      <h3 className="text-lg font-bold text-white">Hours Saved</h3>
                    </div>
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      <AnimatedCounter value={roiCalculations.hoursSaved} duration={2} />
                    </div>
                    <p className="text-sm text-gray-300">
                      hours saved per month
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="w-6 h-6 text-orange-400" />
                      <h3 className="text-lg font-bold text-white">Cost Saved</h3>
                    </div>
                    <div className="text-4xl font-bold text-orange-400 mb-2">
                      ₱<AnimatedCounter value={roiCalculations.monthlyCostSavings} duration={2} />
                    </div>
                    <p className="text-sm text-gray-300">
                      per month (30% reduction)
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                      <h3 className="text-lg font-bold text-white">Annual Savings</h3>
                    </div>
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      ₱<AnimatedCounter value={roiCalculations.annualSavings} duration={2} />
                    </div>
                    <p className="text-sm text-gray-300">
                      total annual impact
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link href="/recruiter/signup">
                  <Button size="lg" className="h-14 px-10 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-full">
                    Start Saving Today
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* API PLAYGROUND */}
        <section className="py-24 bg-white/5 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                API <span className="text-orange-400">Playground</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-6">
                Build custom integrations with our RESTful API
              </p>
              <Button
                onClick={() => setApiExpanded(!apiExpanded)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                {apiExpanded ? 'Hide' : 'Show'} API Playground
                <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${apiExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            <AnimatePresence>
              {apiExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="max-w-4xl mx-auto overflow-hidden"
                >
                  <div className="p-8 rounded-2xl bg-[#0a0a0f] border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">GET /api/v1/candidates</h3>
                        <p className="text-sm text-gray-400">Search candidates with filters</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1">
                          {(['curl', 'javascript', 'python'] as const).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setApiCodeTab(lang)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                                apiCodeTab === lang
                                  ? 'bg-orange-500 text-white'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'JavaScript' : 'Python'}
                            </button>
                          ))}
                        </div>
                        <Button
                          onClick={handleCopyCode}
                          size="sm"
                          className="bg-white/10 hover:bg-white/20 text-white"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <pre className="p-6 rounded-xl bg-black/50 border border-white/5 overflow-x-auto">
                      <code className="text-sm text-gray-300 font-mono whitespace-pre">
                        {apiCodeSnippets[apiCodeTab]}
                      </code>
                    </pre>

                    <div className="mt-6 grid md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <Globe className="w-8 h-8 text-blue-400 mb-2" />
                        <h4 className="text-white font-semibold mb-1">RESTful API</h4>
                        <p className="text-xs text-gray-400">Standard HTTP endpoints</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <Zap className="w-8 h-8 text-yellow-400 mb-2" />
                        <h4 className="text-white font-semibold mb-1">Webhooks</h4>
                        <p className="text-xs text-gray-400">Real-time event notifications</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <FileText className="w-8 h-8 text-green-400 mb-2" />
                        <h4 className="text-white font-semibold mb-1">Full Docs</h4>
                        <p className="text-xs text-gray-400">Complete API reference</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10" />

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Ready to Transform <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Your Hiring?</span>
              </h2>

              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                Join 500+ Philippine agencies hiring faster with BPOC
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link href="/recruiter/signup">
                  <Button size="lg" className="h-16 px-12 text-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-full shadow-2xl shadow-orange-500/30">
                    Start Free
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  onClick={() => {
                    const form = document.getElementById('contact-form');
                    if (form) form.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="h-16 px-12 text-xl border-2 border-white/20 text-white hover:bg-white/10 rounded-full"
                >
                  Talk to Sales
                </Button>
              </div>
            </motion.div>

            {/* Contact Form */}
            <div id="contact-form" className="max-w-2xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Get in Touch</h3>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Name</label>
                    <Input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Your name"
                      className="h-12 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Email</label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="your@email.com"
                      className="h-12 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Company</label>
                  <Input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    placeholder="Your company name"
                    className="h-12 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us about your recruiting needs..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:outline-none resize-none"
                  />
                </div>
                <Button className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-semibold">
                  Send Message
                  <Mail className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </div>

            <p className="text-sm text-gray-500 mt-8 text-center">
              No credit card required • Free forever • Cancel anytime
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
