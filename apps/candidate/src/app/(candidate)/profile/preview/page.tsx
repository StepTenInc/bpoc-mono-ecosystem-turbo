'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Briefcase,
  User,
  Globe,
  Loader2
} from 'lucide-react'

export default function ProfilePreviewPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return
      
      try {
        const res = await fetch(`/api/candidates/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setProfile(data.candidate)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link 
          href="/profile" 
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Link>
        <Link href="/profile">
          <Button variant="outline" className="border-white/10">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Profile Preview Card */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-cyan-500/20 to-purple-500/20" />
        
        {/* Profile Info */}
        <CardContent className="relative pt-0">
          {/* Avatar */}
          <div className="absolute -top-16 left-6">
            <div className="w-32 h-32 rounded-full border-4 border-[#0B0B0D] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-gray-600" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="pt-20 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {profile?.first_name && profile?.last_name 
                  ? `${profile.first_name} ${profile.last_name}`
                  : 'Your Name'}
              </h1>
              {profile?.headline && (
                <p className="text-gray-400 mt-1">{profile.headline}</p>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4">
              {profile?.location && (
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {user?.email && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile?.bio && (
              <div className="space-y-2">
                <h3 className="text-white font-medium">About</h3>
                <p className="text-gray-400">{profile.bio}</p>
              </div>
            )}

            {/* Work Preferences */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-white font-medium">Work Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {profile?.work_status && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {profile.work_status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </Badge>
                )}
                {profile?.preferred_shift && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {profile.preferred_shift} Shift
                  </Badge>
                )}
                {profile?.preferred_work_setup && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {profile.preferred_work_setup.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </Badge>
                )}
              </div>
              
              {(profile?.expected_salary_min || profile?.expected_salary_max) && (
                <div className="text-gray-400 text-sm">
                  Expected Salary: ₱{profile.expected_salary_min?.toLocaleString()} - ₱{profile.expected_salary_max?.toLocaleString()}
                </div>
              )}
            </div>

            {/* Social Links */}
            {(profile?.linkedin || profile?.github || profile?.website) && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-white font-medium">Links</h3>
                <div className="flex flex-wrap gap-3">
                  {profile?.linkedin && (
                    <a 
                      href={profile.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                    >
                      <Globe className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {profile?.github && (
                    <a 
                      href={profile.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                    >
                      <Globe className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                  {profile?.website && (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-cyan-500/5 border-cyan-500/20">
        <CardContent className="py-4">
          <p className="text-cyan-400 text-sm">
            💡 This is how employers will see your profile. Make sure all information is up to date!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
