'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, UserPlus, Shield, Trash2, Loader2, Clock, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { toast } from '@/components/shared/ui/toast';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  isYou?: boolean;
  joinedAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function TeamPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  // Recruiters can only invite other recruiters (not admins)
  const inviteRole = 'recruiter';
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  // Fetch team members and invitations
  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      // Fetch team members
      const profileRes = await fetch('/api/recruiter/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        // The current user
        const currentUser: TeamMember = {
          id: profileData.user?.id || 'current',
          firstName: profileData.user?.firstName || 'You',
          lastName: profileData.user?.lastName || '',
          email: profileData.user?.email || '',
          avatarUrl: profileData.user?.avatarUrl,
          role: profileData.recruiter?.role || 'admin',
          isYou: true,
          joinedAt: profileData.recruiter?.joinedAt || new Date().toISOString(),
        };
        setTeamMembers([currentUser]);
      }

      // Fetch pending invitations
      const invitesRes = await fetch('/api/recruiter/team/invite');
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setPendingInvites(invitesData.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      const response = await fetch('/api/recruiter/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName || undefined,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      setLastInviteLink(data.invitation.inviteLink);
      setInviteEmail('');
      setInviteName('');
      
      // Refresh invitations list
      fetchTeamData();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/recruiter/team/invite?id=${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel invitation');
      }

      toast.success('Invitation cancelled');
      fetchTeamData();
    } catch (error) {
      toast.error('Failed to cancel invitation');
    }
  };

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Team</h1>
          <p className="text-gray-400 mt-1">Manage your agency team members</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-gradient-to-r from-orange-500 to-amber-600">
          <UserPlus className="h-4 w-4 mr-2" />Invite Member
        </Button>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4">Invite Team Member</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    value={inviteEmail} 
                    onChange={(e) => setInviteEmail(e.target.value)} 
                    placeholder="email@example.com" 
                    className="pl-10 bg-white/5 border-white/10 text-white" 
                  />
                </div>
                <Input 
                  value={inviteName} 
                  onChange={(e) => setInviteName(e.target.value)} 
                  placeholder="Name (optional)" 
                  className="bg-white/5 border-white/10 text-white" 
                />
              </div>
              
              {/* Role is fixed to 'recruiter' - team members cannot invite admins */}
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Role:</span>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  Recruiter
                </Badge>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleInvite} disabled={inviting} className="bg-orange-500 hover:bg-orange-600">
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send Invite
                </Button>
                <Button variant="ghost" onClick={() => { setShowInvite(false); setLastInviteLink(null); }} className="text-gray-400">
                  Cancel
                </Button>
              </div>

              {lastInviteLink && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-emerald-400 text-sm mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Invitation sent! Share this link:
                  </p>
                  <div className="flex gap-2">
                    <Input 
                      value={lastInviteLink} 
                      readOnly 
                      className="bg-white/5 border-white/10 text-white text-xs" 
                    />
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => copyInviteLink(lastInviteLink)}
                      className="border-white/10 text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" />
              Pending Invitations ({pendingInvites.length})
            </h3>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <p className="text-white">{invite.email}</p>
                    <p className="text-gray-500 text-xs">
                      Invited {new Date(invite.createdAt).toLocaleDateString()} • 
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
                      {invite.role}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleCancelInvite(invite.id)}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team List */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-400" />
            Team Members ({teamMembers.length})
          </h3>
          <div className="space-y-4">
            {teamMembers.map((member, i) => (
              <motion.div 
                key={member.id} 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: i * 0.1 }} 
                className="flex items-center justify-between p-4 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                      {member.firstName[0]}{member.lastName?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">
                        {member.firstName} {member.lastName}
                      </p>
                      {member.isYou && (
                        <Badge variant="outline" className="text-xs bg-white/5 text-gray-400">You</Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={member.role === 'admin' 
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
                      : 'bg-white/5 text-gray-400'
                    }
                  >
                    <Shield className="h-3 w-3 mr-1" />{member.role}
                  </Badge>
                  {!member.isYou && (
                    <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <h3 className="text-white font-semibold mb-2">Team Permissions</h3>
          <p className="text-gray-400 text-sm">
            Team members can post jobs, review applications, and manage interviews based on their role.
            <strong className="text-orange-400"> Admins</strong> can also invite new members and manage clients.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

