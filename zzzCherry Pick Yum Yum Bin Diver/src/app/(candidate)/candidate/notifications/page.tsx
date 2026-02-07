'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Clock, ExternalLink, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from '@/components/shared/ui/toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
  isRead: boolean;
  isUrgent?: boolean;
  createdAt: string;
};

type FilterType = 'all' | 'unread' | 'applications' | 'interviews' | 'offers';

export default function CandidateNotificationsPage() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const fetchNotifications = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/candidate/notifications', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to load notifications');
        return;
      }
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const markAllRead = async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/candidate/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ markAllRead: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to mark all read');
        return;
      }
      toast.success('All notifications marked as read');
      await fetchNotifications();
    } catch (e) {
      console.error('Failed to mark all read:', e);
      toast.error('Failed to mark all read');
    }
  };

  const markRead = async (notificationId: string) => {
    if (!session?.access_token) return;
    try {
      await fetch('/api/candidate/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const handleInviteAction = async (notification: Notification, action: 'accept' | 'decline') => {
    if (!session?.access_token) return;
    const applicationId = notification?.metadata?.applicationId as string | undefined;
    if (!applicationId) {
      toast.error('Missing invite details');
      return;
    }

    try {
      const url =
        action === 'accept'
          ? `/api/candidate/applications/${applicationId}/accept-invite`
          : `/api/candidate/applications/${applicationId}/decline-invite`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Action failed');
        return;
      }

      toast.success(action === 'accept' ? 'Invite accepted' : 'Invite declined');
      await markRead(notification.id);
      await fetchNotifications();
    } catch (e) {
      console.error('Invite action failed:', e);
      toast.error('Action failed');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming_call':
      case 'interview_reminder':
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Filter notifications based on active filter
  const getFilteredNotifications = () => {
    let filtered = notifications;

    switch (activeFilter) {
      case 'unread':
        filtered = notifications.filter(n => !n.isRead);
        break;
      case 'applications':
        filtered = notifications.filter(n =>
          n.type.includes('application') ||
          n.type.includes('job_invite') ||
          n.type === 'application_status_update'
        );
        break;
      case 'interviews':
        filtered = notifications.filter(n =>
          n.type.includes('interview') ||
          n.type.includes('incoming_call')
        );
        break;
      case 'offers':
        filtered = notifications.filter(n =>
          n.type.includes('offer') ||
          n.type === 'offer_received' ||
          n.type === 'offer_accepted'
        );
        break;
      default:
        filtered = notifications;
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  const filterButtons: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'applications', label: 'Applications' },
    { key: 'interviews', label: 'Interviews' },
    { key: 'offers', label: 'Offers' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 mt-1">Stay up to date across your application journey</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllRead}
              className="border-white/10 text-gray-300 hover:text-white"
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
        {filterButtons.map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(filter.key)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap",
              activeFilter === filter.key
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-0"
                : "border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
            )}
          >
            {filter.label}
            {filter.count !== undefined && (
              <Badge
                variant="secondary"
                className={cn(
                  "ml-1 px-1.5 py-0 text-[10px]",
                  activeFilter === filter.key
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-gray-400"
                )}
              >
                {filter.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center text-gray-400">Loading...</CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-10 text-center">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">
              {activeFilter === 'all'
                ? 'No notifications yet'
                : `No ${activeFilter} notifications`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <Card key={n.id} className={`bg-white/5 border-white/10 ${!n.isRead ? 'ring-1 ring-orange-500/20' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${n.isUrgent ? 'text-red-400' : 'text-gray-400'}`}>{getTypeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${!n.isRead ? 'text-white' : 'text-gray-200'}`}>{n.title}</h3>
                        {!n.isRead && <Badge className="bg-orange-500/20 text-orange-300 border-none">New</Badge>}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mt-1">{n.message}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {n.type === 'job_invite' && n?.metadata?.applicationId && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleInviteAction(n, 'accept')}
                            className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleInviteAction(n, 'decline')}
                            className="text-red-300 hover:text-red-200 hover:bg-red-500/10"
                          >
                            Decline
                          </Button>
                        </>
                      )}

                      {n.actionUrl && (
                        <Link href={n.actionUrl}>
                          <Button size="sm" variant="outline" className="border-white/10 text-gray-300 hover:text-white">
                            {n.actionLabel || 'View'}
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Button>
                        </Link>
                      )}

                      {!n.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markRead(n.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


