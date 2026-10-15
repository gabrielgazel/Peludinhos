import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { AdoptionIntentPage } from '../features/adoption/pages/AdoptionIntentPage';
import { AnimalDetailPage } from '../features/animals/pages/AnimalDetailPage';
import { AnimalListPage } from '../features/animals/pages/AnimalListPage';
import { PublicHomePage } from '../features/public/pages/PublicHomePage';
import { PublicLayout } from '../shared/layouts/PublicLayout';
import { ProtectedRoute } from '../shared/routes/ProtectedRoute.tsx';
import { NotAuthorizedPage } from '../shared/pages/NotAuthorizedPage.tsx';
import { NotFoundPage } from '../shared/pages/NotFoundPage.tsx';
import { HomePage } from '../app/pages/HomePage.tsx';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas — visitantes, sem login */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicHomePage />} />
            <Route path="/adocao" element={<AnimalListPage />} />
            <Route path="/adocao/:id" element={<AnimalDetailPage />} />
            <Route path="/adocao/:id/intencao" element={<AdoptionIntentPage />} />
          </Route>

          {/* Acesso da equipe */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/nao-autorizado" element={<NotAuthorizedPage />} />

          {/* Rotas protegidas — qualquer usuário autenticado */}
          <Route element={<ProtectedRoute />}>
            <Route path="/painel" element={<HomePage />} />
          </Route>

          {/*
            Exemplo de como restringir por papel assim que as
            permissões de cada feature forem definidas:

            <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
              <Route path="/voluntarios" element={<VoluntariosPage />} />
            </Route>
          */}

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}