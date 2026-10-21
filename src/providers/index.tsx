"use client";

import * as React from "react";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { SessionProvider } from "./session-provider";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider><SessionProvider><TooltipProvider delay={300}><ToastProvider>{children}</ToastProvider></TooltipProvider></SessionProvider></QueryProvider>
    </ThemeProvider>
  );
}

export * from "./query-provider";
export * from "./theme-provider";
export * from "./session-provider";
