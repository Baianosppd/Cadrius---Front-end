import { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("access_token");

      if (token) {
        try {
          const response = await api.get("/auth/user/");
          setUser(response.data);
          setOrganization(response.data.organization);
        } catch {
          localStorage.clear();
          setUser(null);
          setOrganization(null);
        }
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  async function login(username, password) {
    const response = await api.post("/auth/token/", { username, password });

    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);

    const userResponse = await api.get("/auth/user/");
    setUser(userResponse.data);
    setOrganization(userResponse.data.organization);
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
