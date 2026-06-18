import { createContext, useContext, useState } from "react";

import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    username: localStorage.getItem("username"),
  }));

  async function login(username, password) {
    const data = await api.post("/api/auth/login", { username, password });
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("username", data.username);
    setAuth({ token: data.access_token, role: data.role, username: data.username });
  }

  function logout() {
    localStorage.clear();
    setAuth({ token: null, role: null, username: null });
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
