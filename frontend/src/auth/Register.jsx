import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext";
import AuthCard from "./AuthCard";

/** A form that allows users to register for a new account */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pending, setPending] = useState(false);

  const onRegister = async (formData) => {
    const username = (formData.get("username") ?? "").toString().trim();
    const email = (formData.get("email") ?? "").toString().trim();
    const password = (formData.get("password") ?? "").toString();
    const confirmPassword = (formData.get("confirmPassword") ?? "").toString();

    if (!username || !email || !password || !confirmPassword) {
      setSuccess(null);
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setSuccess(null);
      setError("Passwords do not match.");
      return;
    }

    try {
      setPending(true);
      setError(null);
      setSuccess(null);
      await register({ username, email, password });
      setSuccess("Account created successfully.");
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
      title="Create your account"
      subtitle="Create an account with a username, email, and password."
      footer={
        <div className="authFooter">
          <span>Already have an account?</span>
          <Link className="authLink" to="/login">
            Sign in
          </Link>
        </div>
      }
    >
      <form className="authForm" action={onRegister}>
        <label className="authField">
          <span className="authFieldLabel">Username</span>
          <input
            className="authInput"
            type="text"
            name="username"
            placeholder="Choose a username"
            autoComplete="username"
            required
          />
        </label>

        <label className="authField">
          <span className="authFieldLabel">Email</span>
          <input
            className="authInput authInputTinted"
            type="email"
            name="email"
            placeholder="you@email.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="authField">
          <span className="authFieldLabel">Password</span>
          <input
            className="authInput authInputTinted"
            type="password"
            name="password"
            placeholder="Create a password"
            autoComplete="new-password"
            required
          />
        </label>

        <label className="authField">
          <span className="authFieldLabel">Confirm Password</span>
          <input
            className="authInput authInputTinted"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            autoComplete="new-password"
            required
          />
        </label>

        <button className="authPrimaryBtn" disabled={pending}>
          {pending ? "Please wait…" : "Create Account"}
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
