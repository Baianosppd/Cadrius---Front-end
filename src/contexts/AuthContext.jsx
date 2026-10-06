import { createContext, useState, useEffect, useCallback } from "react";
import api, { PASSWORD_CHANGE_EVENT, SESSION_EXPIRED_EVENT } from "../services/api";
import { setMonitoringUser } from "../services/monitoring";
import { mfaApi } from "../services/mfa";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((data) => {
    setUser(data);
    setOrganization(data?.organization ?? null);
    setMonitoringUser(data);
  }, []);

  const reset = useCallback(() => {
    clearTokens();
    setUser(null);
    setOrganization(null);
    setMonitoringUser(null);
  }, []);

  // Recarrega os dados do usuário (após login, cadastro, login social ou aceite de termos)
  const refreshUser = useCallback(async () => {
    const response = await api.get("/auth/user/");
    applyUser(response.data);
    return response.data;
  }, [applyUser]);

  useEffect(() => {
    async function loadUser() {
      if (localStorage.getItem("access_token")) {
        try {
          await refreshUser();
        } catch (err) {
          console.error("Erro ao carregar usuário:", err.response?.data);
          reset();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [refreshUser, reset]);

  // Sessão expirada em qualquer chamada: volta ao login sem recarregar a página
  useEffect(() => {
    const onExpired = () => reset();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [reset]);

  // A API recusou por senha temporária (CAD-221): recarrega o perfil; as rotas levam à troca obrigatória
  useEffect(() => {
    const onMustChange = () => { refreshUser().catch(() => {}); };
    window.addEventListener(PASSWORD_CHANGE_EVENT, onMustChange);
    return () => window.removeEventListener(PASSWORD_CHANGE_EVENT, onMustChange);
  }, [refreshUser]);

  // Com verificação em duas etapas ativa o back devolve um desafio em vez dos tokens (CAD-169)
  async function login(username, password) {
    const response = await api.post("/auth/token/", { username, password });
    if (response.data.mfa_required) return { mfaToken: response.data.mfa_token };
    await loginWithTokens(response.data.access, response.data.refresh);
    return { mfaToken: null };
  }

  async function verifyMfa(mfaToken, code) {
    const data = await mfaApi.verify(mfaToken, code);
    await loginWithTokens(data.access, data.refresh);
    return data;
  }

  // Usado também pelo cadastro (o back já devolve access/refresh) e pelo login social
  async function loginWithTokens(access, refresh) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    await refreshUser();
  }

  async function logout() {
    const refresh = localStorage.getItem("refresh_token");
    try {
      // Revoga o refresh token no servidor (blacklist) — apagar só o localStorage não encerraria a sessão
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch (err) {
      console.warn("Logout no servidor falhou:", err.response?.status);
    }
    reset();
  }

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        organization,
        role,
        isOrgManager: role === "OWNER" || role === "ADMIN",
        // Advogado autônomo (CAD-222): conta pessoa física sozinha — telas sem linguagem de equipe
        isSolo: !!organization?.solo,
        isStaff: !!user?.is_staff,
        login,
        verifyMfa,
        loginWithTokens,
        refreshUser,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
