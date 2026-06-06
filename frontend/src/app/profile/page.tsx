'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, ImageUp, KeyRound, Loader2, Save, Shield, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/store/auth.store';
import { getApiErrorMessage, getValidationErrors, profileService } from '@/services/api';
import type { UpdatePasswordPayload, UpdateProfilePayload, UserRole } from '@/types';
import {
  getAvatarUrl,
  getFormateurTypeLabel,
  getInitials,
  getPrimaryRole,
  getRoleLabel,
  getUserFullName,
} from '@/utils/domain';

const allowedRoles: UserRole[] = ['directeur', 'gestionnaire', 'formateur'];
const allowedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxAvatarSize = 2 * 1024 * 1024;

const profileSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire.').max(100, 'Le nom est trop long.'),
  prenom: z.string().min(1, 'Le prenom est obligatoire.').max(100, 'Le prenom est trop long.'),
  email: z.string().trim().min(1, 'L adresse email est obligatoire.').email('Adresse email invalide.'),
  telephone: z
    .string()
    .max(30, 'Le telephone est trop long.')
    .refine((value) => value === '' || /^[0-9]+$/.test(value), {
      message: 'Le numéro de téléphone doit contenir uniquement des chiffres.',
    })
    .optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Le mot de passe actuel est obligatoire.'),
  new_password: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caracteres.'),
  new_password_confirmation: z.string().min(1, 'Veuillez confirmer le nouveau mot de passe.'),
}).refine((values) => values.new_password === values.new_password_confirmation, {
  path: ['new_password_confirmation'],
  message: 'La confirmation du nouveau mot de passe ne correspond pas.',
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-[12px] text-destructive">{message}</p>;
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value || '-'} disabled className="h-9 rounded-lg border-border/50 bg-muted/40 text-[14px]" />
    </div>
  );
}

