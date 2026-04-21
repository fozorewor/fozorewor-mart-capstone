import { createContext, useContext, useEffect, useState } from "react";
import API from "../config/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) sessionStorage.setItem("token", token);
    else sessionStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    let ignore = false;

    async function loadCurrentUser() {
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const response = await fetch(API + "/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Unauthorized");

        const currentUser = await response.json();
        if (!ignore) setUser(currentUser);
      } catch {
        if (!ignore) {
          setUser(null);
          setToken(null);
        }
      }
    }

    loadCurrentUser();

    return () => {
      ignore = true;
    };
  }, [token]);

  const register = async (credentials) => {
    const response = await fetch(API + "/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await response.text();
    if (!response.ok) throw Error(result);
    setToken(result);
  };

  const login = async (credentials) => {
    const response = await fetch(API + "/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await response.text();
    if (!response.ok) throw Error(result);
    setToken(result);
  };

  const resetPassword = async (credentials) => {
    const response = await fetch(API + "/users/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await response.text();
    if (!response.ok) throw Error(result);
    return result;
  };

  const logout = async () => {
    try {
      await fetch(API + "/users/logout", {
        method: "POST",
      });
    } catch {
      // Logout remains client-driven; ignore network issues.
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const value = { token, user, register, login, logout, resetPassword };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw Error("useAuth must be used within an AuthProvider");
  return context;
}
