export function notFound(req, res) {
  res.status(404).json({ success: false, error: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({
    success: false,
    error: status >= 500 ? "Internal server error" : err.message
  });
}
