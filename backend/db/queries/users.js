import bcrypt from "bcrypt";
import db from "#db/client";

export async function createUser(username, email, password) {
  // WHY (Functionality + Code Style): return only fields the app needs so
  // password hashes cannot be accidentally sent in API responses later.
  const sql = `
  INSERT INTO users
    (username, email, password)
  VALUES
    ($1, $2, $3)
  RETURNING id, username, email, created_at
  `;
  const hashedPassword = await bcrypt.hash(password, 10);
  const {
    rows: [user],
  } = await db.query(sql, [username, email, hashedPassword]);
  return user;
}

export async function getUserByCredentials(identifier, password) {
  // WHY (Functionality): include password only for credential verification,
  // then strip it before returning to keep auth data handling safer.
  const sql = `
  SELECT id, username, email, password, created_at
  FROM users
  WHERE lower(username) = lower($1)
     OR lower(email) = lower($1)
  `;
  const {
    rows: [user],
  } = await db.query(sql, [identifier]);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    created_at: user.created_at,
  };
}

export async function getUserById(id) {
  // WHY (Functionality + Code Style): auth middleware only needs public user
  // identity fields, so avoid selecting password hashes from the database.
  const sql = `
  SELECT id, username, email, created_at
  FROM users
  WHERE id = $1
  `;
  const {
    rows: [user],
  } = await db.query(sql, [id]);
  return user;
}

export async function updateUserPasswordByEmail(email, password) {
  // WHY (Functionality): returning a safe user shape keeps password hashes out
  // of downstream route handling after password updates.
  const sql = `
  UPDATE users
  SET password = $2
  WHERE lower(email) = lower($1)
  RETURNING id, username, email, created_at
  `;
  const hashedPassword = await bcrypt.hash(password, 10);
  const {
    rows: [user],
  } = await db.query(sql, [email, hashedPassword]);
  return user;
}
