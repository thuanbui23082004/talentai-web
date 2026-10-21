import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <><a href="#main-content" className="sr-only fixed top-2 left-2 z-[100] rounded-lg bg-card p-3 text-primary focus:not-sr-only">Chuyển đến nội dung chính</a><SiteHeader /><div id="main-content">{children}</div><SiteFooter /></>;
}
