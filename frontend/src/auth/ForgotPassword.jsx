import { useState } from "react";
import { Link } from "react-router-dom";

import AuthCard from "./AuthCard";
import { useAuth } from "./AuthContext";

const MIN_PASSWORD_LENGTH = 8;

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [message, setMessage] = useState(null);
  const [kind, setKind] = useState(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (formData) => {
    const email = (formData.get("email") ?? "").toString().trim();
    const password = (formData.get("newPassword") ?? "").toString();
    const confirm = (formData.get("confirmPassword") ?? "").toString();

    if (!email) {
      setKind("error");
      setMessage("Enter your registered email.");
      return;
    }
    // WHY (Functionality): keep reset-password validation in sync with backend
    // rules so users see consistent expectations across auth screens.
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      setKind("error");
      setMessage(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setKind("error");
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setPending(true);
      setKind(null);
      setMessage(null);
      const result = await resetPassword({ email, password });
      setKind("success");
      setMessage(result);
    } catch (e) {
      setKind("error");
      setMessage(e.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthCard
      topline="ACCOUNT RECOVERY"
      title="Create a new password"
      subtitle="Enter your registered email and choose a new password for your account."
      showBrandTag={false}
      footer={
        <div className="authFooter">
          <span>Remember your password?</span>
          <Link className="authLink" to="/login">
            Back to sign in
          </Link>
        </div>
      }
    >
      <div className="authCallout">
        Use the same email you used during registration.
      </div>

      <form className="authForm" action={onSubmit}>
        <label className="authField">
          <span className="authFieldLabel">Registered Email</span>
          <input
            className="authInput"
            type="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="authField">
          <span className="authFieldLabel">New Password</span>
          <input
            className="authInput"
            type="password"
            name="newPassword"
            placeholder="Create a new password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        </label>

        <label className="authField">
          <span className="authFieldLabel">Confirm New Password</span>
          <input
            className="authInput"
            type="password"
            name="confirmPassword"
            placeholder="Re-enter new password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        </label>

        <button className="authPrimaryBtn" disabled={pending}>
          {pending ? "Please wait…" : "Save New Password"}
        </button>

        <output
          className={[
            "authOutput",
            kind === "error" ? "authOutputError" : "",
            kind === "success" ? "authOutputSuccess" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role="status"
        >
          {message ?? ""}
        </output>
      </form>
    </AuthCard>
  );
}

