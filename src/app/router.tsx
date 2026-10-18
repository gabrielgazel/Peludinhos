import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { AdoptionIntentPage } from '../features/adoption/pages/AdoptionIntentPage';
import { AnimalDetailPage } from '../features/animals/pages/AnimalDetailPage';
import { AnimalListPage } from '../features/animals/pages/AnimalListPage';
import { PublicHomePage } from '../features/public/pages/PublicHomePage';
import { AboutPeludinhosPage } from '../features/public/pages/AboutPeludinhosPage';
import { StaffLayout } from '../features/staff/components/StaffLayout';
import { DashboardPage } from '../features/staff/pages/DashboardPage';
import { AnimalsAdminPage } from '../features/staff/pages/AnimalsAdminPage';
import { AnimalFormPage } from '../features/staff/pages/AnimalFormPage';
import { IntentsAdminPage } from '../features/staff/pages/IntentsAdminPage';
import { MembersAdminPage } from '../features/staff/pages/MembersAdminPage';
import { MemberFormPage } from '../features/staff/pages/MemberFormPage';
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
            <Route path="/sobre" element={<AboutPeludinhosPage />} />
            <Route path="/adocao" element={<AnimalListPage />} />
            <Route path="/adocao/:id" element={<AnimalDetailPage />} />
            <Route path="/adocao/:id/intencao" element={<AdoptionIntentPage />} />
          </Route>

          {/* Acesso da equipe */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/nao-autorizado" element={<NotAuthorizedPage />} />

          {/* Painel da equipe (membros do projeto) */}
          <Route element={<ProtectedRoute allowedRoles={MEMBER_ROLES} />}>
            <Route path="/painel" element={<StaffLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="animais" element={<AnimalsAdminPage />} />
              <Route path="intencoes" element={<IntentsAdminPage />} />

              {/* Somente administração */}
              <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
                <Route path="animais/novo" element={<AnimalFormPage />} />
                <Route path="animais/:id/editar" element={<AnimalFormPage />} />
                <Route path="membros" element={<MembersAdminPage />} />
                <Route path="membros/novo" element={<MemberFormPage />} />
                <Route path="membros/:id/editar" element={<MemberFormPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
