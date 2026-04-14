import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext";
import AuthCard from "./AuthCard";

/** A form that allows users to log into an existing account. */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pending, setPending] = useState(false);

  const onLogin = async (formData) => {
    const identifier = (formData.get("identifier") ?? "").toString().trim();
    const password = (formData.get("password") ?? "").toString();

    if (!identifier || !password) {
      setSuccess(null);
      setError("Username or email and password are required.");
      return;
    }

    try {
      setPending(true);
      setError(null);
      setSuccess(null);
      await login({ identifier, password });
      setSuccess("Signed in successfully.");
      navigate("/");
    } catch (e) {
      setSuccess(null);
      setError(e.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthCard
      title="Sign in to your account"
      subtitle="Use your username or email and password to continue."
      footer={
        <div className="authFooter">
          <span>New here?</span>
          <Link className="authLink" to="/register">
            Create an account
          </Link>
        </div>
      }
    >
      <form className="authForm" action={onLogin}>
        <label className="authField">
          <span className="authFieldLabel">Username or Email</span>
          <input
            className="authInput authInputTinted"
            type="text"
            name="identifier"
            placeholder="username or you@email.com"
            autoComplete="username"
            required
          />
        </label>

        <label className="authField">
          <span className="authFieldLabel">Password</span>
          <input
            className="authInput authInputTinted"
            type="password"
            name="password"
            placeholder="••••••••••"
            autoComplete="current-password"
            required
          />
        </label>

        <div className="authFormRow">
          <Link className="authLink" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <button className="authPrimaryBtn" disabled={pending}>
          {pending ? "Please wait…" : "Sign In"}
        </button>

        {(error && (
          <output className="authOutput authOutputError" role="status">
            {error}
          </output>
        )) ||
          (success && (
            <output className="authOutput authOutputSuccess" role="status">
              {success}
            </output>
          )) || <output className="authOutput" />}
      </form>
    </AuthCard>
  );
}
