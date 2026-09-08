import crypto from "crypto";
import { config } from "../config.js";

let token = null;
let expiresAt = 0;
let tokenPromise = null;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.abdm.timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };
    if (!response.ok) {
      const e = new Error(body?.message || `ABDM request failed: ${response.status}`);
      e.status = response.status;
      throw e;
    }
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function newToken() {
  if (!config.abdm.clientId || !config.abdm.clientSecret) {
    const e = new Error("ABDM credentials are not configured");
    e.status = 503;
    throw e;
  }

  const result = await fetchWithTimeout(config.abdm.sessionUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "REQUEST-ID": crypto.randomUUID(),
      TIMESTAMP: new Date().toISOString(),
      "X-CM-ID": config.abdm.xCmId
    },
    body: JSON.stringify({
      clientId: config.abdm.clientId,
      clientSecret: config.abdm.clientSecret,
      grantType: "client_credentials"
    })
  });

  if (!result.body.accessToken) {
    const e = new Error("ABDM did not return accessToken");
    e.status = 502;
    throw e;
  }

  const seconds = Number(result.body.expiresIn || 300);
  token = result.body.accessToken;
  expiresAt = Date.now() + Math.max(5, seconds - 60) * 1000;
  return token;
}

async function getToken(force = false) {
  if (!force && token && Date.now() < expiresAt) return token;
  if (!tokenPromise) tokenPromise = newToken().finally(() => { tokenPromise = null; });
  return tokenPromise;
}

function authValue(t) {
  return config.abdm.authScheme ? `${config.abdm.authScheme} ${t}` : t;
}

async function registryGet(path, query = {}) {
  const url = new URL(`${config.abdm.registryBaseUrl}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  async function call(force) {
    const t = await getToken(force);
    return fetchWithTimeout(url.toString(), {
      headers: { Accept: "application/json", Authorization: authValue(t) }
    });
  }

  try {
    return await call(false);
  } catch (e) {
    if (e.status === 401) {
      token = null; expiresAt = 0;
      return call(true);
    }
    throw e;
  }
}

export const abdmSearch = (q, page, limit) => registryGet("/search", { q, page, limit });
export const abdmBrand = id => registryGet(`/brand/${encodeURIComponent(id)}`);
export const abdmGeneric = id => registryGet(`/generics/${encodeURIComponent(id)}`);
export const abdmSupplier = (id, page, limit) =>
  registryGet(`/suppliers/${encodeURIComponent(id)}`, { page, limit });
export const abdmSubstance = id =>
  registryGet(`/substances/${encodeURIComponent(id)}`);
