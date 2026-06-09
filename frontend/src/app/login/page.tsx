'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService, getApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  Shield,
  ShieldCheck,
  BarChart3,
  Zap,
  CheckCircle2,
  Users,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { getDashboardPath, getPrimaryRole, getUserFullName } from '@/utils/domain';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe requis (8 caracteres minimum)'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Veuillez saisir votre adresse email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      toast.error('Adresse email invalide.');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await authService.forgotPassword(forgotEmail);
      toast.success(response.message || 'Un email avec votre nouveau mot de passe a été envoyé.');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Impossible de réinitialiser le mot de passe.'));
    } finally {
      setForgotLoading(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await authService.login({ ...data, device_name: 'web-app' });
      const { token, user } = response.data;
      setAuth(user, token);

      const next = new URLSearchParams(window.location.search).get('next');
      toast.success(`Bienvenue, ${getUserFullName(user)}`);
      router.push(next || getDashboardPath(getPrimaryRole(user)));
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Identifiants invalides'));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: 'Suivi en temps réel',
      desc: 'Tableaux de bord dynamiques et alertes instantanées',
    },
    {
      icon: Zap,
      title: 'Workflow automatisé',
      desc: 'Validation fluide des autorisations et gestion des absences',
    },
    {
      icon: Shield,
      title: 'Sécurité entreprise',
      desc: 'Authentification sécurisée et traçabilité complète',
    },
  ];

  const stats = [
    { icon: Users, value: '1200+', label: 'Utilisateurs actifs' },
    { icon: TrendingUp, value: '95%', label: 'Taux de présence' },
    { icon: ShieldCheck, value: '24/7', label: 'Suivi en temps réel' },
  ];

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden selection:bg-[#0F766E]/20">
      {/* ═══ Campus background photo (spans full screen, untouched) ═══ */}
      <Image
        src="/ista-tiznit.png"
        alt="ISTA Tiznit"
        fill
        priority
        sizes="100vw"
        unoptimized
        className="object-cover object-center select-none pointer-events-none -z-20"
      />

      {/* ═══ Left-side dark overlay only — keeps the sky bright ═══ */}
      {/* Horizontal scrim for left-edge text legibility */}
      <div
        className="absolute inset-0 -z-10 hidden lg:block pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(7,24,38,0.55) 0%, rgba(7,24,38,0.30) 30%, rgba(7,24,38,0.10) 52%, rgba(7,24,38,0) 64%)',
        }}
      />
      {/* Bottom-left darken for the cards / statistics, leaving the sky untouched */}
      <div
        className="absolute inset-0 -z-10 hidden lg:block pointer-events-none"
        style={{
          background:
            'linear-gradient(0deg, rgba(4,16,26,0.50) 0%, rgba(4,16,26,0.12) 34%, rgba(4,16,26,0) 60%)',
        }}
      />
      {/* Mobile scrim so the white card reads cleanly over the photo */}
      <div className="absolute inset-0 -z-10 lg:hidden bg-[#06141f]/45 pointer-events-none" />

      {/* ═══ LEFT: Marketing panel ═══ */}
      <div className="relative z-10 hidden lg:flex lg:w-1/2 flex-col justify-center px-[5%] xl:px-[7.5%]">
        <div
          className={`max-w-[480px] transition-all duration-700 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >

          {/* Headline */}
          <h1 className="font-serif font-bold text-white tracking-[-0.02em] leading-[1.1] text-[28px] xl:text-[38px] lg:text-[32px]">
            Gestion intelligente
            <br />
            <span className="text-[#2DD4BF]">des absences</span>
          </h1>

          {/* Description */}
          <p className="mt-2 xl:mt-4 max-w-[440px] text-[14px] xl:text-[16px] leading-[1.45] text-white/80">
            Une plateforme moderne et centralisée pour automatiser le suivi des absences et
            simplifier la gestion de votre établissement.
          </p>

          {/* Feature cards */}
          <div className="mt-4 xl:mt-7 space-y-2 xl:space-y-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`flex items-center gap-3 xl:gap-4 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-2 xl:px-5 xl:py-3 shadow-[0_8px_30px_rgba(2,8,20,0.18)] backdrop-blur-md transition-all duration-500 ease-out ${
                  mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
                }`}
                style={{ transitionDelay: mounted ? `${200 + i * 90}ms` : '0ms' }}
              >
                <div className="flex h-9 w-9 xl:h-11 xl:w-11 shrink-0 items-center justify-center rounded-2xl border border-[#2DD4BF]/20 bg-[#2DD4BF]/[0.14]">
                  <feature.icon className="h-[18px] w-[18px] xl:h-[21px] xl:w-[21px] text-[#2DD4BF]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] xl:text-[15px] font-semibold leading-tight text-white">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-[11px] xl:text-[13px] leading-snug text-white/70">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Statistics panel */}
          <div
            className={`mt-4 xl:mt-7 flex items-center rounded-2xl border border-white/12 bg-[#0a1822]/55 px-4 py-2 xl:px-5 xl:py-3 shadow-[0_12px_34px_rgba(2,8,20,0.28)] backdrop-blur-md transition-all duration-500 ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: mounted ? '520ms' : '0ms' }}
          >
            {stats.map((stat) => (
              <div key={stat.value} className="flex flex-1 items-center gap-2.5">
                <div className="flex h-8 w-8 xl:h-10 xl:w-10 shrink-0 items-center justify-center rounded-xl bg-[#2DD4BF]/[0.12]">
                  <stat.icon className="h-[16px] w-[16px] xl:h-[18px] xl:w-[18px] text-[#2DD4BF]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[18px] xl:text-[22px] font-bold leading-none text-white">{stat.value}</p>
                  <p className="mt-1 whitespace-nowrap text-[11px] leading-tight text-white/60">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: Auth card ═══ */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="flex w-full items-center justify-center px-4 sm:px-6">
          <div
            className={`login-card w-full max-w-[460px] lg:max-w-[500px] xl:max-w-[560px] rounded-[24px] sm:rounded-[30px] bg-white shadow-[0_30px_80px_-20px_rgba(8,20,35,0.45)] transition-all duration-700 ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '200ms', padding: 'clamp(1.5rem, 4.5vh, 1.75rem) clamp(1.25rem, 3vw, 3rem)' }}
          >
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative overflow-hidden rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.14)] ring-1 ring-slate-100" style={{ width: 'clamp(3.75rem, 10vh, 5rem)', height: 'clamp(3.75rem, 10vh, 5rem)' }}>
              <Image
                src="/ofppt-logo.png"
                alt="Logo OFPPT"
                fill
                sizes="88px"
                loading="eager"
                className="scale-[1.05] object-cover"
              />
            </div>
          </div>

          {!showForgotPassword ? (
            <>
              {/* Heading */}
              <h2 className="text-center font-serif font-bold leading-[1.1] tracking-[-0.01em] text-[#1E293B]" style={{ fontSize: 'clamp(1.375rem, 4vh, 1.75rem)', marginTop: 'clamp(0.75rem, 2.5vh, 1.25rem)' }}>
                Bon retour !
              </h2>
              <p className="mt-1 text-center text-[14px] text-[#64748B]">
                Connectez-vous à votre espace de gestion
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3" style={{ marginTop: 'clamp(1rem, 3vh, 1.5rem)' }}>
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[13px] font-semibold text-[#334155]">
                    Adresse email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
                    <Input
                      key="login-email"
                      id="email"
                      type="email"
                      placeholder="nom@ofppt.local"
                      {...register('email')}
                      className="rounded-[12px] sm:rounded-[14px] border border-[#E2E8F0] bg-white pl-11 sm:pl-12 pr-4 text-[14px] text-[#0F172A] shadow-none placeholder:text-[#94A3B8] transition-colors focus-visible:border-[#0F766E]/55 focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                      style={{ height: 'clamp(2.625rem, 6.5vh, 3rem)' }}
                      autoFocus
                    />
                  </div>
                  {errors.email && (
                    <p className="flex items-center gap-1 text-[12px] font-medium text-[#DC2626]">
                      <span className="inline-block h-1 w-1 rounded-full bg-[#DC2626]" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[13px] font-semibold text-[#334155]">
                      Mot de passe
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[13px] font-medium text-[#0F766E] underline-offset-4 transition-colors hover:text-[#115E59] hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
                    <Input
                      key={`login-password-${showPassword ? 'text' : 'password'}`}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className="rounded-[12px] sm:rounded-[14px] border border-[#E2E8F0] bg-white pl-11 sm:pl-12 pr-12 text-[14px] text-[#0F172A] shadow-none placeholder:text-[#94A3B8] transition-colors focus-visible:border-[#0F766E]/55 focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                      style={{ height: 'clamp(2.625rem, 6.5vh, 3rem)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#94A3B8] transition-colors hover:text-[#475569]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="flex items-center gap-1 text-[12px] font-medium text-[#DC2626]">
                      <span className="inline-block h-1 w-1 rounded-full bg-[#DC2626]" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked === true)}
                    className="size-[18px] rounded-[5px] border-[#CBD5E1]"
                  />
                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-[13px] font-medium text-[#334155]"
                  >
                    Se souvenir de moi
                  </Label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="relative w-full border-0 bg-clip-border rounded-[14px] bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-[15px] font-semibold text-white shadow-[0_12px_26px_-8px_rgba(15,118,110,0.55)] transition-all duration-200 hover:shadow-[0_16px_32px_-8px_rgba(15,118,110,0.6)] hover:brightness-[1.04] disabled:opacity-60"
                  style={{ height: 'clamp(2.75rem, 7vh, 3.125rem)' }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                      <span>Connexion...</span>
                    </div>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <span className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/15">
                        <ArrowRight className="size-[18px]" />
                      </span>
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Forgot-password heading */}
              <h2 className="text-center font-serif font-bold leading-[1.1] tracking-[-0.01em] text-[#1E293B]" style={{ fontSize: 'clamp(1.25rem, 3.5vh, 1.5rem)', marginTop: 'clamp(0.5rem, 1.5vh, 1.25rem)' }}>
                Mot de passe oublié ?
              </h2>
              <p className="mx-auto mt-1.5 max-w-[340px] text-center text-[14px] leading-relaxed text-[#64748B]">
                Saisissez votre adresse email pour recevoir un nouveau mot de passe temporaire.
              </p>
              <form onSubmit={handleForgotPasswordSubmit} noValidate className="space-y-3" style={{ marginTop: 'clamp(0.75rem, 2vh, 1.5rem)' }}>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-[13px] font-semibold text-[#334155]">
                    Adresse email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
                    <Input
                      key="forgot-email"
                      id="forgot-email"
                      type="email"
                      placeholder="nom@ofppt.local"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="rounded-[12px] sm:rounded-[14px] border border-[#E2E8F0] bg-white pl-11 sm:pl-12 pr-4 text-[14px] text-[#0F172A] shadow-none placeholder:text-[#94A3B8] transition-colors focus-visible:border-[#0F766E]/55 focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                      style={{ height: 'clamp(2.25rem, 5.5vh, 3rem)' }}
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="relative w-full rounded-[12px] sm:rounded-[14px] bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-[15px] font-semibold text-white shadow-[0_12px_26px_-8px_rgba(15,118,110,0.55)] transition-all duration-200 hover:shadow-[0_16px_32px_-8px_rgba(15,118,110,0.6)] hover:brightness-[1.04] disabled:opacity-60"
                  style={{ height: 'clamp(2.5rem, 6vh, 3.125rem)' }}
                >
                  {forgotLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                      <span>Envoi en cours...</span>
                    </div>
                  ) : (
                    <>
                      <span>Envoyer le mot de passe</span>
                      <span className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20">
                        <ArrowRight className="size-[18px]" />
                      </span>
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail('');
                  }}
                  className="w-full text-center text-[13px] font-semibold text-[#475569] transition-colors hover:text-[#0F172A]"
                >
                  Retour à la connexion
                </button>
              </form>
            </>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3" style={{ marginTop: 'clamp(0.75rem, 2.5vh, 1.25rem)' }}>
            <div className="flex items-center justify-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" style={{ height: 'clamp(2.375rem, 6vh, 2.875rem)' }}>
              <Shield className="h-[18px] w-[18px] shrink-0 text-[#0F766E]" />
              <span className="text-[12px] font-medium text-[#374151]">Chiffrement SSL</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" style={{ height: 'clamp(2.375rem, 6vh, 2.875rem)' }}>
              <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-[#0F766E]" />
              <span className="text-[12px] font-medium text-[#374151]">Accès sécurisé</span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-[#94A3B8]" style={{ marginTop: 'clamp(0.75rem, 2.5vh, 1.25rem)' }}>
            © 2026 OFPPT – ISTA Tiznit
            <span className="mx-2 text-[#CBD5E1]">|</span>
            Version 1.0.0
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
