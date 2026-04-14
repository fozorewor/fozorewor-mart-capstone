import { getUserById } from "#db/queries/users";
import { verifyToken } from "#utils/jwt";

export default async function getUserFromToken(req, _res, next) {
  const authorization = req.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) return next();

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return next();

  try {
    const { id } = verifyToken(token);
    const user = await getUserById(id);
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
}
