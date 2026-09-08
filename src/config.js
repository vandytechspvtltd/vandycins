import dotenv from "dotenv";
dotenv.config();

function required(name) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  appBaseUrl: process.env.APP_BASE_URL || "",
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  db: {
    host: required("DB_HOST"),
    port: Number(process.env.DB_PORT || 3306),
    database: required("DB_NAME"),
    user: required("DB_USER"),
    password: process.env.DB_PASSWORD || ""
  },
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",").map(v => v.trim()).filter(Boolean),
  appApiKey: (process.env.APP_API_KEY || "").trim(),
  abdm: {
    clientId: process.env.ABDM_CLIENT_ID || "",
    clientSecret: process.env.ABDM_CLIENT_SECRET || "",
    sessionUrl: process.env.ABDM_SESSION_URL || "https://live.abdm.gov.in/api/hiecm/gateway/v3/sessions",
    registryBaseUrl: process.env.ABDM_DRUG_REGISTRY_BASE_URL || "https://drugregistrysbx.abdm.gov.in/drug-registry/v1",
    xCmId: process.env.ABDM_X_CM_ID || "SBX",
    authScheme: (process.env.ABDM_AUTH_SCHEME || "").trim(),
    timeoutMs: Number(process.env.ABDM_TIMEOUT_MS || 15000)
  }
};
