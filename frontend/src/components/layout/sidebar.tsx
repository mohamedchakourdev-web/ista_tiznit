'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, FolderOpen,
  AlertTriangle, FileCheck, UserX,
  ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getPrimaryRole } from '@/utils/domain';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  section?: string;
}

const navConfig: Record<string, NavItem[]> = {
  directeur: [
    { label: 'Tableau de bord', href: '/directeur', icon: LayoutDashboard, section: 'Général' },
    { label: 'Utilisateurs', href: '/directeur/users', icon: Users, section: 'Supervision' },
    { label: 'Utilisateurs supprimés', href: '/directeur/users/deleted', icon: UserX, section: 'Supervision' },
    { label: 'Filières', href: '/gestionnaire/filieres', icon: FolderOpen, section: 'Gestion' },
    { label: 'Groupes', href: '/gestionnaire/groupes', icon: BookOpen, section: 'Gestion' },
    { label: 'Stagiaires', href: '/gestionnaire/stagiaires', icon: GraduationCap, section: 'Gestion' },
    { label: 'Absences', href: '/gestionnaire/absences', icon: AlertTriangle, section: 'Suivi' },
    { label: 'Autorisations', href: '/gestionnaire/autorisations', icon: FileCheck, section: 'Suivi' },
  ],
  gestionnaire: [
    { label: 'Tableau de bord', href: '/gestionnaire', icon: LayoutDashboard, section: 'Général' },
    { label: 'Filières', href: '/gestionnaire/filieres', icon: FolderOpen, section: 'Gestion' },
    { label: 'Groupes', href: '/gestionnaire/groupes', icon: BookOpen, section: 'Gestion' },
    { label: 'Stagiaires', href: '/gestionnaire/stagiaires', icon: GraduationCap, section: 'Gestion' },
    { label: 'Absences', href: '/gestionnaire/absences', icon: AlertTriangle, section: 'Suivi' },
    { label: 'Autorisations', href: '/gestionnaire/autorisations', icon: FileCheck, section: 'Suivi' },
  ],
  formateur: [
    { label: 'Tableau de bord', href: '/formateur', icon: LayoutDashboard, section: 'Général' },
    { label: 'Mes Groupes', href: '/formateur/groupes', icon: BookOpen, section: 'Mon espace' },
    { label: 'Autorisations', href: '/formateur/autorisations', icon: FileCheck, section: 'Mon espace' },
  ],
};

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const role = getPrimaryRole(user) || 'gestionnaire';
  const items = navConfig[role] || navConfig.gestionnaire;

  const sections = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    const section = item.section || 'Général';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const NavLink = ({ item }: { item: NavItem }) => {
    // Use exact pathname matching to avoid parent routes matching their children.
    const isActive = pathname === item.href;

    const link = (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'group relative flex items-center transition-all duration-200 ease-out',
          collapsed
            ? 'h-10 w-10 mx-auto justify-center rounded-[10px]'
            : 'h-[38px] px-3 gap-2.5 rounded-[10px]',
          isActive
            ? 'bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
            : 'hover:bg-white/[0.04]',
        )}
      >
        {/* Active indicator */}
        {isActive && !collapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] rounded-r-full bg-[#2DD4BF] shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
        )}
        {isActive && collapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-[14px] rounded-r-full bg-[#2DD4BF] shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
        )}
        <item.icon className={cn(
          'shrink-0 transition-all duration-200',
          collapsed ? 'h-[18px] w-[18px]' : 'h-[16px] w-[16px]',
          isActive
            ? 'text-[#2DD4BF] drop-shadow-[0_0_4px_rgba(45,212,191,0.3)]'
            : 'text-slate-500 group-hover:text-slate-300'
        )} />
        {!collapsed && (
          <span className={cn(
            'text-[13.5px] font-medium truncate transition-colors duration-200',
            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
          )}>{item.label}</span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger className="appearance-none bg-transparent border-none p-0 m-0 cursor-pointer">
            {link}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="text-[12px] font-medium bg-[#1E293B] text-white border-white/10 shadow-2xl px-3 py-1.5">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  return (
    <div className="flex h-full flex-col">
      {/* ══ Logo Area ══ */}
      <div className={cn(
        'relative flex items-center shrink-0 overflow-hidden',
        collapsed ? 'h-[64px] justify-center' : 'h-[64px] gap-3 px-4'
      )}>
        {/* Subtle glow behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] bg-[#0F766E]/[0.08] rounded-full blur-[40px] pointer-events-none" />

        <div className={cn(
          'relative shrink-0 rounded-[12px] overflow-hidden transition-all duration-300',
          collapsed
            ? 'h-10 w-10 shadow-[0_2px_8px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)]'
            : 'h-11 w-11 shadow-[0_2px_12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)]'
        )}>
          <Image
            src="/ofppt-logo.png"
            alt="Logo OFPPT"
            fill
            sizes="100vw"
            loading="eager"
            className="object-cover bg-white"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden relative z-10">
            <span className="text-[14px] font-bold text-white tracking-tight leading-none truncate">
              OFPPT
            </span>
            <span className="text-[11px] text-slate-400 leading-none mt-[4px] font-medium truncate">
              ISTA Tiznit
            </span>
          </div>
        )}
      </div>

      {/* Gradient divider */}
      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* ══ Navigation ══ */}
      <nav className={cn(
        'flex-1 overflow-y-auto',
        collapsed ? 'px-2 py-4' : 'px-3 py-4'
      )}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.05) transparent',
        }}
      >
        {collapsed ? (
          <div className="flex flex-col items-center space-y-1">
            {items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        ) : (
          Object.entries(sections).map(([section, sectionItems], idx) => (
            <div key={section} className={cn(idx > 0 ? 'mt-6' : '')}>
              {section !== 'Général' && (
                <div className="flex items-center gap-2.5 px-3 mb-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {section}
                  </p>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
                </div>
              )}
              <div className="space-y-[2px]">
                {sectionItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative hidden lg:flex flex-col h-full bg-[#0F172A] transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
        collapsed ? 'w-[68px]' : 'w-[244px]'
      )}
      style={{
        boxShadow: '1px 0 0 0 rgba(255,255,255,0.03), 4px 0 24px -4px rgba(0,0,0,0.2)',
      }}
    >
      <SidebarContent collapsed={collapsed} />
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[68px] z-40 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-700 transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.06)]"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
        <Menu className="h-[17px] w-[17px]" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[264px] p-0 bg-[#0F172A] border-r-0 [&>button]:hidden" style={{ boxShadow: '4px 0 32px -4px rgba(0,0,0,0.4)' }}>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="absolute right-3 top-4 z-50">
          <button onClick={() => setOpen(false)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all duration-200">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <SidebarContent collapsed={false} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
