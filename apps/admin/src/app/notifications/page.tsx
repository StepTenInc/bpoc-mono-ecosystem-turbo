'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from '@/components/shared/ui/toast';
import { formatDistanceToNow } from 'date-fns';

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

export default function AdminNotificationsPage() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications', {
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
      const res = await fetch('/api/admin/notifications', {
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
      await fetch('/api/admin/notifications', {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming_call':
      case 'interview_reminder':
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 mt-1">Admin alerts and system events</p>
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

      {loading ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center text-gray-400">Loading...</CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-10 text-center">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={`bg-white/5 border-white/10 ${!n.isRead ? 'ring-1 ring-red-500/20' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${n.isUrgent ? 'text-red-400' : 'text-gray-400'}`}>{getTypeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${!n.isRead ? 'text-white' : 'text-gray-200'}`}>{n.title}</h3>
                        {!n.isRead && <Badge className="bg-red-500/20 text-red-300 border-none">New</Badge>}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mt-1">{n.message}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
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


