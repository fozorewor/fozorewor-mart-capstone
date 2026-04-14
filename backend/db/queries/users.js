import bcrypt from "bcrypt";
import db from "#db/client";

export async function createUser(username, email, password) {
  const sql = `
  INSERT INTO users
    (username, email, password)
  VALUES
    ($1, $2, $3)
  RETURNING *
  `;
  const hashedPassword = await bcrypt.hash(password, 10);
  const {
    rows: [user],
  } = await db.query(sql, [username, email, hashedPassword]);
  return user;
}

export async function getUserByCredentials(identifier, password) {
  const sql = `
  SELECT *
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

  return user;
}

export async function getUserById(id) {
  const sql = `
  SELECT *
  FROM users
  WHERE id = $1
  `;
  const {
    rows: [user],
  } = await db.query(sql, [id]);
  return user;
}

export async function updateUserPasswordByEmail(email, password) {
  const sql = `
  UPDATE users
  SET password = $2
  WHERE lower(email) = lower($1)
  RETURNING *
  `;
  const hashedPassword = await bcrypt.hash(password, 10);
  const {
    rows: [user],
  } = await db.query(sql, [email, hashedPassword]);
  return user;
}
