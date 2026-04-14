import express from "express";
import { performance } from "node:perf_hooks";
import {
  createUser,
  getUserByCredentials,
  updateUserPasswordByEmail,
} from "#db/queries/users";
import requireBody from "#middleware/requireBody";
import requireUser from "#middleware/requireUser";
import { recordAuthEvent } from "#metrics";
import { createToken } from "#utils/jwt";

const router = express.Router();
export default router;

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    created_at: user.created_at,
  };
}

router.get("/me", requireUser, (req, res) => {
  res.json(sanitizeUser(req.user));
});

router
  .route("/register")
  .post(requireBody(["username", "email", "password"]), async (req, res, next) => {
    const start = performance.now();
    try {
      const username = String(req.body.username || "").trim().toLowerCase();
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      const user = await createUser(username, email, password);

      const token = await createToken({ id: user.id });
      recordAuthEvent({
        action: "register",
        outcome: "success",
        durationSeconds: (performance.now() - start) / 1000,
      });
      res.status(201).send(token);
    } catch (error) {
      recordAuthEvent({
        action: "register",
        outcome: "failure",
        reason: error?.code === "23505" ? "duplicate_user" : "internal_error",
        durationSeconds: (performance.now() - start) / 1000,
      });
      next(error);
    }
  });

router
  .route("/login")
  .post(requireBody(["identifier", "password"]), async (req, res, next) => {
    const start = performance.now();
    try {
      const identifier = String(req.body.identifier || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      const user = await getUserByCredentials(identifier, password);
      if (!user) {
        recordAuthEvent({
          action: "login",
          outcome: "failure",
          reason: "invalid_credentials",
          durationSeconds: (performance.now() - start) / 1000,
        });
        return res.status(401).send("Invalid username or password.");
      }

      const token = await createToken({ id: user.id });
      recordAuthEvent({
        action: "login",
        outcome: "success",
        durationSeconds: (performance.now() - start) / 1000,
      });
      res.send(token);
    } catch (error) {
      recordAuthEvent({
        action: "login",
        outcome: "failure",
        reason: "internal_error",
        durationSeconds: (performance.now() - start) / 1000,
      });
      next(error);
    }
  });

router.route("/forgot-password").post(requireBody(["email", "password"]), async (req, res, next) => {
    const start = performance.now();
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      const user = await updateUserPasswordByEmail(email, password);
      if (!user) {
        recordAuthEvent({
          action: "forgot_password",
          outcome: "failure",
          reason: "account_not_found",
          durationSeconds: (performance.now() - start) / 1000,
        });
        return res.status(404).send("No account found for that email address.");
      }

      recordAuthEvent({
        action: "forgot_password",
        outcome: "success",
        durationSeconds: (performance.now() - start) / 1000,
      });
      res.send("Password updated successfully.");
    } catch (error) {
      recordAuthEvent({
        action: "forgot_password",
        outcome: "failure",
        reason: "internal_error",
        durationSeconds: (performance.now() - start) / 1000,
      });
      next(error);
    }
  });

router.route("/logout").post((_req, res) => {
  // JWT auth is stateless in this app, so logout is a client-side token clear.
  recordAuthEvent({
    action: "logout",
    outcome: "success",
  });
  res.send("Logged out successfully.");
});
