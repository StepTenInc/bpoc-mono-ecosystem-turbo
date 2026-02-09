'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { Badge } from '@/components/shared/ui/badge'
import { Card, CardContent } from '@/components/shared/ui/card'
import { 
  Copy, Check, Mail, Phone, Linkedin, Facebook, MessageCircle,
  Upload, Palette, Layout, Type, ThumbsUp, ThumbsDown, Share2,
  Sparkles, ArrowRight, Image as ImageIcon, Globe, Twitter
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Header from '@/components/shared/layout/Header'

const LAYOUTS = [
  { id: 'horizontal', name: 'Horizontal', desc: 'Photo on left, details on right' },
  { id: 'vertical', name: 'Vertical', desc: 'Photo on top, details below' },
  { id: 'minimal', name: 'Minimal', desc: 'Text only, clean and simple' },
  { id: 'modern', name: 'Modern', desc: 'Bold name with accent bar' },
]

const COLOR_PRESETS = [
  { id: 'cyan', name: 'Ocean', primary: '#06b6d4', secondary: '#0891b2' },
  { id: 'purple', name: 'Royal', primary: '#8b5cf6', secondary: '#7c3aed' },
  { id: 'green', name: 'Forest', primary: '#10b981', secondary: '#059669' },
  { id: 'blue', name: 'Professional', primary: '#3b82f6', secondary: '#2563eb' },
  { id: 'orange', name: 'Energetic', primary: '#f97316', secondary: '#ea580c' },
  { id: 'pink', name: 'Creative', primary: '#ec4899', secondary: '#db2777' },
]

const JOB_SUGGESTIONS = [
  'Customer Service Representative',
  'Technical Support Specialist', 
  'Team Leader',
  'Quality Analyst',
  'Account Manager',
  'Operations Manager',
  'Sales Representative',
  'Trainer',
]

export default function EmailSignaturePage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)
  const [rated, setRated] = useState<'up' | 'down' | null>(null)
  
  // Form data
  const [photo, setPhoto] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    phone: '',
    email: '',
    linkedin: '',
    website: '',
  })
  const [layout, setLayout] = useState('horizontal')
  const [colorPreset, setColorPreset] = useState(COLOR_PRESETS[0])
  const [customColor, setCustomColor] = useState('#06b6d4')
  const [useCustomColor, setUseCustomColor] = useState(false)

  const primaryColor = useCustomColor ? customColor : colorPreset.primary

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateSignatureHTML = () => {
    const { name, title, company, phone, email, linkedin, website } = formData
    
    if (layout === 'minimal') {
      return `
<table cellpadding="0" cellspacing="0" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333333; max-width: 400px;">
  <tr>
    <td style="padding-bottom: 8px; border-bottom: 2px solid ${primaryColor};">
      <div style="font-size: 18px; font-weight: bold; color: ${primaryColor};">${name || 'Your Name'}</div>
      <div style="color: #666666; font-size: 13px; margin-top: 2px;">${title || 'Job Title'}${company ? ` at ${company}` : ''}</div>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 8px; font-size: 13px; line-height: 1.6;">
      ${phone ? `<div>📞 ${phone}</div>` : ''}
      ${email ? `<div>📧 <a href="mailto:${email}" style="color: ${primaryColor}; text-decoration: none;">${email}</a></div>` : ''}
      ${linkedin ? `<div>💼 <a href="${linkedin}" style="color: ${primaryColor}; text-decoration: none;">LinkedIn Profile</a></div>` : ''}
      ${website ? `<div>🌐 <a href="${website}" style="color: ${primaryColor}; text-decoration: none;">${website.replace(/^https?:\/\//, '')}</a></div>` : ''}
    </td>
  </tr>
</table>
      `.trim()
    }
    
    if (layout === 'modern') {
      return `
<table cellpadding="0" cellspacing="0" style="font-family: Arial, Helvetica, sans-serif; max-width: 450px;">
  <tr>
    <td style="padding: 16px 0;">
      ${photo ? `<img src="${photo}" width="70" height="70" style="border-radius: 50%; margin-right: 16px; vertical-align: middle; border: 3px solid ${primaryColor};" />` : ''}
      <span style="display: inline-block; vertical-align: middle;">
        <span style="display: block; font-size: 20px; font-weight: bold; color: #1a1a1a;">${name || 'Your Name'}</span>
        <span style="display: block; font-size: 14px; color: ${primaryColor}; font-weight: 600; margin-top: 2px;">${title || 'Job Title'}</span>
        ${company ? `<span style="display: block; font-size: 13px; color: #666666; margin-top: 2px;">${company}</span>` : ''}
      </span>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-top: 3px solid ${primaryColor};">
      <table cellpadding="0" cellspacing="0" style="font-size: 13px; color: #666666;">
        ${phone ? `<tr><td style="padding: 2px 0;"><strong style="color: #333;">P:</strong> ${phone}</td></tr>` : ''}
        ${email ? `<tr><td style="padding: 2px 0;"><strong style="color: #333;">E:</strong> <a href="mailto:${email}" style="color: ${primaryColor}; text-decoration: none;">${email}</a></td></tr>` : ''}
        ${linkedin ? `<tr><td style="padding: 2px 0;"><strong style="color: #333;">L:</strong> <a href="${linkedin}" style="color: ${primaryColor}; text-decoration: none;">LinkedIn</a></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>
      `.trim()
    }
    
    if (layout === 'vertical') {
      return `
<table cellpadding="0" cellspacing="0" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; text-align: center; max-width: 300px;">
  ${photo ? `
  <tr>
    <td style="padding-bottom: 12px;">
      <img src="${photo}" width="80" height="80" style="border-radius: 50%; border: 3px solid ${primaryColor};" />
    </td>
  </tr>
  ` : ''}
  <tr>
    <td>
      <div style="font-size: 18px; font-weight: bold; color: ${primaryColor};">${name || 'Your Name'}</div>
      <div style="color: #666666; font-size: 13px; margin-top: 4px;">${title || 'Job Title'}</div>
      ${company ? `<div style="color: #999999; font-size: 12px; margin-top: 2px;">${company}</div>` : ''}
    </td>
  </tr>
  <tr>
    <td style="padding-top: 12px; font-size: 13px; line-height: 1.8;">
      ${phone ? `<div>${phone}</div>` : ''}
      ${email ? `<div><a href="mailto:${email}" style="color: ${primaryColor}; text-decoration: none;">${email}</a></div>` : ''}
      ${linkedin ? `<div><a href="${linkedin}" style="color: ${primaryColor}; text-decoration: none;">LinkedIn</a></div>` : ''}
    </td>
  </tr>
</table>
      `.trim()
    }
    
    // Default: horizontal
    return `
<table cellpadding="0" cellspacing="0" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333333; max-width: 500px;">
  <tr>
    ${photo ? `
    <td style="vertical-align: top; padding-right: 15px;">
      <img src="${photo}" width="80" height="80" style="border-radius: 8px; border: 2px solid ${primaryColor};" />
    </td>
    ` : ''}
    <td style="vertical-align: top;${photo ? ' border-left: 2px solid ' + primaryColor + '; padding-left: 15px;' : ''}">
      <div style="font-size: 18px; font-weight: bold; color: ${primaryColor};">${name || 'Your Name'}</div>
      <div style="color: #666666; margin-top: 2px;">${title || 'Job Title'}</div>
      ${company ? `<div style="color: #888888; font-size: 13px; margin-top: 2px;">${company}</div>` : ''}
      <div style="margin-top: 10px; font-size: 13px; line-height: 1.6;">
        ${phone ? `<div>📞 ${phone}</div>` : ''}
        ${email ? `<div>📧 <a href="mailto:${email}" style="color: ${primaryColor}; text-decoration: none;">${email}</a></div>` : ''}
        ${linkedin ? `<div>💼 <a href="${linkedin}" style="color: ${primaryColor}; text-decoration: none;">LinkedIn Profile</a></div>` : ''}
        ${website ? `<div>🌐 <a href="${website}" style="color: ${primaryColor}; text-decoration: none;">${website.replace(/^https?:\/\//, '')}</a></div>` : ''}
      </div>
    </td>
  </tr>
</table>
    `.trim()
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateSignatureHTML())
      setCopied(true)
      toast({
        title: "Copied! 🎉",
        description: "Paste it in Gmail Settings → Signature, or Outlook → Signature"
      })
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying manually",
        variant: "destructive"
      })
    }
  }

  const shareOnFacebook = () => {
    const text = encodeURIComponent("I just created a professional email signature for FREE! 🎉 Check out this awesome tool for BPO workers: ")
    const url = encodeURIComponent("https://bpoc.io/tools/email-signature")
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400')
  }

  const shareOnMessenger = () => {
    const url = encodeURIComponent("https://bpoc.io/tools/email-signature")
    window.open(`https://www.facebook.com/dialog/send?link=${url}&app_id=YOUR_APP_ID&redirect_uri=${url}`, '_blank')
  }

  const isFormValid = formData.name && formData.email

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-cyan-950 opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />

        <div className="relative z-10 container mx-auto px-4 py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30 text-purple-300">
              <Mail className="w-5 h-5 mr-2 inline" />
              Free Tool • No Login Required
            </Badge>

            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Email Signature
              </span>
              <br />
              <span className="text-white">Generator</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Create a professional email signature in seconds. Perfect for Gmail & Outlook.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-6 space-y-6">
                    {/* Photo Upload */}
                    <div>
                      <Label className="text-white mb-2 block">Profile Photo (Optional)</Label>
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-20 h-20 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-colors overflow-hidden ${photo ? 'border-solid border-cyan-500' : ''}`}
                        >
                          {photo ? (
                            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <div className="text-sm text-gray-400">
                          <p>Upload a professional headshot</p>
                          <p className="text-xs">Square works best (JPG, PNG)</p>
                        </div>
                      </div>
                    </div>

                    {/* Personal Details */}
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="name" className="text-white">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="Juan Dela Cruz"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="title" className="text-white">Job Title</Label>
                        <Input
                          id="title"
                          placeholder="Customer Service Representative"
                          value={formData.title}
                          onChange={e => setFormData({...formData, title: e.target.value})}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          list="job-suggestions"
                        />
                        <datalist id="job-suggestions">
                          {JOB_SUGGESTIONS.map(job => (
                            <option key={job} value={job} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <Label htmlFor="company" className="text-white">Company (Optional)</Label>
                        <Input
                          id="company"
                          placeholder="Your Company Name"
                          value={formData.company}
                          onChange={e => setFormData({...formData, company: e.target.value})}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone" className="text-white">Phone</Label>
                          <Input
                            id="phone"
                            placeholder="+63 917 123 4567"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-white">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="juan@email.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="linkedin" className="text-white">LinkedIn URL (Optional)</Label>
                        <Input
                          id="linkedin"
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={formData.linkedin}
                          onChange={e => setFormData({...formData, linkedin: e.target.value})}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>

                    {/* Layout Selection */}
                    <div>
                      <Label className="text-white mb-3 block">Layout Style</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {LAYOUTS.map(l => (
                          <button
                            key={l.id}
                            onClick={() => setLayout(l.id)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              layout === l.id 
                                ? 'border-cyan-500 bg-cyan-500/10' 
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="text-white text-sm font-medium">{l.name}</div>
                            <div className="text-gray-500 text-xs">{l.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Selection */}
                    <div>
                      <Label className="text-white mb-3 block">Brand Color</Label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {COLOR_PRESETS.map(color => (
                          <button
                            key={color.id}
                            onClick={() => { setColorPreset(color); setUseCustomColor(false); }}
                            className={`w-10 h-10 rounded-lg transition-all ${
                              !useCustomColor && colorPreset.id === color.id 
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-black' 
                                : ''
                            }`}
                            style={{ background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})` }}
                            title={color.name}
                          />
                        ))}
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColor}
                            onChange={e => { setCustomColor(e.target.value); setUseCustomColor(true); }}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0"
                          />
                          <span className="text-xs text-gray-500">Custom</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right Column - Preview & Actions */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="space-y-6"
              >
                {/* Live Preview */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-white">Live Preview</Label>
                      <Badge variant="outline" className="border-green-500/30 text-green-400">
                        <Sparkles className="w-3 h-3 mr-1" /> Updates in real-time
                      </Badge>
                    </div>
                    
                    {/* Email mockup */}
                    <div className="bg-white rounded-lg p-6 min-h-[200px]">
                      <div className="border-b pb-4 mb-4 text-gray-400 text-sm">
                        Best regards,<br />
                        <span className="text-gray-600">Juan</span>
                      </div>
                      <div 
                        dangerouslySetInnerHTML={{ __html: generateSignatureHTML() }}
                        className="signature-preview"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Copy Button */}
                <Button
                  onClick={copyToClipboard}
                  disabled={!isFormValid}
                  className="w-full py-6 text-lg font-bold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 mr-2" /> Copied! Paste in your email settings
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" /> Copy Signature HTML
                    </>
                  )}
                </Button>

                {/* Instructions */}
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold mb-2">How to add to Gmail:</h3>
                    <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                      <li>Copy the signature above</li>
                      <li>Open Gmail → Settings ⚙️ → See all settings</li>
                      <li>Scroll to "Signature" section</li>
                      <li>Click "Create new" and paste</li>
                      <li>Save changes!</li>
                    </ol>
                  </CardContent>
                </Card>

                {/* Rating & Sharing */}
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white">Was this helpful?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRated('up')}
                          className={`p-2 rounded-lg transition-colors ${rated === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                          <ThumbsUp className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setRated('down')}
                          className={`p-2 rounded-lg transition-colors ${rated === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                          <ThumbsDown className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {rated === 'up' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          <p className="text-cyan-400 text-sm">Thanks! Share with friends looking for BPO jobs 🎉</p>
                          <div className="flex gap-2">
                            <Button
                              onClick={shareOnFacebook}
                              className="flex-1 bg-[#1877f2] hover:bg-[#166fe5]"
                            >
                              <Facebook className="w-4 h-4 mr-2" /> Share on Facebook
                            </Button>
                            <Button
                              onClick={shareOnMessenger}
                              variant="outline"
                              className="border-white/10 text-white hover:bg-white/5"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-16"
          >
            <p className="text-gray-500 mb-4">Looking for BPO jobs in the Philippines?</p>
            <Button 
              asChild
              variant="outline" 
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <a href="/jobs">
                Browse Jobs <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  )
}
