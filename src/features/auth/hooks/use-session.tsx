"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "../types";
import { getCurrentUser, logout } from "../services/auth";
import { authKeys } from "../query-keys";

const SessionContext = createContext<{ user: AuthUser | null; isPending: boolean; isError: boolean } | undefined>(undefined);
const IDLE_MS = 30 * 60 * 1000;

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: authKeys.me, queryFn: getCurrentUser, retry: false, staleTime: 60_000, refetchOnWindowFocus: true, refetchOnReconnect: true });
  const refetch = query.refetch;
  const lastActivity = useRef(0);

  useEffect(() => {
    if (!query.data) return;
    lastActivity.current = Date.now();
    let lastCheck = Date.now();
    const activity = () => {
      lastActivity.current = Date.now();
      // Renew only on actual interaction, at most once a minute. Background
      // timers alone must not extend the server's inactivity timeout.
      if (Date.now() - lastCheck >= 60_000) {
        lastCheck = Date.now();
        void refetch();
      }
    };
    for (const event of ["pointerdown", "keydown", "scroll"]) window.addEventListener(event, activity, { passive: true });
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= IDLE_MS) {
        void logout().catch(() => undefined).finally(() => {
          queryClient.clear();
          window.location.replace("/login?reason=expired");
        });
      }
    }, 15_000);
    return () => {
      window.clearInterval(timer);
      for (const event of ["pointerdown", "keydown", "scroll"]) window.removeEventListener(event, activity);
    };
  }, [query.data, queryClient, refetch]);

  useEffect(() => {
    if (query.isSuccess && !query.data && /^\/(candidate|recruiter|admin)(\/|$)/.test(window.location.pathname)) {
      queryClient.clear();
      window.location.replace("/login?reason=expired");
    }
  }, [query.data, query.isSuccess, queryClient]);

  return <SessionContext.Provider value={{ user: query.data ?? null, isPending: query.isPending, isError: query.isError }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within AuthSessionProvider");
  return context;
}
