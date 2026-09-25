import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { Role } from '../types/role.types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: ReactNode;
}

/**
 * Protege uma rota (ou subárvore de rotas) por autenticação e,
 * opcionalmente, por papel.
 *
 * Uso como layout route (recomendado, agrupa várias rotas):
 *
 *   <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
 *     <Route path="/voluntarios" element={<VoluntariosPage />} />
 *   </Route>
 *
 * Uso envolvendo um elemento único:
 *
 *   <Route path="/perfil" element={
 *     <ProtectedRoute><PerfilPage /></ProtectedRoute>
 *   } />
 *
 * Sem `allowedRoles`, qualquer usuário autenticado tem acesso.
 */
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/nao-autorizado" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}