'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, LogOut, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { MobileSidebar } from './sidebar';
import { authService, autorisationService, notificationService } from '@/services/api';
import type { ApiCollectionResponse, Notification } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AbsenceDetailsDialog } from '@/components/shared/absence-details-dialog';
import { AutorisationDetailsDialog } from '@/components/shared/autorisation-details-dialog';
import {
  compactDateTime,
  getAvatarUrl,
  getInitials,
  getPrimaryRole,
  getRoleLabel,
  getUserFullName,
} from '@/utils/domain';

export function Navbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const role = getPrimaryRole(user);
  const roleLabel = getRoleLabel(role);
  const fullName = getUserFullName(user);
  const avatarUrl = getAvatarUrl(user);
  const canViewNotifications = role === 'formateur';
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationService.unread(),
    refetchInterval: 10_000,
    enabled: canViewNotifications,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationService.list(),
    refetchInterval: 10_000,
    enabled: canViewNotifications,
  });

  const unreadCount = unread?.meta?.total ?? unread?.data?.length ?? 0;

  const markAsRead = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: (response) => {
      const updatedNotification = response.data;

      queryClient.setQueryData<ApiCollectionResponse<Notification> | undefined>(['notifications', 'list'], (current) => {
        if (!current) return current;

        return {
          ...current,
          data: current.data.map((item) => (item.id === updatedNotification.id ? updatedNotification : item)),
        };
      });

      queryClient.setQueryData<ApiCollectionResponse<Notification> | undefined>(['notifications', 'unread'], (current) => {
        if (!current) return current;

        const nextTotal = Math.max(0, (current.meta?.total ?? current.data.length) - 1);

        return {
          ...current,
          data: current.data.filter((item) => item.id !== updatedNotification.id),
          meta: current.meta
            ? {
                ...current.meta,
                total: nextTotal,
                from: nextTotal > 0 ? current.meta.from : null,
                to: nextTotal > 0 ? current.meta.to : null,
              }
            : current.meta,
        };
      });

      setSelectedNotification((current) => (current?.id === updatedNotification.id ? updatedNotification : current));
    },
    onError: () => toast.error('Impossible de marquer la notification.'),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      const timestamp = new Date().toISOString();

      queryClient.setQueryData<ApiCollectionResponse<Notification> | undefined>(['notifications', 'list'], (current) => {
        if (!current) return current;

        return {
          ...current,
          data: current.data.map((item) =>
            item.is_read
              ? item
              : {
                  ...item,
                  is_read: true,
                  read_at: item.read_at ?? timestamp,
                },
          ),
        };
      });

      queryClient.setQueryData<ApiCollectionResponse<Notification> | undefined>(['notifications', 'unread'], (current) => {
        if (!current) return current;

        return {
          ...current,
          data: [],
          meta: current.meta
            ? {
                ...current.meta,
                total: 0,
                from: null,
                to: null,
              }
            : current.meta,
        };
      });

      setSelectedNotification((current) =>
        current
          ? {
              ...current,
              is_read: true,
              read_at: current.read_at ?? timestamp,
            }
          : current,
      );

      toast.success('Notifications marquees comme lues.');
    },
    onError: () => toast.error('Impossible de marquer les notifications.'),
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    if (notification.type === 'autorisation') {
      if (notification.autorisation) {
        setSelectedNotification(notification);
      }

      try {
        const autorisationId = notification.autorisation_id ?? notification.autorisation?.id;

        if (autorisationId) {
          const response = await autorisationService.formateurGet(autorisationId);
          setSelectedNotification({
            ...notification,
            autorisation: response.data,
          });
          queryClient.invalidateQueries({ queryKey: ['formateur', 'autorisations'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } else {
          const response = await notificationService.show(notification.id);
          if (response.data.autorisation) {
            setSelectedNotification(response.data);
          }
        }
      } catch {
        toast.error("Impossible de charger les details de l'autorisation.");
      }

      return;
    }

    if (notification.type === 'absence') {
      if (notification.absence) {
        setSelectedNotification(notification);
        return;
      }

      try {
        const response = await notificationService.show(notification.id);
        if (response.data.absence) {
          setSelectedNotification(response.data);
        }
      } catch {
        toast.error("Impossible de charger les details de l'absence.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // The local session must still be cleared if the API token is already invalid.
    }

    clearAuth();
    router.push('/login');
  };

  const selectedAutorisation = selectedNotification?.type === 'autorisation' ? selectedNotification.autorisation ?? null : null;
  const selectedAbsence = selectedNotification?.type === 'absence' ? selectedNotification.absence ?? null : null;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between border-b border-border/40 bg-white/80 px-5 backdrop-blur-xl lg:px-8">
        <div className="flex items-center gap-3">
          <MobileSidebar />
          <div className="hidden items-center sm:flex">
            <span className="text-[13.5px] font-medium tracking-tight text-foreground/70">
              {getRoleLabel(role)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Global search removed per design - keep notifications and avatar only */}

          {canViewNotifications && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="relative flex h-[34px] w-[34px] items-center justify-center rounded-lg text-muted-foreground/60 transition-all duration-200 hover:bg-slate-50 hover:text-foreground/80">
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
                          onClick={() => void handleNotificationClick(notification)}
                          className="flex cursor-pointer flex-col items-start gap-1 rounded-lg px-3 py-2.5 hover:bg-muted data-[highlighted]:bg-muted"
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

              <div className="hidden h-5 w-px bg-border/30 sm:block mx-1" />
            </>
          )}

          {user && (
            <div className="flex items-center gap-2.5 pl-1">
              <div className="hidden sm:block text-right">
                <p className="text-[13px] font-medium leading-tight text-foreground">{fullName}</p>
                <p className="mt-[1px] text-[11px] leading-tight text-muted-foreground/60">
                  {roleLabel}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-lg outline-none ring-offset-background transition-all duration-200 hover:ring-2 hover:ring-primary/20 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Menu utilisateur"
                >
                  <Avatar className="h-[34px] w-[34px] rounded-lg after:rounded-lg" size="default">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} className="rounded-lg" />}
                    <AvatarFallback className="rounded-lg bg-[#0F172A] text-[11px] font-semibold text-white">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl border-border/50 p-1.5 shadow-lg">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-[14px] font-semibold text-foreground">{fullName}</p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      ROLE : {roleLabel}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="gap-2.5 px-3 py-2 text-[13px]">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void handleLogout()}
                    className="gap-2.5 px-3 py-2 text-[13px] text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Deconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      <AutorisationDetailsDialog
        open={selectedAutorisation !== null}
        autorisation={selectedAutorisation}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNotification(null);
          }
        }}
        currentUser={user}
      />

      <AbsenceDetailsDialog
        open={selectedAbsence !== null}
        absence={selectedAbsence}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNotification(null);
          }
        }}
      />
    </>
  );
}
