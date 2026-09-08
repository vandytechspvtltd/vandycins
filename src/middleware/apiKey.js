import crypto from "crypto";
import { config } from "../config.js";

export function optionalApiKey(req, res, next) {
  if (!config.appApiKey) return next();
  const provided = req.get("X-API-Key") || "";
  const a = Buffer.from(provided);
  const b = Buffer.from(config.appApiKey);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ success: false, error: "Invalid API key" });
  }
  next();
}
