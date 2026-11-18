import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <SiteHeader />
            <div id="main-content">{children}</div>
            <SiteFooter />
        </>
    );
}
