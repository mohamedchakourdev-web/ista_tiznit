import type { Absence, AutorisationStatut, Periode, User, UserRole } from '@/types';

export function getPrimaryRole(user?: User | null): UserRole | null {
  const roles = user?.roles ?? [];
  if (roles.includes('directeur')) return 'directeur';
  if (roles.includes('gestionnaire')) return 'gestionnaire';
  if (roles.includes('formateur')) return 'formateur';
  return null;
}

export function getUserFullName(user?: Pick<User, 'nom' | 'prenom'> | null): string {
  if (!user) return '';
  return [user.prenom, user.nom].filter(Boolean).join(' ').trim();
}

export function getInitials(user?: Pick<User, 'nom' | 'prenom'> | null): string {
  const prenom = user?.prenom?.charAt(0) ?? '';
  const nom = user?.nom?.charAt(0) ?? '';
  return `${prenom}${nom}`.trim().toUpperCase() || 'U';
}

export function getRoleLabel(role?: UserRole | null): string {
  const labels: Record<UserRole, string> = {
    directeur: 'Directeur',
    gestionnaire: 'Gestionnaire',
    formateur: 'Formateur',
  };

  return role ? labels[role] : '';
}

export function getDashboardPath(role?: UserRole | null): string {
  const paths: Record<UserRole, string> = {
    directeur: '/directeur',
    gestionnaire: '/gestionnaire',
    formateur: '/formateur',
  };

  return role ? paths[role] : '/login';
}

export function getPeriodeLabel(periode?: Periode | null): string {
  if (periode === 'matin') return 'Matin';
  if (periode === 'apres_midi') return 'Apres-midi';
  return '-';
}

export function getAutorisationStatutLabel(statut?: AutorisationStatut | null): string {
  if (statut === 'en_attente') return 'En attente';
  if (statut === 'validee') return 'Validee';
  if (statut === 'refusee') return 'Refusee';
  return '-';
}

export function getStagiaireFullName(stagiaire?: { nom?: string; prenom?: string } | null): string {
  if (!stagiaire) return '-';
  return [stagiaire.prenom, stagiaire.nom].filter(Boolean).join(' ').trim() || '-';
}

export function describeAbsence(absence?: Absence | null): string {
  if (!absence) return '-';
  return `${getStagiaireFullName(absence.stagiaire)} - ${absence.date_absence} - ${getPeriodeLabel(absence.periode)}`;
}

export function compactDate(date?: string | null): string {
  if (!date) return '-';

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export function compactDateTime(date?: string | null): string {
  if (!date) return '-';

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return date;
  }
}
