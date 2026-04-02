import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

import AuthLayout from "../layouts/authLayout";
import MainLayout from "../layouts/MainLayout";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Remember from "../pages/auth/Remember"

import Dashboard from "../pages/dashboard/Dashboard";
import Automacao from "../pages/dashboard/Automacao";
import Processos from "../pages/dashboard/Processos";
import Comunicacao from "../pages/dashboard/Comunicacao";
import Integracoes from "../pages/dashboard/Integracoes";
import Perfil from "../pages/dashboard/Perfil";
import BoxIA from "../pages/dashboard/BoxIA";

export default function AppRoutes() {
  const { signed, loading } = useAuth();

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/esqueceu-a-senha" element={<Remember />} />
        </Route>

        {/* Rotas privadas */}
        <Route
          element={signed ? <MainLayout /> : <Navigate to="/" />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/caixa-entrada" element={<BoxIA />} />
          <Route path="/automacao" element={<Automacao />} />
          <Route path="/processos" element={<Processos />} />
          <Route path="/comunicacao" element={<Comunicacao />} />
          <Route path="/integracoes" element={<Integracoes />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}