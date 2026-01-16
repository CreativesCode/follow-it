"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Memoizar la instancia de Supabase para evitar recreaciones
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // Remover supabase de dependencias ya que está memoizado y no cambia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading };
}
