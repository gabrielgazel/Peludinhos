/**
 * Papéis (roles) definidos no DVP do Peludinhos.
 *
 * `administrador` e `coordenador` formam a administração; `bolsista` e
 * `voluntario` são o tier de membros; `visitante` é quem manifesta
 * intenção de adoção. Anônimo = sem sessão.
 */
export type StaffRole = 'administrador' | 'coordenador' | 'bolsista' | 'voluntario';

export type Role = StaffRole | 'visitante';

/** Papéis com acesso à área da equipe (membros do projeto). */
export const MEMBER_ROLES: StaffRole[] = [
  'administrador',
  'coordenador',
  'bolsista',
  'voluntario',
];

/** Papéis com permissão de administração (F1.1/F1.2/F1.16/F1.17). */
export const ADMIN_ROLES: StaffRole[] = ['administrador', 'coordenador'];

export const ROLE_LABEL: Record<Role, string> = {
  administrador: 'Administrador',
  coordenador: 'Coordenador',
  bolsista: 'Bolsista',
  voluntario: 'Voluntário',
  visitante: 'Visitante',
};

export function roleLabel(role: Role | null | undefined): string {
  return role ? ROLE_LABEL[role] : '—';
}

/** Membros do projeto (exclui visitante/anônimo). */
export function isStaff(role: Role | null | undefined): role is StaffRole {
  return MEMBER_ROLES.includes(role as StaffRole);
}

/** Administração: administrador ou coordenador. */
export function isAdmin(role: Role | null | undefined): boolean {
  return ADMIN_ROLES.includes(role as StaffRole);
}
