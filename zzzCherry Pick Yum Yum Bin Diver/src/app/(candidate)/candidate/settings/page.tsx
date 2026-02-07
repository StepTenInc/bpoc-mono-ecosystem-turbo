'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader as GoogleMapsLoader } from '@googlemaps/js-api-loader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Separator } from '@/components/shared/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import { 
  Settings,
  User,
  Shield,
  Trash2,
  Save,
  ChevronRight,
  Loader2,
  CheckCircle,
  Camera,
  Upload,
  Database
} from 'lucide-react'
import { uploadProfilePhoto, optimizeImage, testStorageConnection } from '@/lib/storage'

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  location: string
  avatar_url?: string
  phone?: string
  bio?: string
  position?: string
  location_place_id?: string
  location_lat?: number | null
  location_lng?: number | null
  location_city?: string
  location_province?: string
  location_country?: string
  location_barangay?: string
  location_region?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, updateProfile, refreshUser } = useAuth()
  const [activeSection, setActiveSection] = useState('profile')
  const [activePrivacyTab, setActivePrivacyTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement | null>(null)
  const placesAutocompleteRef = useRef<any>(null)
  
  const [profileData, setProfileData] = useState<UserProfile>({
    id: '',
    email: '',
    first_name: '',
    last_name: '',
    location: '',
    avatar_url: '',
    phone: '',
    bio: '',
    position: '',
    location_place_id: '',
    location_lat: null,
    location_lng: null,
    location_city: '',
    location_province: '',
    location_country: '',
    location_barangay: '',
    location_region: ''
  })

  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    username: 'public',
    firstName: 'public',
    lastName: 'only-me',
    location: 'public',
    jobTitle: 'public',
    birthday: 'only-me',
    age: 'only-me',
    gender: 'only-me',
    memberSince: 'public',
    resumeScore: 'public',
    gamesCompleted: 'public',
    keyStrengths: 'only-me'
  })

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: User,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      description: 'Manage your personal information'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      description: 'Control your profile visibility'
    },
  ]

  const privacyTabs = [
    {
      id: 'overview',
      title: 'Overview',
      icon: User,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    }
  ]

  // Redirect if not authenticated
  useEffect(() => {
    // Auth check handled by layout
  }, [user])

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initPlaces = async () => {
      try {
        if (!locationInputRef.current) return
        if (placesAutocompleteRef.current) return

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          console.warn('Google Maps API key missing')
          return
        }

        const loader = new GoogleMapsLoader({ apiKey, libraries: ['places'] })
        const google = await loader.load()
        if (!locationInputRef.current) return

        const autocomplete = new google.maps.places.Autocomplete(locationInputRef.current, {
          fields: ['place_id', 'formatted_address', 'address_components', 'geometry'],
          types: ['(regions)'],
          componentRestrictions: { country: 'ph' }
        })

        placesAutocompleteRef.current = autocomplete

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place || !place.geometry || !place.address_components) return

          const get = (type: string) =>
            place.address_components?.find((c: any) => c.types.includes(type))?.long_name || ''

          setProfileData(prev => ({
            ...prev,
            location: place.formatted_address || '',
            location_place_id: place.place_id || '',
            location_lat: place.geometry!.location?.lat() ?? null,
            location_lng: place.geometry!.location?.lng() ?? null,
            location_city: get('locality') || get('administrative_area_level_3'),
            location_province: get('administrative_area_level_2') || get('administrative_area_level_1'),
            location_country: get('country'),
            location_barangay: get('administrative_area_level_3') || get('sublocality'),
            location_region: get('administrative_area_level_1')
          }))
        })
      } catch (error) {
        console.error('Failed to initialize Google Places:', error)
      }
    }

    const timer = setTimeout(initPlaces, 100)
    return () => clearTimeout(timer)
  }, [])

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return

      try {
        setLoading(true)
        const response = await fetch(`/api/user/profile?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          const userData = data.user
          setProfileData({
            id: userData.id || user.id,
            email: userData.email || user.email || '',
            first_name: userData.first_name || user.user_metadata?.first_name || '',
            last_name: userData.last_name || user.user_metadata?.last_name || '',
            location: userData.location || user.user_metadata?.location || '',
            avatar_url: userData.avatar_url || user.user_metadata?.avatar_url || '',
            phone: userData.phone || user.user_metadata?.phone || '',
            bio: userData.bio || user.user_metadata?.bio || '',
            position: userData.position || user.user_metadata?.position || ''
          })
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [user])

  // Load privacy settings
  useEffect(() => {
    const loadPrivacySettings = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/privacy-settings?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setPrivacySettings({
              username: data.data.username || 'public',
              firstName: data.data.first_name || 'public',
              lastName: data.data.last_name || 'only-me',
              location: data.data.location || 'public',
              jobTitle: data.data.job_title || 'public',
              birthday: data.data.birthday || 'only-me',
              age: data.data.age || 'only-me',
              gender: data.data.gender || 'only-me',
              memberSince: data.data.member_since || 'public',
              resumeScore: data.data.resume_score || 'public',
              gamesCompleted: data.data.games_completed || 'public',
              keyStrengths: data.data.key_strengths || 'only-me'
            })
          }
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error)
      }
    }

    loadPrivacySettings()
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      const fullName = `${profileData.first_name} ${profileData.last_name}`.trim()
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token || ''}`
        },
        body: JSON.stringify({
          userId: user.id,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          full_name: fullName,
          location: profileData.location,
          position: profileData.position,
          // ... other fields
        }),
      })

      if (response.ok) {
          window.location.reload()
      } else {
        const error = await response.json()
        alert(`Failed to save profile: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    }
  }

  const handleSavePrivacySettings = async () => {
    if (!user) return

    try {
      setSaveStatus('saving')
      const response = await fetch('/api/privacy-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...privacySettings
        }),
      })

      if (response.ok) {
        setSaveStatus('success')
        setShowSuccessModal(true)
        setTimeout(() => {
          setShowSuccessModal(false)
          setSaveStatus('idle')
        }, 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      setSaveStatus('error')
    }
  }

  const handlePrivacySettingChange = (key: string, value: string) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }))
  }

  const handleForceUpdateDisplayName = async () => {
    if (!user) return
      const fullName = `${profileData.first_name} ${profileData.last_name}`.trim()
    try {
      await updateProfile({
        full_name: fullName,
        first_name: profileData.first_name,
        last_name: profileData.last_name
      })
          await refreshUser()
      alert('Display name updated')
    } catch (error) {
      console.error('Failed to update display name', error)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    
    try {
      setPhotoUploading(true)
      setPhotoError('')
      const optimizedFile = await optimizeImage(file)
      const { publicUrl } = await uploadProfilePhoto(optimizedFile, user.id)
      
      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }))
      
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...profileData,
          avatar_url: publicUrl
        })
      })
      
          await refreshUser()
        window.dispatchEvent(new CustomEvent('profileUpdated'))
    } catch (error: any) {
      setPhotoError(error.message || 'Upload failed')
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleTestStorage = async () => {
    try {
      const clientResult = await testStorageConnection()
      const serverResponse = await fetch('/api/test-storage')
      const serverResult = await serverResponse.json()
      
      if (clientResult.success && serverResult.success) {
        alert('Storage connection test successful!')
      } else {
        alert('Storage test failed. Check console.')
      }
    } catch (error) {
      alert(`Storage test error: ${error}`)
    }
  }

  const renderProfileSettings = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            Personal Information
          </CardTitle>
          <CardDescription>Update your personal details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Profile Photo Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Profile Photo</h3>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-400 to-purple-400">
                      {profileData.avatar_url ? (
                        <img src={profileData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      {photoUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                      <Button onClick={() => fileInputRef.current?.click()} disabled={photoUploading} variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                        <Upload className="w-4 h-4 mr-2" /> Upload Photo
                        </Button>
                        {profileData.avatar_url && (
                        <Button onClick={() => setProfileData(prev => ({ ...prev, avatar_url: '' }))} variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4 mr-2" /> Remove
                          </Button>
                        )}
                      </div>
                    <p className="text-xs text-gray-400">JPG, PNG, GIF up to 5MB.</p>
                    {photoError && <p className="text-xs text-red-400">{photoError}</p>}
                    </div>
                  </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
              
              <Separator className="bg-white/10" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">First Name</label>
                  <Input
                    value={profileData.first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Last Name</label>
                  <Input
                    value={profileData.last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Email</label>
                  <Input
                    value={profileData.email}
                    disabled
                    className="bg-white/5 border-white/10 text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Phone</label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Location</label>
                  <Input
                      ref={locationInputRef}
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Position/Title</label>
                  <Input
                    value={profileData.position}
                    onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderPrivacyDropdown = (key: string, currentValue: string) => (
    <Select value={currentValue} onValueChange={(value) => handlePrivacySettingChange(key, value)}>
      <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700">
        <SelectItem value="only-me" className="text-white hover:bg-gray-700">Only Me</SelectItem>
        <SelectItem value="public" className="text-white hover:bg-gray-700">Public</SelectItem>
      </SelectContent>
    </Select>
  )

  const renderUneditablePrivacyField = (key: string, value: string, label: string, description: string) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
        <div>
          <div className="text-white font-medium">{label}</div>
          <div className="text-gray-400 text-sm">{description}</div>
        </div>
      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${value === 'public' ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
        <div className={`w-2 h-2 rounded-full ${value === 'public' ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span className={`text-sm font-medium ${value === 'public' ? 'text-green-400' : 'text-red-400'}`}>
          {value === 'public' ? 'Public' : 'Only Me'}
        </span>
      </div>
    </div>
  )

  const renderPrivacySettings = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            Profile Visibility Control
          </CardTitle>
          <CardDescription>Control what information is visible on your public profile.</CardDescription>
        </CardHeader>
        
        <div className="px-6 pb-0">
          <div className="flex flex-wrap gap-2 border-b border-white/10">
            {privacyTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePrivacyTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all duration-200 border-b-2 ${activePrivacyTab === tab.id ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/50 text-cyan-400' : 'hover:bg-white/5 border-transparent text-gray-400 hover:text-white'}`}
              >
                <div className={`w-5 h-5 ${tab.bgColor} rounded-lg flex items-center justify-center`}>
                  <tab.icon className={`w-3 h-3 ${activePrivacyTab === tab.id ? tab.color : 'text-gray-400'}`} />
                </div>
                <span className="font-medium">{tab.title}</span>
              </button>
            ))}
          </div>
        </div>

        <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div> Editable Settings
                    </h3>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div><div className="text-white font-medium">First Name</div><div className="text-gray-400 text-sm">Your first name</div></div>
                      {renderPrivacyDropdown('firstName', privacySettings.firstName)}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div><div className="text-white font-medium">Location</div><div className="text-gray-400 text-sm">Your location</div></div>
                      {renderPrivacyDropdown('location', privacySettings.location)}
                    </div>
              {/* Add other fields as needed */}
                        </div>
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div> System Settings
                    </h3>
              {renderUneditablePrivacyField('username', 'public', 'Username', 'Always public')}
              {renderUneditablePrivacyField('lastName', 'only-me', 'Last Name', 'Always private')}
                      </div>
                    </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold mb-1">Save Privacy Settings</h3>
                <p className="text-gray-400 text-sm">Your privacy preferences will be applied to your public profile</p>
              </div>
            <Button onClick={handleSavePrivacySettings} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600">
              <Save className="w-4 h-4 mr-2" /> Save Settings
              </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSettings()
      case 'privacy': return renderPrivacySettings()
      default: return renderProfileSettings()
    }
  }

    return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Settings className="h-8 w-8 sm:h-12 sm:w-12 text-cyan-400 mr-3 sm:mr-4" />
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold gradient-text">Settings</h1>
            <p className="text-gray-400">Manage your account preferences</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
              <Card className="glass-card border-white/10 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white">Settings Menu</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-2">
                    {settingsSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${activeSection === section.id ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30' : 'hover:bg-white/5'}`}
                      >
                        <div className={`w-8 h-8 ${section.bgColor} rounded-lg flex items-center justify-center`}>
                          <section.icon className={`w-4 h-4 ${section.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium">{section.title}</div>
                          <div className="text-xs text-gray-400 truncate">{section.description}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </motion.div>

            <div className="lg:col-span-3">
              {renderContent()}
        </div>
      </div>
      
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <DialogTitle className="text-white text-xl font-semibold">Settings Saved!</DialogTitle>
            </div>
            <DialogDescription className="text-gray-300 text-base">
              Your changes have been successfully updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowSuccessModal(false)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 text-white">
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
