import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../shared/routes/ProtectedRoute.tsx';
import { NotAuthorizedPage } from '../shared/pages/NotAuthorizedPage.tsx';
import { NotFoundPage } from '../shared/pages/NotFoundPage.tsx';
import { HomePage } from '../app/pages/HomePage.tsx';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/nao-autorizado" element={<NotAuthorizedPage />} />

          {/* Rotas protegidas — qualquer usuário autenticado */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
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