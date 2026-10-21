import type { ReactNode } from "react";
import { AuthFrame } from "@/features/auth";

export default function AuthLayout({ children }: { children: ReactNode }) { return <AuthFrame>{children}</AuthFrame>; }
