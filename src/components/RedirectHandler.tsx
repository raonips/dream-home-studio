import { useEffect, useState } from "react";
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

const RedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadRedirects().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadRedirects().then((map) => {
      const current = normalize(location.pathname);
      const target = map.get(current);
      if (target && target !== location.pathname) {
        navigate(target + location.search + location.hash, { replace: true });
      }
    });
  }, [location.pathname, location.search, location.hash, ready, navigate]);

  return null;
};

export default RedirectHandler;
