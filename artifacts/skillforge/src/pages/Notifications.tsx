import React from 'react';
import { useGetNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { CheckCheck, Bell, MessageSquare, AlertCircle, Info } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { getGetNotificationsQueryKey } from '@workspace/api-client-react';
import { Link } from 'wouter';

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useGetNotifications();

  const markReadMut = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      }
    }
  });

  const markAllReadMut = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      }
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'collaboration_request': return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'request_accepted': return <CheckCheck className="w-5 h-5 text-green-400" />;
      case 'request_rejected': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight mb-1 flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full font-bold">
                  {unreadCount} New
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => markAllReadMut.mutate()}
              disabled={markAllReadMut.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-card/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`glass-card rounded-2xl p-5 flex gap-4 transition-all ${!notification.isRead ? 'border-primary/50 bg-primary/5' : ''}`}
                onClick={() => !notification.isRead && markReadMut.mutate({ notificationId: notification.id })}
              >
                <div className="shrink-0 mt-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-background shadow-lg shadow-primary/20' : 'bg-secondary'}`}>
                    {getIcon(notification.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm md:text-base leading-relaxed ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground/80 font-medium flex items-center gap-1">
                      <Bell className="w-3 h-3" /> {formatDate(notification.createdAt)}
                    </span>
                    
                    {notification.relatedProjectId && (
                      <Link href={`/projects/${notification.relatedProjectId}`} className="text-xs text-primary hover:underline font-semibold">
                        View Project →
                      </Link>
                    )}
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="shrink-0 flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center">
            <Bell className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">You're all caught up</h3>
            <p className="text-muted-foreground">No new notifications right now.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