function ProfileContent() {
  const queryClient = useQueryClient();
  const { user: authUser, setUser } = useAuthStore();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nom: '', prenom: '', email: '', telephone: '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.get(),
  });

  const profile = profileQuery.data?.data ?? authUser;
  const role = getPrimaryRole(profile);
  const roleLabel = getRoleLabel(role);
  const fullName = getUserFullName(profile);
  const currentAvatarUrl = avatarPreview ?? getAvatarUrl(profile);

  useEffect(() => {
    if (!profileQuery.data?.data) return;
    setUser(profileQuery.data.data);
  }, [profileQuery.data, setUser]);

  useEffect(() => {
    if (!profile) return;

    profileForm.reset({
      nom: profile.nom ?? '',
      prenom: profile.prenom ?? '',
      email: profile.email ?? '',
      telephone: profile.telephone ?? '',
    });
  }, [profile, profileForm]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileService.update(payload),
    onSuccess: (response) => {
      setUser(response.data);
      queryClient.setQueryData(['profile'], response);
      toast.success('Profil mis a jour.');
    },
    onError: (error) => {
      const validationErrors = getValidationErrors(error);

      Object.entries(validationErrors).forEach(([field, messages]) => {
        if (field === 'nom' || field === 'prenom' || field === 'email' || field === 'telephone') {
          profileForm.setError(field, { message: messages[0] });
        }
      });

      toast.error(getApiErrorMessage(error, 'Impossible de mettre a jour le profil.'));
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: (file: File) => profileService.updateAvatar(file),
    onSuccess: (response) => {
      setUser(response.data);
      queryClient.setQueryData(['profile'], response);
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarError(null);
      toast.success('Avatar mis a jour.');
    },
    onError: (error) => {
      const validationErrors = getValidationErrors(error);
      setAvatarError(validationErrors.avatar?.[0] ?? getApiErrorMessage(error, 'Impossible de mettre a jour l avatar.'));
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => profileService.updatePassword(payload),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Mot de passe mis a jour.');
    },
    onError: (error) => {
      const validationErrors = getValidationErrors(error);

      Object.entries(validationErrors).forEach(([field, messages]) => {
        if (
          field === 'current_password'
          || field === 'new_password'
          || field === 'new_password_confirmation'
        ) {
          passwordForm.setError(field, { message: messages[0] });
        }
      });

      toast.error(getApiErrorMessage(error, 'Impossible de mettre a jour le mot de passe.'));
    },
  });

  const handleProfileSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate({
      nom: values.nom.trim(),
      prenom: values.prenom.trim(),
      email: values.email.trim(),
      telephone: values.telephone?.trim() || null,
    });
  };

  const handlePasswordSubmit = (values: PasswordFormValues) => {
    updatePasswordMutation.mutate(values);
  };

  const handleAvatarChange = (file: File | undefined) => {
    setAvatarError(null);

    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

    if (!allowedAvatarTypes.includes(file.type)) {
      setAvatarError('Formats autorises : JPG, JPEG, PNG, WEBP.');
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

    if (file.size > maxAvatarSize) {
      setAvatarError('La taille maximale autorisee est 2 MB.');
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!avatarFile) {
      setAvatarError('Veuillez choisir une image.');
      return;
    }

    updateAvatarMutation.mutate(avatarFile);
  };

  if (!profile && profileQuery.isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Mon profil" description="Informations du compte et securite" icon={UserRound} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[16px]">
              <Shield className="h-4 w-4 text-primary" />
              Informations personnelles
            </CardTitle>
            <CardDescription>Le champ Email est modifiable depuis le profil. Role et Type restent en lecture seule.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} noValidate className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    {...profileForm.register('nom')}
                    className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]"
                  />
                  <FieldError message={profileForm.formState.errors.nom?.message} />
                </div>

                <div className="space-y-2">
                  <Label>Prenom</Label>
                  <Input
                    {...profileForm.register('prenom')}
                    className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]"
                  />
                  <FieldError message={profileForm.formState.errors.prenom?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    autoComplete="email"
                    {...profileForm.register('email')}
                    className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]"
                  />
                  <FieldError message={profileForm.formState.errors.email?.message} />
                </div>

                <div className="space-y-2">
                  <Label>Telephone</Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    {...profileForm.register('telephone', {
                      onChange: (event) => {
                        event.target.value = event.target.value.replace(/\D/g, '');
                      },
                    })}
                    className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]"
                  />
                  <FieldError message={profileForm.formState.errors.telephone?.message} />
                </div>

                <ReadonlyField label="Role" value={roleLabel} />

                {role === 'formateur' && (
                  <ReadonlyField label="Type" value={getFormateurTypeLabel(profile?.type)} />
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="rounded-lg bg-primary text-white hover:bg-primary-hover"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[16px]">
              <Camera className="h-4 w-4 text-primary" />
              Avatar
            </CardTitle>
            <CardDescription>Photo actuelle</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAvatarSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-2.5 text-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#0F172A] text-[24px] font-bold text-white ring-1 ring-border/60">
                  {currentAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentAvatarUrl} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(profile)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-foreground">{fullName || '-'}</p>
                  <p className="text-[12px] text-muted-foreground">{roleLabel || '-'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="avatar"
                  className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border/50 bg-background px-3 text-[13px] font-medium transition-colors hover:bg-muted"
                >
                  <ImageUp className="h-4 w-4" />
                  Choisir une image
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(event) => handleAvatarChange(event.target.files?.[0])}
                  className="sr-only"
                />
                <p className="text-center text-[12px] text-muted-foreground">JPG, JPEG, PNG, WEBP - max 2 MB</p>
                <FieldError message={avatarError ?? undefined} />
              </div>

              <Button
                type="submit"
                disabled={!avatarFile || updateAvatarMutation.isPending}
                className="w-full rounded-lg bg-primary text-white hover:bg-primary-hover"
              >
                {updateAvatarMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Sauvegarder
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px]">
            <KeyRound className="h-4 w-4 text-primary" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>Le mot de passe actuel est requis pour valider le changement.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Mot de passe actuel</Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register('current_password')}
                  className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]"
                />
                <FieldError message={passwordForm.formState.errors.current_password?.message} />
              </div>

              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('new_password')}
                  className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]"
                />
                <FieldError message={passwordForm.formState.errors.new_password?.message} />
              </div>

              <div className="space-y-2">
                <Label>Confirmer le nouveau mot de passe</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('new_password_confirmation')}
                  className="h-9 rounded-lg border-border/50 bg-muted/30 text-[14px]"
                />
                <FieldError message={passwordForm.formState.errors.new_password_confirmation?.message} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updatePasswordMutation.isPending}
                className="rounded-lg bg-primary text-white hover:bg-primary-hover"
              >
                {updatePasswordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Modifier le mot de passe
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, loading } = useAuthGuard(allowedRoles);

  if (!isAuthenticated || loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardLayout>
      <ProfileContent />
    </DashboardLayout>
  );
}
