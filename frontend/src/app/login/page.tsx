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
    <div className="flex h-screen overflow-hidden selection:bg-[#0F766E]/20">

      {/* ═══ LEFT: Branding Panel ═══ */}
      <div className="hidden lg:flex lg:w-[54%] xl:w-[52%] relative overflow-hidden" style={{ background: 'linear-gradient(165deg, #0A0F1E 0%, #0C1425 40%, #0A1628 100%)' }}>

        {/* Ambient orbs */}
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-[#0F766E]/[0.10] rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[5%] left-[5%] w-[500px] h-[500px] bg-[#2563EB]/[0.05] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[60%] right-[40%] w-[300px] h-[300px] bg-[#7C3AED]/[0.04] rounded-full blur-[100px] pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #94A3B8 1px, transparent 1px),
              linear-gradient(to bottom, #94A3B8 1px, transparent 1px)
            `,
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 60% 40%, #000 10%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 60% 40%, #000 10%, transparent 100%)',
          }}
        />

        {/* Dot accent */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #2DD4BF 0.7px, transparent 0.7px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 35% 45% at 25% 65%, #000 0%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 35% 45% at 25% 65%, #000 0%, transparent 100%)',
          }}
        />

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

          {/* Social proof */}
          <div
            className={`flex items-center gap-3.5 transition-all duration-700 ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            <div className="flex -space-x-2">
              {[
                { letter: 'A', bg: '#0F766E' },
                { letter: 'S', bg: '#2563EB' },
                { letter: 'M', bg: '#7C3AED' },
                { letter: 'K', bg: '#C026D3' },
              ].map((u, i) => (
                <div
                  key={u.letter}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-[#0A0F1E]"
                  style={{ background: u.bg, zIndex: 4 - i }}
                >
                  {u.letter}
                </div>
              ))}
            </div>
            <p className="text-[12px] text-slate-300">
              Utilisé par <span className="text-white font-medium">50+ formateurs</span> OFPPT
            </p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: Auth Panel ═══ */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 relative overflow-hidden">

        {/* Corner gradients */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#F1F5F9] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-[#F8FAFC] to-transparent pointer-events-none" />

        <div
          className={`relative z-10 w-full max-w-[380px] transition-all duration-600 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="relative h-11 w-11 rounded-xl overflow-hidden shadow-md ring-1 ring-slate-100">
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
              <p className="text-[14px] font-bold text-[#0F172A] tracking-tight">OFPPT</p>
              <p className="text-[11px] text-slate-500 font-medium">ISTA Tiznit</p>
            </div>
          </div>

          {/* Desktop logo */}
          <div className="hidden lg:block mb-7">
            <div className="relative h-11 w-11 rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.07)] ring-1 ring-slate-100">
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

          {!showForgotPassword ? (
            <>
              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#0F172A] leading-tight">
                  Bon retour
                </h1>
                <p className="mt-2 text-[14px] text-[#64748B] leading-relaxed">
                  Connectez-vous à votre espace de gestion
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    className="h-[42px] rounded-[10px] border-[#E2E8F0] bg-[#F8FAFC] text-[14px] placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#0F766E]/15 focus-visible:border-[#0F766E]/40 focus-visible:bg-white transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
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
                      className="h-[42px] rounded-[10px] border-[#E2E8F0] bg-[#F8FAFC] text-[14px] pr-11 placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#0F766E]/15 focus-visible:border-[#0F766E]/40 focus-visible:bg-white transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-[42px] w-11 flex items-center justify-center text-[#94A3B8] hover:text-[#475569] transition-colors"
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
                  className="w-full h-[42px] rounded-[10px] bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white font-semibold text-[14px] transition-all duration-200 mt-1 shadow-[0_1px_3px_rgba(15,118,110,0.4),0_4px_12px_rgba(15,118,110,0.15)] hover:shadow-[0_1px_3px_rgba(15,118,110,0.5),0_6px_20px_rgba(15,118,110,0.2)] disabled:opacity-50"
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
                <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#0F172A] leading-tight">
                  Mot de passe oublié ?
                </h1>
                <p className="mt-2 text-[14px] text-[#64748B] leading-relaxed">
                  Saisissez votre adresse email pour recevoir un nouveau mot de passe temporaire.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
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
                    className="h-[42px] rounded-[10px] border-[#E2E8F0] bg-[#F8FAFC] text-[14px] placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#0F766E]/15 focus-visible:border-[#0F766E]/40 focus-visible:bg-white transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    autoFocus
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-[42px] rounded-[10px] bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white font-semibold text-[14px] transition-all duration-200 mt-1 shadow-[0_1px_3px_rgba(15,118,110,0.4),0_4px_12px_rgba(15,118,110,0.15)] hover:shadow-[0_1px_3px_rgba(15,118,110,0.5),0_6px_20px_rgba(15,118,110,0.2)] disabled:opacity-50"
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
                  className="w-full text-center text-[13px] text-[#64748B] font-semibold hover:text-[#475569] transition-colors mt-2"
                >
                  Retour à la connexion
                </button>
              </form>
            </>
          )}

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0]/70">
              <Shield className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
              <p className="text-[11px] text-[#475569] font-medium leading-tight">Chiffrement SSL</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0]/70">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
              <p className="text-[11px] text-[#475569] font-medium leading-tight">Accès sécurisé</p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-[#94A3B8]">
            OFPPT – ISTA Tiznit © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
