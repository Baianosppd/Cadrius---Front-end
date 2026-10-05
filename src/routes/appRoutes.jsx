import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

import AuthLayout from "../layouts/authLayout";
import MainLayout from "../layouts/mainLayout";

import Login from "../pages/auth/Login";
import Remember from "../pages/auth/Remember"
import ResetPassword from "../pages/auth/ResetPassword";
import GoogleCallback from "../pages/auth/GoogleCallback";

import Dashboard from "../pages/dashboard/Dashboard";
import Automacao from "../pages/dashboard/Automacao";
import Processos from "../pages/dashboard/Processos";
import Comunicacao from "../pages/dashboard/Comunicacao";
import Integracoes from "../pages/dashboard/Integracoes";
import Perfil from "../pages/dashboard/Perfil";
import UnderConstruction from '../pages/dashboard/UnderConstruction';
import GestaoEquipe from "../pages/dashboard/GestaoEquipe";
import Notificacoes from "../pages/dashboard/Notificacoes";
import NewTask from "../pages/dashboard/NewTask";

import EditorLayout from '../layouts/EditorLayout';
import AdminLayout from '../layouts/AdminLayout';

import RegisterLayout from '../layouts/RegisterLayout';
import SelectType from '../pages/auth/SelectType';
import RegisterIndividual from '../pages/auth/RegisterIndividual';

import RegisterEmpresa from '../pages/auth/RegisterEmpresa';


// Carregamento sob demanda: o editor de fluxos (React Flow) e o visualizador de PDF são pesados
// Redireciona mantendo ?aba=… (ex.: notificação "aguardando aprovação")
function RedirectKeepQuery({ to }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

const FlowEditor = lazy(() => import('../pages/dashboard/FlowEditor'));
const Documents = lazy(() => import('../pages/dashboard/Documents'));
const DocumentDetail = lazy(() => import('../pages/dashboard/DocumentDetail'));
const CentralAprovacoes = lazy(() => import('../pages/dashboard/CentralAprovacoes'));
const Financeiro = lazy(() => import('../pages/dashboard/Financeiro'));
const Privacidade = lazy(() => import('../pages/seguranca/Privacidade'));
const Auditoria = lazy(() => import('../pages/seguranca/Auditoria'));
const IASegura = lazy(() => import('../pages/seguranca/IASegura'));
const CentroSeguranca = lazy(() => import('../pages/seguranca/CentroSeguranca'));
// Gestão Cadrius (TI e Financeiro) — CAD-168
const GestaoVisao = lazy(() => import('../pages/gestao/Visao'));
const GestaoEscritorios = lazy(() => import('../pages/gestao/Escritorios'));
const GestaoUsuarios = lazy(() => import('../pages/gestao/Usuarios'));
const GestaoSistema = lazy(() => import('../pages/gestao/Sistema'));
const GestaoEquipeCadrius = lazy(() => import('../pages/gestao/Equipe'));
const GestaoFiscal = lazy(() => import('../pages/gestao/Fiscal'));
const GestaoSuporte = lazy(() => import('../pages/gestao/Suporte'));
// Fase B (CAD-171): contatos, importação e suporte
const Contatos = lazy(() => import('../pages/escritorio/Contatos'));
const Importar = lazy(() => import('../pages/escritorio/Importar'));
const Suporte = lazy(() => import('../pages/escritorio/Suporte'));
// Fase C (CAD-172): agenda forense e processos acompanhados
const AgendaForense = lazy(() => import('../pages/escritorio/AgendaForense'));
const Acompanhamento = lazy(() => import('../pages/escritorio/Acompanhamento'));
// Fase D (CAD-173): publicações do DJEN e minutas
const Publicacoes = lazy(() => import('../pages/escritorio/Publicacoes'));
const Minutas = lazy(() => import('../pages/escritorio/Minutas'));
// CAD-174: marketing (escritório e Cadrius)
const Marketing = lazy(() => import('../pages/escritorio/Marketing'));
const GestaoMarketing = lazy(() => import('../pages/gestao/Marketing'));

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
      <Suspense fallback={<div style={{ padding: 32, textAlign: "center" }}>Carregando…</div>}>
      <Routes>
        {/* Rotas públicas */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Navigate to="/criar-conta" replace />} />
          <Route path="/esqueceu-a-senha" element={<Remember />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
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
          {/* links das notificações do back usam /automacoes */}
          <Route path="/automacoes" element={<RedirectKeepQuery to="/automacao" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />


          <Route path="/processos" element={<Processos />} />
          <Route path="/comunicacao" element={<Comunicacao />} />


          <Route path="/equipe" element={<GestaoEquipe />} />
          <Route path="/integracoes" element={<Integracoes />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/documentdetail" element={<Navigate to="/documents" replace />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />

          <Route path="/newtask" element={<NewTask />} />

          {/* Privacidade, IA e segurança (CAD-109) */}
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/ia" element={<IASegura />} />
          <Route path="/aprovacoes" element={<CentralAprovacoes />} />
          <Route path="/contatos" element={<Contatos />} />
          <Route path="/importar" element={<Importar />} />
          <Route path="/suporte" element={<Suporte />} />
          <Route path="/agenda-forense" element={<AgendaForense />} />
          <Route path="/acompanhamento" element={<Acompanhamento />} />
          <Route path="/publicacoes" element={<Publicacoes />} />
          <Route path="/minutas" element={<Minutas />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/auditoria" element={<RequireRole allow={(a) => a.isOrgManager}><Auditoria /></RequireRole>} />
          {/* Telas da equipe migraram para a Gestão Cadrius (CAD-168); links antigos continuam funcionando */}
          <Route path="/seguranca" element={<Navigate to="/gestao/seguranca" replace />} />
          <Route path="/financeiro" element={<Navigate to="/gestao/financeiro" replace />} />


          <Route path="/underconstruction" element={<UnderConstruction />} />
        </Route>

        {/* Gestão Cadrius: área interna da equipe (TI e Financeiro). O back confere a área de cada chamada (403). */}
        <Route element={signed ? <RequireRole allow={(a) => a.isStaff}><AdminLayout /></RequireRole> : <Navigate to="/" />}>
          <Route path="/gestao" element={<GestaoVisao />} />
          <Route path="/gestao/escritorios" element={<GestaoEscritorios />} />
          <Route path="/gestao/usuarios" element={<GestaoUsuarios />} />
          <Route path="/gestao/sistema" element={<GestaoSistema />} />
          <Route path="/gestao/marketing" element={<GestaoMarketing />} />
          <Route path="/gestao/equipe" element={<GestaoEquipeCadrius />} />
          <Route path="/gestao/fiscal" element={<GestaoFiscal />} />
          <Route path="/gestao/suporte" element={<GestaoSuporte />} />
          <Route path="/gestao/financeiro" element={<Financeiro />} />
          <Route path="/gestao/seguranca" element={<CentroSeguranca />} />
        </Route>

        {/* Editor */}
        <Route element={signed ? <EditorLayout /> : <Navigate to="/" />}>
          <Route path="/editor" element={<FlowEditor />} />
        </Route>

        {/* Qualquer outra rota */}
        <Route path="*" element={<Navigate to={signed ? "/dashboard" : "/"} replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}