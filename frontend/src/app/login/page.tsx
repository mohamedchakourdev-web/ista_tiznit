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
import { Eye, EyeOff, ArrowRight, Shield, BarChart3, Zap, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="relative flex h-screen overflow-hidden selection:bg-[#0F766E]/20">

      {/* ═══ Continuous campus photo background (spans full screen) ═══ */}
      <Image
        src="/ista-tiznit.png"
        alt="ISTA Tiznit"
        fill
        preload
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        unoptimized
        className="object-cover object-center select-none pointer-events-none -z-20"
      />

      {/* One continuous desktop treatment with a 250px cinematic transition zone */}
      <div
        className="absolute inset-0 -z-10 hidden lg:block pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(8,24,38,0.48) 0%, rgba(10,36,52,0.40) calc(53% - 125px), rgba(15,23,42,0.35) calc(53% - 80px), rgba(15,23,42,0.24) calc(53% - 20px), rgba(255,255,255,0.08) calc(53% + 45px), rgba(255,255,255,0.12) calc(53% + 125px), rgba(255,255,255,0.18) 100%)',
        }}
      />
      <div className="absolute top-[15%] right-[51%] -z-10 hidden h-[520px] w-[520px] rounded-full bg-[#0F766E]/14 blur-[90px] pointer-events-none lg:block" />
      <div className="absolute top-0 right-0 -z-10 hidden h-[560px] w-[560px] bg-gradient-to-bl from-[#E9D5A8]/24 via-[#F2E3BC]/12 to-transparent pointer-events-none lg:block" />
      <div className="absolute -top-40 left-[76%] -z-10 hidden h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-white/[0.07] blur-[60px] pointer-events-none lg:block" />

      {/* ═══ LEFT: Branding Panel ═══ */}
      <div className="hidden lg:flex lg:w-[54%] xl:w-[52%] relative overflow-hidden">

        {/* Ambient teal glow accents (subtle, less intrusive) */}
        <div className="absolute bottom-[10%] left-[5%] w-[420px] h-[420px] bg-[#2DD4BF]/8 rounded-full blur-[80px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full w-full max-w-[520px] ml-auto mr-16 xl:mr-24 px-8">

          {/* Logo + Headline (integrated flow) */}
          <div
            className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            {/* Logo */}
            <div className="relative inline-block mb-7">
              <div className="absolute inset-0 w-[68px] h-[68px] bg-[#0F766E]/20 rounded-[16px] blur-[20px] -translate-x-[4px] -translate-y-[4px] pointer-events-none" />
              <div className="relative h-14 w-14 rounded-[14px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/[0.1]">
                <Image
                  src="/ofppt-logo.png"
                  alt="Logo OFPPT"
                  fill
                  sizes="100vw"
                  loading="eager"
                  className="object-cover bg-white"
                />
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-[36px] xl:text-[40px] font-bold text-[#FFFFFF] tracking-[-0.02em] leading-[1.05] mb-4 max-w-[520px]">
              Gestion intelligente
              <br />
              <span className="text-[#2DD4BF]">des absences</span>
            </h2>
            <p className="text-[15px] text-white/[0.85] leading-[1.65] mb-8 max-w-[420px]">
              Une plateforme moderne et centralisée pour automatiser le suivi des absences et simplifier la gestion de l&apos;établissement.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-2.5 mb-8">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl border border-white/16 bg-white/[0.08] backdrop-blur-sm shadow-[0_8px_22px_rgba(2,6,23,0.10)] hover:bg-white/[0.10] hover:border-white/[0.20] hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgba(2,6,23,0.16)] transition-all duration-300 ease-out ${
                  mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
                }`}
                style={{ transitionDelay: mounted ? `${200 + i * 100}ms` : '0ms' }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-b from-[#0F766E]/22 to-[#0F766E]/8 border border-[#0F766E]/20 group-hover:border-[#0F766E]/30 transition-all duration-300">
                  <feature.icon className="h-[17px] w-[17px] text-[#2DD4BF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-white/[0.95] leading-tight">
                    {feature.title}
                  </p>
                  <p className="text-[12.5px] text-white/[0.82] leading-snug mt-0.5 font-medium">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: Auth Panel ═══ */}
      <div className="flex flex-1 items-center justify-center px-6 relative overflow-hidden">

        {/* Mobile-only glass wash; desktop uses the continuous page-level transition */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/16 via-white/[0.07] to-white/[0.03] backdrop-blur-[0.75px] pointer-events-none lg:hidden" />

        {/* Warm corner washes for subtle depth */}
        <div className="absolute top-0 right-0 w-[560px] h-[560px] bg-gradient-to-bl from-[#E9D5A8]/24 via-[#F2E3BC]/12 to-transparent pointer-events-none lg:hidden" />

        {/* Soft top-light highlight (reduced intensity and blur) */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[760px] h-[460px] bg-white/[0.07] rounded-full blur-[60px] pointer-events-none lg:hidden" />

        <div
          className={`relative z-10 w-full max-w-[400px] transition-all duration-600 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          {/* Frosted glass lift — keeps photo visible, gives form a clean reading surface */}
          <div className="absolute -inset-x-6 -inset-y-7 lg:-inset-x-7 lg:-inset-y-8 rounded-[28px] bg-white/[0.55] backdrop-blur-[10px] border border-white/60 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.30),0_2px_8px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] pointer-events-none -z-[1]" />

          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="relative h-11 w-11 rounded-xl overflow-hidden shadow-md ring-1 ring-[#E5D6B6]">
              <Image
                src="/ofppt-logo.png"
                alt="Logo OFPPT"
                fill
                sizes="100vw"
                loading="eager"
                className="object-cover bg-white"
              />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#1F1A12] tracking-tight">OFPPT</p>
              <p className="text-[11px] text-[#6B5A3F] font-medium">ISTA Tiznit</p>
            </div>
          </div>

          {/* Desktop logo */}
          <div className="hidden lg:block mb-7">
            <div className="relative h-12 w-12 rounded-full overflow-hidden shadow-[0_4px_14px_rgba(15,23,42,0.18),0_0_0_1px_rgba(229,214,182,0.55)] ring-1 ring-white/70">
              <Image
                src="/ofppt-logo.png"
                alt="Logo OFPPT"
                fill
                sizes="100vw"
                loading="eager"
                className="object-cover scale-[1.18]"
              />
            </div>
          </div>

          {!showForgotPassword ? (
            <>
              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#0F172A] leading-tight">
                  Bon retour
                </h1>
                <p className="mt-2 text-[14px] font-medium text-[#475569] leading-relaxed">
                  Connectez-vous à votre espace de gestion
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[13px] font-semibold text-[#334155]">
                    Adresse email
                  </Label>
                  <Input
                    key="login-email"
                    id="email"
                    type="email"
                    placeholder="nom@ofppt.local"
                    {...register('email')}
                    className="h-[46px] rounded-[12px] border border-white/70 bg-white/90 backdrop-blur-sm text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#0F766E]/25 focus-visible:border-[#0F766E]/55 focus-visible:bg-white transition-all duration-200 shadow-[0_1px_3px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7)]"
                    autoFocus
                  />
                  {errors.email && (
                    <p className="text-[12px] text-[#DC2626] font-medium flex items-center gap-1">
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
                      className="text-[12px] font-semibold text-[#0F766E] hover:text-[#115E59] underline-offset-4 hover:underline transition-colors"
                    >
                      Oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      key={`login-password-${showPassword ? 'text' : 'password'}`}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className="h-[46px] rounded-[12px] border border-white/70 bg-white/90 backdrop-blur-sm text-[14px] text-[#0F172A] pr-11 placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#0F766E]/25 focus-visible:border-[#0F766E]/55 focus-visible:bg-white transition-all duration-200 shadow-[0_1px_3px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-[46px] w-11 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[12px] text-[#DC2626] font-medium flex items-center gap-1">
                      <span className="inline-block h-1 w-1 rounded-full bg-[#DC2626]" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[48px] rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white font-semibold text-[14px] transition-all duration-200 mt-2 shadow-[0_4px_12px_rgba(15,118,110,0.18)] hover:shadow-[0_6px_16px_rgba(15,118,110,0.22)] hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-[#0F766E]/25 focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                      <span>Connexion...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Se connecter
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#0F172A] leading-tight">
                  Mot de passe oublié ?
                </h1>
                <p className="mt-2 text-[14px] text-[#475569] leading-relaxed">
                  Saisissez votre adresse email pour recevoir un nouveau mot de passe temporaire.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} noValidate className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-[13px] font-semibold text-[#334155]">
                    Adresse email
                  </Label>
                  <Input
                    key="forgot-email"
                    id="forgot-email"
                    type="email"
                    placeholder="nom@ofppt.local"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-[46px] rounded-[12px] border border-white/70 bg-white/90 backdrop-blur-sm text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#0F766E]/25 focus-visible:border-[#0F766E]/55 focus-visible:bg-white transition-all duration-200 shadow-[0_1px_3px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7)]"
                    autoFocus
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-[48px] rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white font-semibold text-[14px] transition-all duration-200 mt-2 shadow-[0_4px_12px_rgba(15,118,110,0.18)] hover:shadow-[0_6px_16px_rgba(15,118,110,0.22)] hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-[#0F766E]/25 focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {forgotLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                      <span>Envoi en cours...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Envoyer le mot de passe
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail('');
                  }}
                  className="w-full text-center text-[13px] font-semibold text-[#475569] hover:text-[#0F172A] transition-colors mt-2"
                >
                  Retour à la connexion
                </button>
              </form>
            </>
          )}

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[12px] bg-white/85 backdrop-blur-sm border border-white/80 shadow-[0_2px_6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-white transition-colors">
              <Shield className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
              <p className="text-[11px] text-[#1F2937] font-semibold leading-tight">Chiffrement SSL</p>
            </div>
            <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[12px] bg-white/85 backdrop-blur-sm border border-white/80 shadow-[0_2px_6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-white transition-colors">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
              <p className="text-[11px] text-[#1F2937] font-semibold leading-tight">Accès sécurisé</p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] font-medium text-[#475569]">
            OFPPT – ISTA Tiznit © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
