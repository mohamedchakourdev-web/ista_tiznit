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
        src="/background_login.jpeg"
        alt="ISTA Tiznit"
        fill
        preload
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="object-cover object-center select-none pointer-events-none -z-10"
      />

      {/* ═══ LEFT: Branding Panel ═══ */}
      <div className="hidden lg:flex lg:w-[54%] xl:w-[52%] relative overflow-hidden">

        {/* Refined dark teal-navy overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#081826]/82 via-[#0A2434]/72 to-[#0A1424]/78 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06121E]/55 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[#0F766E]/[0.05] mix-blend-overlay pointer-events-none" />

        {/* Ambient teal glow accents */}
        <div className="absolute top-[15%] right-[8%] w-[520px] h-[520px] bg-[#0F766E]/22 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[5%] w-[420px] h-[420px] bg-[#2DD4BF]/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Subtle vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_160px_40px_rgba(0,0,0,0.35)]" />

        {/* Right edge feather — softens the seam between halves */}
        <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-r from-transparent to-[#FAF3E2]/15 pointer-events-none" />
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
            <h2 className="text-[36px] xl:text-[40px] font-bold text-white tracking-[-0.02em] leading-[1.05] mb-4 max-w-[520px]">
              Gestion intelligente
              <br />
              <span className="bg-gradient-to-r from-[#2DD4BF] via-[#5EEAD4] to-[#34D399] bg-clip-text text-transparent">
                des absences
              </span>
            </h2>
            <p className="text-[15px] text-slate-200/90 leading-[1.65] mb-8 max-w-[420px]">
              Une plateforme moderne et centralisée pour automatiser le suivi des absences et simplifier la gestion de l&apos;établissement.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-2.5 mb-8">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300 ${
                  mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
                }`}
                style={{ transitionDelay: mounted ? `${200 + i * 100}ms` : '0ms' }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-b from-[#0F766E]/25 to-[#0F766E]/8 border border-[#0F766E]/25 group-hover:border-[#0F766E]/35 transition-all duration-300">
                  <feature.icon className="h-[17px] w-[17px] text-[#2DD4BF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-white leading-tight">{feature.title}</p>
                  <p className="text-[12.5px] text-slate-300 leading-snug mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: Auth Panel ═══ */}
      <div className="flex flex-1 items-center justify-center px-6 relative overflow-hidden">

        {/* Lighter cream wash — lets the campus photo (real zellige + warm tones) bleed through */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF3E0]/80 via-[#F2E6C6]/72 to-[#E8D5A8]/76 pointer-events-none" />

        {/* Warm corner washes for subtle depth */}
        <div className="absolute top-0 right-0 w-[560px] h-[560px] bg-gradient-to-bl from-[#E9D5A8]/45 via-[#F2E3BC]/22 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-gradient-to-tr from-[#D9C291]/30 via-[#E5D2A8]/15 to-transparent pointer-events-none" />

        {/* Soft top-light highlight */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[760px] h-[460px] bg-white/35 rounded-full blur-[130px] pointer-events-none" />

        {/* Left edge feather — softens the seam */}
        <div className="hidden lg:block absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-l from-transparent to-[#0A1F2E]/8 pointer-events-none" />

        <div
          className={`relative z-10 w-full max-w-[400px] transition-all duration-600 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
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

          {/* Desktop logo — circular badge like the reference */}
          <div className="hidden lg:block mb-7">
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-white shadow-[0_2px_8px_rgba(120,80,30,0.12),0_0_0_1px_rgba(229,214,182,0.6)] ring-1 ring-white/80">
              <Image
                src="/ofppt-logo.png"
                alt="Logo OFPPT"
                fill
                sizes="100vw"
                loading="eager"
                className="object-contain p-1.5 bg-white"
              />
            </div>
          </div>

          {!showForgotPassword ? (
            <>
              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#1F1A12] leading-tight">
                  Bon retour
                </h1>
                <p className="mt-2 text-[14px] text-[#6B5A3F] leading-relaxed">
                  Connectez-vous à votre espace de gestion
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[13px] font-semibold text-[#3F2E14]">
                    Adresse email
                  </Label>
                  <Input
                    key="login-email"
                    id="email"
                    type="email"
                    placeholder="nom@ofppt.local"
                    {...register('email')}
                    className="h-[46px] rounded-[12px] border-[#E5D6B6]/80 bg-white/85 backdrop-blur-sm text-[14px] text-[#1F1A12] placeholder:text-[#B8A77E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 focus-visible:border-[#0F766E]/50 focus-visible:bg-white transition-all duration-200 shadow-[0_1px_3px_rgba(120,80,30,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]"
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
                    <Label htmlFor="password" className="text-[13px] font-semibold text-[#3F2E14]">
                      Mot de passe
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[12px] text-[#0F766E] font-semibold hover:text-[#115E59] transition-colors"
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
                      className="h-[46px] rounded-[12px] border-[#E5D6B6]/80 bg-white/85 backdrop-blur-sm text-[14px] text-[#1F1A12] pr-11 placeholder:text-[#B8A77E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 focus-visible:border-[#0F766E]/50 focus-visible:bg-white transition-all duration-200 shadow-[0_1px_3px_rgba(120,80,30,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-[46px] w-11 flex items-center justify-center text-[#A89978] hover:text-[#3F2E14] transition-colors"
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
                  className="w-full h-[48px] rounded-[12px] bg-gradient-to-b from-[#0F766E] to-[#0D5C56] hover:from-[#115E59] hover:to-[#0A4D48] active:from-[#134E4A] active:to-[#093F3B] text-white font-semibold text-[14px] transition-all duration-200 mt-2 shadow-[0_2px_4px_rgba(15,118,110,0.35),0_8px_24px_rgba(15,118,110,0.22)] hover:shadow-[0_2px_6px_rgba(15,118,110,0.45),0_14px_32px_rgba(15,118,110,0.28)] hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0"
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
                <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#1F1A12] leading-tight">
                  Mot de passe oublié ?
                </h1>
                <p className="mt-2 text-[14px] text-[#6B5A3F] leading-relaxed">
                  Saisissez votre adresse email pour recevoir un nouveau mot de passe temporaire.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} noValidate className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-[13px] font-semibold text-[#3F2E14]">
                    Adresse email
                  </Label>
                  <Input
                    key="forgot-email"
                    id="forgot-email"
                    type="email"
                    placeholder="nom@ofppt.local"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-[46px] rounded-[12px] border-[#E5D6B6]/80 bg-white/85 backdrop-blur-sm text-[14px] text-[#1F1A12] placeholder:text-[#B8A77E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 focus-visible:border-[#0F766E]/50 focus-visible:bg-white transition-all duration-200 shadow-[0_1px_3px_rgba(120,80,30,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]"
                    autoFocus
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-[48px] rounded-[12px] bg-gradient-to-b from-[#0F766E] to-[#0D5C56] hover:from-[#115E59] hover:to-[#0A4D48] active:from-[#134E4A] active:to-[#093F3B] text-white font-semibold text-[14px] transition-all duration-200 mt-2 shadow-[0_2px_4px_rgba(15,118,110,0.35),0_8px_24px_rgba(15,118,110,0.22)] hover:shadow-[0_2px_6px_rgba(15,118,110,0.45),0_14px_32px_rgba(15,118,110,0.28)] hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0"
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
                  className="w-full text-center text-[13px] text-[#6B5A3F] font-semibold hover:text-[#3F2E14] transition-colors mt-2"
                >
                  Retour à la connexion
                </button>
              </form>
            </>
          )}

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[12px] bg-white/70 backdrop-blur-sm border border-[#E5D6B6]/70 shadow-[0_1px_3px_rgba(120,80,30,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] hover:bg-white/85 transition-colors">
              <Shield className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
              <p className="text-[11px] text-[#3F2E14] font-medium leading-tight">Chiffrement SSL</p>
            </div>
            <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[12px] bg-white/70 backdrop-blur-sm border border-[#E5D6B6]/70 shadow-[0_1px_3px_rgba(120,80,30,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] hover:bg-white/85 transition-colors">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
              <p className="text-[11px] text-[#3F2E14] font-medium leading-tight">Accès sécurisé</p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-[#8A7757]">
            OFPPT – ISTA Tiznit © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
