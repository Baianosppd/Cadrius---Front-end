import { createContext, useState, useEffect } from "react";
// import api from "../services/api.js"; // Comentado para evitar erros de conexão

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("access_token");

      if (token) {
        // --- BYPASS DE CARREGAMENTO ---
        // Em vez de ir no banco validar o token, fingimos que ele é válido
        setUser({ name: "Usuário Desenvolvedor", email: "dev@cadrius.com" });
        setOrganization("Cadrius AI Dev");

        /* CÓDIGO ORIGINAL (BANCO)
        try {
          const response = await api.get("/auth/user/");
          setUser(response.data);
          setOrganization(response.data.organization);
        } catch {
          localStorage.clear();
          setUser(null);
        }
        */
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  async function login(username, password) {
    // --- BYPASS DE LOGIN ---
    // Simulamos que a API respondeu com sucesso
    console.log("Login simulado com:", { username, password });

    const fakeToken = "token-fake-para-teste";
    localStorage.setItem("access_token", fakeToken);
    localStorage.setItem("refresh_token", "refresh-fake");

    // Dados que você quer que apareçam no Perfil/Dashboard
    const fakeUserData = {
      name: username || "Admin Teste",
      organization: "Cadrius AI Lab"
    };

    setUser(fakeUserData);
    setOrganization(fakeUserData.organization);

    /* CÓDIGO ORIGINAL (BANCO)
    const response = await api.post("/auth/token/", { username, password });
    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);
    const userResponse = await api.get("/auth/user/");
    setUser(userResponse.data);
    */
  }

  function logout() {
    localStorage.clear();
    setUser(null);
    setOrganization(null);
  }

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        organization,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}