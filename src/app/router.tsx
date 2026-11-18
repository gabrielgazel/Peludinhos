import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
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
import { EventsAdminPage } from '../features/staff/pages/EventsAdminPage';
import { FoodAdminPage } from '../features/staff/pages/FoodAdminPage';
import { SuppliesDemoPage } from '../features/staff/pages/SuppliesDemoPage';
import { ReportsPage } from '../features/staff/pages/ReportsPage';
import { ShiftPage } from '../features/staff/pages/ShiftPage';
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

          {/* Acesso da equipe e recuperação de senha: rotas públicas,
              fora do ProtectedRoute (o link do e-mail precisa funcionar
              mesmo sem sessão ativa). */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

          {/* Painel da equipe (membros do projeto) */}
          <Route element={<ProtectedRoute allowedRoles={MEMBER_ROLES} />}>
            <Route path="/painel" element={<StaffLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="animais" element={<AnimalsAdminPage />} />
              <Route path="operacao/pontos" element={<FeedingPointsAdminPage />} />
              <Route path="operacao/turnos" element={<ShiftPage />} />
              <Route path="operacao/ocorrencias" element={<EventsAdminPage />} />
              <Route path="operacao/racao" element={<FoodAdminPage />} />
              {/* Leitura em modo demonstração: sem service, sem requisição. */}
              <Route path="insumos" element={<SuppliesDemoPage />} />
              <Route path="intencoes" element={<IntentsAdminPage />} />
              <Route path="relatorios" element={<ReportsPage />} />

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
