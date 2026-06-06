export type UserRole = 'directeur' | 'gestionnaire' | 'formateur';
export type FormateurType = 'vacataire' | 'permanent';
export type Sexe = 'homme' | 'femme';
export type AbsenceType = 'absence' | 'retard';
export type Periode = 'matin' | 'apres_midi';
export type AutorisationStatut = 'en_attente' | 'validee' | 'refusee';
export type NotificationType = 'autorisation' | 'absence' | 'system' | string;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  links?: PaginationLinks;
  errors?: Record<string, string[]>;
}

export interface ApiCollectionResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta?: PaginationMeta;
  links?: PaginationLinks;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
  [key: string]: unknown;
}

export interface PaginationLinks {
  first?: string | null;
  last?: string | null;
  prev?: string | null;
  next?: string | null;
  [key: string]: unknown;
}

export interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  avatar: string | null;
  type: FormateurType | null;
  is_active: boolean;
  last_login_at: string | null;
  roles?: UserRole[];
  permissions?: string[];
  groupes?: Groupe[];
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export interface Filiere {
  id: number;
  nom: string;
  code: string;
  description: string | null;
  groupes_count?: number;
  groupes?: Groupe[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DiplomeType {
  id: number;
  nom: string;
  code: string;
  description: string | null;
}

export interface Groupe {
  id: number;
  filiere_id: number;
  nom: string;
  code: string;
  annee_formation: string;
  niveau: string;
  capacite: number | null;
  filiere?: Filiere;
  formateurs?: User[];
  stagiaires_count?: number;
  absences_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Stagiaire {
  id: number;
  groupe_id: number;
  diplome_type_id: number;
  cef: string;
  nom: string;
  prenom: string;
  cin: string;
  email: string | null;
  telephone: string | null;
  date_naissance: string | null;
  adresse: string | null;
  ville: string | null;
  photo: string | null;
  sexe: Sexe;
  groupe?: Groupe;
  diplome_type?: DiplomeType;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Absence {
  id: number;
  stagiaire_id: number;
  groupe_id: number;
  autorisation_id?: number | null;
  date_absence: string;
  periode: Periode;
  type: AbsenceType;
  minutes_retard: number | null;
  remarque: string | null;
  stagiaire?: Stagiaire;
  groupe?: Groupe;
  autorisation?: Autorisation | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Autorisation {
  id: number;
  absence_id: number | null;
  stagiaire_id: number | null;
  target_user_id: number;
  code: string;
  motif: string | null;
  statut: AutorisationStatut;
  date_validation: string | null;
  is_read: boolean;
  read_at: string | null;
  read_by?: number | null;
  absence?: Absence;
  absences?: Absence[];
  stagiaire?: Stagiaire;
  target_user?: User;
  validated_by_user?: User;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Notification {
  id: number;
  absence_id: number | null;
  autorisation_id: number | null;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  read_at: string | null;
  absence?: Absence | null;
  autorisation?: Autorisation | null;
  created_at: string | null;
}

export interface DirectorOverview {
  statistics: {
    users_count: number;
    active_users_count: number;
    filieres_count: number;
    groupes_count: number;
    stagiaires_count: number;
    absences_count: number;
    autorisations_en_attente_count: number;
  };
  latest_absences: Absence[];
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface StoreUserPayload {
  nom: string;
  prenom?: string | null;
  email: string;
  password: string;
  role: UserRole;
  type?: FormateurType | null;
  telephone?: string | null;
}

export interface UpdateUserPayload {
  nom?: string;
  prenom?: string | null;
  email?: string;
  password?: string;
  role?: UserRole;
  type?: FormateurType | null;
}

export interface UpdateProfilePayload {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
}

export interface UpdatePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface StoreFilierePayload {
  nom: string;
  code: string;
  description?: string | null;
}

export type UpdateFilierePayload = Partial<StoreFilierePayload>;

export interface StoreGroupePayload {
  filiere_id: number;
  nom: string;
  code: string;
  annee_formation: string;
  niveau: string;
  capacite?: number | null;
  formateur_ids?: number[];
}

export type UpdateGroupePayload = Partial<StoreGroupePayload>;

export interface StoreStagiairePayload {
  groupe_id: number;
  diplome_type_id: number;
  cef: string;
  nom: string;
  prenom: string;
  cin: string;
  email?: string | null;
  telephone?: string | null;
  date_naissance?: string | null;
  adresse?: string | null;
  ville?: string | null;
  photo?: string | null;
  sexe: Sexe;
}

export type UpdateStagiairePayload = Partial<StoreStagiairePayload>;

export interface StoreAbsencePayload {
  stagiaire_id: number;
  groupe_id: number;
  date_absence: string;
  periode: Periode;
  type: AbsenceType;
  minutes_retard?: number | null;
  remarque?: string | null;
}

export interface StoreAutorisationPayload {
  absence_id?: number | null;
  absence_ids?: number[] | null;
  stagiaire_id?: number | null;
  target_user_id: number;
  statut?: Extract<AutorisationStatut, 'validee' | 'refusee'>;
  motif?: string | null;
}

export interface UpdateAutorisationStatusPayload {
  statut: Extract<AutorisationStatut, 'validee' | 'refusee'>;
}
