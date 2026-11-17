import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { AdoptionIntentPage } from '../features/adoption/pages/AdoptionIntentPage';
import { AnimalDetailPage } from '../features/animals/pages/AnimalDetailPage';
import { AnimalListPage } from '../features/animals/pages/AnimalListPage';
import { PublicHomePage } from '../features/public/pages/PublicHomePage';
import { StaffLayout } from '../features/staff/components/StaffLayout';
import { DashboardPage } from '../features/staff/pages/DashboardPage';
import { AnimalsAdminPage } from '../features/staff/pages/AnimalsAdminPage';
import { AnimalFormPage } from '../features/staff/pages/AnimalFormPage';
import { IntentsAdminPage } from '../features/staff/pages/IntentsAdminPage';
import { MembersAdminPage } from '../features/staff/pages/MembersAdminPage';
import { MemberDetailPage } from '../features/staff/pages/MemberDetailPage';
import { MemberFormPage } from '../features/staff/pages/MemberFormPage';
import { FeedingPointsAdminPage } from '../features/staff/pages/FeedingPointsAdminPage';
import { PublicLayout } from '../shared/layouts/PublicLayout';
import { ProtectedRoute } from '../shared/routes/ProtectedRoute';
import { ADMIN_ROLES, MEMBER_ROLES } from '../shared/types/role.types';
import { NotAuthorizedPage } from '../shared/pages/NotAuthorizedPage';
import { NotFoundPage } from '../shared/pages/NotFoundPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Páginas públicas (visitantes) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicHomePage />} />

            {/* A home explica o projeto; "/sobre" levava a uma página
                própria que foi descontinuada. */}
            <Route path="/sobre" element={<Navigate to="/#projeto" replace />} />

            <Route path="/adocao" element={<AnimalListPage />} />
            <Route path="/adocao/:id" element={<AnimalDetailPage />} />
            <Route path="/adocao/:id/intencao" element={<AdoptionIntentPage />} />

            {/* Páginas de status ficam no layout público para não ser
                um beco sem saída (sempre há cabeçalho e rodapé). */}
            <Route path="/nao-autorizado" element={<NotAuthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Acesso da equipe */}
          <Route path="/login" element={<LoginPage />} />

          {/* Painel da equipe (membros do projeto) */}
          <Route element={<ProtectedRoute allowedRoles={MEMBER_ROLES} />}>
            <Route path="/painel" element={<StaffLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="animais" element={<AnimalsAdminPage />} />
              <Route path="operacao/pontos" element={<FeedingPointsAdminPage />} />
              <Route path="intencoes" element={<IntentsAdminPage />} />

              {/* Somente administração */}
              <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
                <Route path="animais/novo" element={<AnimalFormPage />} />
                <Route path="animais/:id/editar" element={<AnimalFormPage />} />
                <Route path="membros" element={<MembersAdminPage />} />
                <Route path="membros/novo" element={<MemberFormPage />} />
                <Route path="membros/:id" element={<MemberDetailPage />} />
                <Route path="membros/:id/editar" element={<MemberFormPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
