/**
 * Papéis (roles) definidos no DVP do Peludinhos.
 * As permissões específicas de cada papel ainda serão definidas
 * feature a feature — este tipo existe só pra dar type-safety
 * ao controle de acesso (RBAC) enquanto isso.
 */
export type Role = 'administrador' | 'voluntario' | 'visitante';