export default function handlePostgresErrors(error, _req, res, next) {
  if (!error?.code) return next(error);

  if (error.code === "23505") {
    return res.status(409).json({
      error: "That username or email is already in use.",
    });
  }

  if (error.code === "23503") {
    return res.status(400).json({
      error: "That record references data that does not exist.",
    });
  }

  if (error.code === "23502") {
    return res.status(400).json({
      error: "A required field is missing.",
    });
  }

  if (error.code === "22P02") {
    return res.status(400).json({
      error: "One of the provided values has an invalid format.",
    });
  }

  return next(error);
}
