import { createContext, useContext, useEffect, useState } from "react";
import API from "../config/api";

const AuthContext = createContext();

function readErrorMessage(responseText, fallbackMessage) {
  // WHY (Functionality): backend errors may come as plain text or JSON; this
  // keeps auth feedback readable for both formats instead of showing raw JSON.
  try {
    const parsed = JSON.parse(responseText);
    if (parsed && typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    // Keep plain-text fallback handling below.
  }

  const text = responseText?.trim();
  return text || fallbackMessage;
}

async function postJson(path, payload, fallbackErrorMessage) {
  // WHY (Functionality + Code Style): one shared request helper keeps register,
  // login, and reset behavior consistent and easier to maintain for beginners.
  const response = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw Error(readErrorMessage(bodyText, fallbackErrorMessage));
  }

  return bodyText;
}

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
    // WHY (Functionality): normalize input before sending so auth requests are
    // resilient to accidental spaces and casing differences in user entry.
    const token = await postJson(
      "/users/register",
      {
        username: String(credentials.username ?? "").trim(),
        email: String(credentials.email ?? "")
          .trim()
          .toLowerCase(),
        password: String(credentials.password ?? ""),
      },
      "Unable to register right now.",
    );
    setToken(token);
  };

  const login = async (credentials) => {
    // WHY (Functionality): normalize identifier input so login behavior is
    // predictable for username or email regardless of accidental whitespace.
    const token = await postJson(
      "/users/login",
      {
        identifier: String(credentials.identifier ?? "").trim(),
        password: String(credentials.password ?? ""),
      },
      "Unable to sign in right now.",
    );
    setToken(token);
  };

  const resetPassword = async (credentials) => {
    // WHY (Functionality + Code Style): route reset through the same helper so
    // all auth endpoints share the same safe error parsing behavior.
    return postJson(
      "/users/forgot-password",
      {
        email: String(credentials.email ?? "")
          .trim()
          .toLowerCase(),
        password: String(credentials.password ?? ""),
      },
      "Unable to reset password right now.",
    );
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
