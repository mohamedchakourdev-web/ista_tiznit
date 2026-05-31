'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { MobileSidebar } from './sidebar';
import { notificationService } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { compactDateTime, getInitials, getPrimaryRole, getRoleLabel, getUserFullName } from '@/utils/domain';

export function Navbar() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const role = getPrimaryRole(user);

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationService.unread(),
    refetchInterval: 10_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationService.list(),
    refetchInterval: 10_000,
  });

  const unreadCount = unread?.meta?.total ?? unread?.data?.length ?? 0;

  const markAsRead = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Impossible de marquer la notification.'),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notifications marquées comme lues.');
    },
    onError: () => toast.error('Impossible de marquer les notifications.'),
  });

  return (
    <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between border-b border-border/40 bg-white/80 backdrop-blur-xl px-5 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <div className="hidden sm:flex items-center">
          <span className="text-[13.5px] font-medium text-foreground/70 tracking-tight">
            {getRoleLabel(role)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Global search removed per design — keep notifications and avatar only */}

        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex h-[34px] w-[34px] items-center justify-center rounded-lg text-muted-foreground/60 hover:bg-slate-50 hover:text-foreground/80 transition-all duration-200">
            <Bell className="h-[16px] w-[16px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[360px] rounded-xl border-border/50 p-0 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="px-2 py-1 text-sm font-medium">Notifications</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!unreadCount || markAllAsRead.isPending}
                onClick={() => markAllAsRead.mutate()}
                className="h-7 rounded-md px-2 text-[12px]"
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Tout lire
              </Button>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[360px] overflow-y-auto p-1">
              {!notifications?.data?.length ? (
                <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                  Aucune notification
                </div>
              ) : (
                notifications.data.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => !notification.is_read && markAsRead.mutate(notification.id)}
                    className="flex cursor-pointer flex-col items-start gap-1 rounded-lg px-3 py-2.5"
                  >
                    <div className="flex w-full items-start gap-2.5">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          notification.is_read ? 'bg-slate-300' : 'bg-primary'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-foreground">{notification.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {compactDateTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden sm:block h-5 w-px bg-border/30 mx-1" />

        {user && (
          <div className="flex items-center gap-2.5 pl-1">
            <div className="hidden sm:block text-right">
              <p className="text-[13px] font-medium text-foreground leading-tight">{getUserFullName(user)}</p>
              <p className="text-[11px] text-muted-foreground/60 leading-tight mt-[1px]">
                {getRoleLabel(role)}
              </p>
            </div>
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-[#0F172A] text-[11px] font-semibold text-white">
              {getInitials(user)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
