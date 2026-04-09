import { supabase } from "@/integrations/supabase/client";

function sanitizeBaseName(fileName: string) {
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  const normalized = withoutExt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-+/g, "-");

  return slug || "imagem";
}

function safeExtFromFile(file: File) {
  const originalExt = (file.name.split(".").pop() || "").toLowerCase();
  const fromMime = file.type?.split("/")?.[1] ?? "";
  const extRaw = (originalExt || fromMime || "jpg").toLowerCase();
  const ext = extRaw.replace(/[^a-z0-9]/g, "");
  return ext || "jpg";
}

function safeUuid() {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Gera um path seguro para o Storage, removendo acentos/espaços e prefixando com UUID.
 */
export function createSafeStoragePath(opts: { folder: string; file: File }) {
  const folder = (opts.folder || "uploads").replace(/^\/+|\/+$/g, "");
  const base = sanitizeBaseName(opts.file.name);
  const ext = safeExtFromFile(opts.file);
  const uuid = safeUuid();
  return `${folder}/${uuid}-${base}.${ext}`;
}

/**
 * Get access token without triggering auth lock contention.
 * First tries to read from the current session (no lock),
 * falls back to getSession only if needed.
 */
async function getAccessTokenSafe(): Promise<string | null> {
  try {
    // Try getting session without lock first
    const storageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.access_token;
      const expiresAt = parsed?.expires_at;
      // If token exists and not expired (with 60s buffer), use it directly
      if (token && expiresAt && expiresAt > Math.floor(Date.now() / 1000) + 60) {
        return token;
      }
    }
  } catch {
    // localStorage read failed, fall through
  }

  // Fallback: use SDK (may acquire lock)
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Upload com token explícito + logs detalhados para diagnosticar RLS/bucket/auth.
 * Usa leitura direta do token para evitar "lock not released".
 */
export async function uploadToStorageWithProgress(opts: {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
  timeoutMs?: number;
  onProgress?: (pct: number) => void;
}): Promise<{ path: string }> {
  const { bucket, path, file, upsert = false, timeoutMs = 120_000, onProgress } = opts;

  onProgress?.(1);

  const token = await getAccessTokenSafe();

  if (!token) {
    console.error("[Storage Upload] No valid token available", { bucket, path });
    throw new Error("Sessão expirada. Faça login novamente para enviar imagens.");
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
        "x-upsert": String(upsert),
        "content-type": file.type || "application/octet-stream",
      },
      body: file,
      signal: controller.signal,
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("[Storage Upload] HTTP error", {
        bucket, path, status: response.status, responseText,
      });
      throw new Error(
        `Falha no upload (${response.status}) ${responseText || "sem detalhes"}`
      );
    }

    onProgress?.(100);
    return { path };
  } catch (err) {
    if ((err as any)?.name === "AbortError") {
      throw new Error(`Upload expirou após ${Math.round(timeoutMs / 1000)}s. Tente novamente.`);
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }
}
