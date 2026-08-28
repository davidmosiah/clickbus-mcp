import { homedir } from "node:os";
import { join } from "node:path";
import { DEFAULT_API_BASE, DEFAULT_CLIENT_ID, TOKEN_DIR_NAME, WEB_ORIGIN } from "../constants.js";
import type { ClickbusConfig, PrivacyMode } from "../types.js";

type Env = Record<string, string | undefined>;

function env(name: string, source: Env = process.env): string | undefined {
  const value = source[name];
  return value && value.trim() ? value.trim() : undefined;
}

function parseBool(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parsePrivacyMode(value: string | undefined): PrivacyMode {
  if (value === "summary" || value === "structured" || value === "raw") return value;
  return "summary";
}

export function tokenDir(homeDir = homedir()): string {
  return join(homeDir, TOKEN_DIR_NAME);
}

export function peekConfig(source: Env = process.env, homeDir = homedir()): ClickbusConfig {
  const dir = tokenDir(homeDir);
  return {
    apiBase: (env("CLICKBUS_API_BASE", source) ?? DEFAULT_API_BASE).replace(/\/$/, ""),
    country: (env("CLICKBUS_COUNTRY", source) ?? "BR").toUpperCase(),
    origin: env("CLICKBUS_ORIGIN", source) ?? WEB_ORIGIN,
    tokenPath: env("CLICKBUS_TOKEN_PATH", source) ?? join(dir, "tokens.json"),
    configPath: env("CLICKBUS_CONFIG_PATH", source) ?? join(dir, "config.json"),
    deviceIdPath: env("CLICKBUS_DEVICE_ID_PATH", source) ?? join(dir, "device-id"),
    privacyMode: parsePrivacyMode(env("CLICKBUS_PRIVACY_MODE", source)),
    allowMutations: parseBool(env("CLICKBUS_ALLOW_MUTATIONS", source), false),
    clientId: env("CLICKBUS_CLIENT_ID", source) ?? DEFAULT_CLIENT_ID
  };
}

export function envAccessToken(source: Env = process.env): string | undefined {
  return env("CLICKBUS_ACCESS_TOKEN", source);
}
