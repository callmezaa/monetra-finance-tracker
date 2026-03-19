import { createContext, useContext } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const login = async (email, password) => {
    const res = await API.post("/login", {
      email,
      password,
    });

    const token = res.data.token;

    localStorage.setItem("token", token);
    return token;
  };

  const logout = () => {
    localStorage.removeItem("token");
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
