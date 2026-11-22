import type { ReactNode } from "react";
import { AuthFrame } from "@/features/auth/components/auth-frame";

export default function AuthLayout({ children }: { children: ReactNode }) { return <AuthFrame>{children}</AuthFrame>; }
