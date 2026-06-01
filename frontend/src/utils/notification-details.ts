import type { Absence, Autorisation, User } from '@/types';
import { getUserFullName } from '@/utils/domain';

export function getAutorisationStagiaire(autorisation?: Autorisation | null) {
  return autorisation?.stagiaire ?? autorisation?.absence?.stagiaire ?? null;
}

export function getAutorisationCef(autorisation?: Autorisation | null): string {
  return getAutorisationStagiaire(autorisation)?.cef ?? '-';
}

export function getAutorisationGroupe(autorisation?: Autorisation | null): string {
  return (
    autorisation?.stagiaire?.groupe?.nom ??
    autorisation?.absence?.groupe?.nom ??
    autorisation?.absence?.stagiaire?.groupe?.nom ??
    '-'
  );
}

export function getAutorisationFormateur(autorisation?: Autorisation | null, currentUser?: User | null): string {
  const targetName = getUserFullName(autorisation?.target_user);
  if (targetName) return targetName;

  if (currentUser?.id === autorisation?.target_user_id) {
    return getUserFullName(currentUser) || currentUser?.email || '-';
  }

  return autorisation?.target_user_id ? `Formateur #${autorisation.target_user_id}` : '-';
}

export function getAbsenceStagiaire(absence?: Absence | null) {
  return absence?.stagiaire ?? null;
}

export function getAbsenceCef(absence?: Absence | null): string {
  return absence?.stagiaire?.cef ?? '-';
}

export function getAbsenceGroupe(absence?: Absence | null): string {
  return absence?.groupe?.nom ?? absence?.stagiaire?.groupe?.nom ?? '-';
}

export function getAbsenceMotif(absence?: Absence | null): string {
  return absence?.remarque?.trim() || 'Aucun motif renseigne.';
}
