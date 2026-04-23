import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RedirectRow {
  old_path: string;
  new_path: string;
}

let cache: Map<string, string> | null = null;
let cachePromise: Promise<Map<string, string>> | null = null;

const normalize = (p: string) => {
  if (!p) return "/";
  // remove trailing slash exceto root
  const trimmed = p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
  return trimmed.toLowerCase();
};

const loadRedirects = async (): Promise<Map<string, string>> => {
  if (cache) return cache;
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const { data, error } = await (supabase as any)
      .from("url_redirects")
      .select("old_path,new_path")
      .eq("is_active", true);
    const map = new Map<string, string>();
    if (!error && Array.isArray(data)) {
      for (const r of data as RedirectRow[]) {
        map.set(normalize(r.old_path), r.new_path);
      }
    }
    cache = map;
    return map;
  })();
  return cachePromise;
};

export const invalidateRedirectCache = () => {
  cache = null;
  cachePromise = null;
};

interface Props {
  children: React.ReactNode;
}

/**
 * Guarda de trânsito global. Verifica a tabela url_redirects ANTES de renderizar
 * qualquer rota filha. Garante que redirecionamentos 301 tenham prioridade sobre
 * o catch-all de 404, evitando que o NotFound seja exibido brevemente.
 */
const RedirectHandler = ({ children }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean>(!!cache);
  const lastCheckedRef = useRef<string>("");

  // Carrega o cache na primeira montagem (bloqueia render até concluir)
  useEffect(() => {
    if (cache) {
      setReady(true);
      return;
    }
    let cancelled = false;
    loadRedirects().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Verificação síncrona em cada mudança de rota (cache já carregado)
  const currentKey = location.pathname + location.search + location.hash;
  if (ready && cache && lastCheckedRef.current !== currentKey) {
    lastCheckedRef.current = currentKey;
    const normalizedCurrent = normalize(location.pathname);
    const target = cache.get(normalizedCurrent);
    if (target && normalize(target) !== normalizedCurrent) {
      // Redireciona imediatamente, antes do React renderizar as rotas filhas
      navigate(target + location.search + location.hash, { replace: true });
      return null;
    }
  }

  if (!ready) {
    return null;
  }

  return <>{children}</>;
};

export default RedirectHandler;
