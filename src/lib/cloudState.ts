import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const readLocal = <T,>(key: string, def: T, merge: boolean): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return def;
    const v = JSON.parse(raw);
    return merge && v && typeof v === "object" && !Array.isArray(v) ? { ...def, ...v } : v;
  } catch { return def; }
};

/**
 * State kept in localStorage and, when signed in, synced to the user's account
 * (table user_workspace) so it appears on every device.
 */
export function useCloudState<T>(key: string, def: T, opts: { merge?: boolean } = {}): [T, Dispatch<SetStateAction<T>>, boolean] {
  const merge = !!opts.merge;
  const { user } = useAuth();
  const [value, setValue] = useState<T>(() => readLocal(key, def, merge));
  const [synced, setSynced] = useState(false);
  const ready = useRef(false);

  // Pull from account on sign-in; if nothing there yet, push the local copy up.
  useEffect(() => {
    ready.current = false; setSynced(false);
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("user_workspace").select("value").eq("user_id", user.id).eq("key", key).maybeSingle();
      if (cancelled) return;
      if (data) {
        const v = data.value as T;
        const next = merge && v && typeof v === "object" && !Array.isArray(v) ? ({ ...def, ...(v as object) } as T) : v;
        setValue(next);
        localStorage.setItem(key, JSON.stringify(next));
      } else {
        await supabase.from("user_workspace").upsert({ user_id: user.id, key, value: readLocal(key, def, merge) as never });
      }
      ready.current = true; setSynced(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, key]);

  // Save locally at once; save to account shortly after edits stop.
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
    if (!user || !ready.current) return;
    const t = setTimeout(() => {
      supabase.from("user_workspace").upsert({ user_id: user.id, key, value: value as never, updated_at: new Date().toISOString() }).then(({ error }) => { if (error) console.warn("cloud save failed", error.message); });
    }, 800);
    return () => clearTimeout(t);
  }, [value, key, user]);

  return [value, setValue, synced];
}
