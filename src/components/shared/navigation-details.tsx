"use client";

import type { ComponentProps } from "react";

/** Native keyboard-accessible menu that also closes after client-side navigation. */
export function NavigationDetails({ children, closeOnNavigate = true, ...props }: ComponentProps<"details"> & { closeOnNavigate?: boolean }) {
    return <details {...props} onClick={(event) => {
        if(closeOnNavigate && (event.target as HTMLElement).closest("a")) event.currentTarget.open = false;
    }}>{children}</details>;
}
