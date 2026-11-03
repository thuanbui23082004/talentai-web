"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "../types";
import { getCurrentUser } from "../services/auth";
import { authKeys } from "../query-keys";

const SessionContext = createContext<{ user: AuthUser | null; isPending: boolean; isError: boolean } | undefined>(undefined);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: authKeys.me, queryFn: getCurrentUser, retry: false, staleTime: 60_000, refetchOnWindowFocus: true, refetchOnReconnect: true });

  useEffect(() => {
    if (!query.isSuccess) return;
    if (!query.data && /^\/(candidate|recruiter|admin)(\/|$)/.test(window.location.pathname)) {
      queryClient.clear();
      window.location.replace("/login?reason=expired");
    } else if (query.data && window.location.pathname === "/login") {
      // After an expired access cookie caused a server guard redirect, /me
      // refreshes through Java and restores navigation with the new cookies.
      window.location.replace(`/${query.data.role}/dashboard`);
    }
  }, [query.data, query.isSuccess, queryClient]);

  return <SessionContext.Provider value={{ user: query.data ?? null, isPending: query.isPending, isError: query.isError }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within AuthSessionProvider");
  return context;
}
