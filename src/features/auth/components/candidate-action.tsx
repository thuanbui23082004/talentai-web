"use client";

import type { ReactNode } from "react";
import { useSession } from "../hooks/use-session";

/** Keep guest calls to action visible, but show account actions only to candidates. */
export function CandidateAction({ children }: { children: ReactNode }) {
    const { user, isPending } = useSession();

    if (isPending || (user && user.role !== "candidate")) return null;

    return <>{children}</>;
}
