import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

import AuthLayout from "../layouts/authLayout";
import MainLayout from "../layouts/mainLayout";

import Login from "../pages/auth/Login";
import Remember from "../pages/auth/Remember"
import GoogleCallback from "../pages/auth/GoogleCallback";

import Dashboard from "../pages/dashboard/Dashboard";
import Automacao from "../pages/dashboard/Automacao";
import Processos from "../pages/dashboard/Processos";
import Comunicacao from "../pages/dashboard/Comunicacao";
import Integracoes from "../pages/dashboard/Integracoes";
import Perfil from "../pages/dashboard/Perfil";
import Documents from "../pages/dashboard/Documents";
import UnderConstruction from '../pages/dashboard/UnderConstruction';
import GestaoEquipe from "../pages/dashboard/GestaoEquipe";
import Notificacoes from "../pages/dashboard/Notificacoes";
import DocumentDetail from "../pages/dashboard/DocumentDetail";
import NewTask from "../pages/dashboard/NewTask";
import Privacidade from "../pages/seguranca/Privacidade";
import Auditoria from "../pages/seguranca/Auditoria";
import IASegura from "../pages/seguranca/IASegura";
import CentroSeguranca from "../pages/seguranca/CentroSeguranca";

import EditorLayout from '../layouts/EditorLayout';
import FlowEditor from '../pages/dashboard/FlowEditor';

import RegisterLayout from '../layouts/RegisterLayout';
import SelectType from '../pages/auth/SelectType';
import RegisterIndividual from '../pages/auth/RegisterIndividual';

import RegisterEmpresa from '../pages/auth/RegisterEmpresa';


// Protege telas por papel: quem não tem permissão volta ao dashboard (o back também recusa com 403)
function RequireRole({ allow, children }) {
  const auth = useAuth();
  return allow(auth) ? children : <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
  const { signed, loading } = useAuth();

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Navigate to="/criar-conta" replace />} />
          <Route path="/esqueceu-a-senha" element={<Remember />} />
          <Route path="/google/callback" element={<GoogleCallback />} />
        </Route>

        <Route element={<RegisterLayout />}>
          <Route path="/criar-conta" element={<SelectType />} />
          <Route path="/cadastro/individual" element={<RegisterIndividual />} />
          <Route path="/cadastro/empresa" element={<RegisterEmpresa />} />
        </Route>

        {/* Rotas privadas */}
        <Route
          element={signed ? <MainLayout /> : <Navigate to="/" />}
        >
          <Route path="/automacao" element={<Automacao />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />


          <Route path="/processos" element={<Processos />} />
          <Route path="/comunicacao" element={<Comunicacao />} />


          <Route path="/equipe" element={<GestaoEquipe />} />
          <Route path="/integracoes" element={<Integracoes />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/documentdetail" element={<DocumentDetail />} />

          <Route path="/newtask" element={<NewTask />} />

          {/* Privacidade, IA e segurança (CAD-109) */}
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/ia" element={<IASegura />} />
          <Route path="/auditoria" element={<RequireRole allow={(a) => a.isOrgManager}><Auditoria /></RequireRole>} />
          <Route path="/seguranca" element={<RequireRole allow={(a) => a.isStaff}><CentroSeguranca /></RequireRole>} />


          <Route path="/underconstruction" element={<UnderConstruction />} />
        </Route>

        {/* Editor */}
        <Route element={signed ? <EditorLayout /> : <Navigate to="/" />}>
          <Route path="/editor" element={<FlowEditor />} />
        </Route>

        {/* Qualquer outra rota */}
        <Route path="*" element={<Navigate to={signed ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}