"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/** Dismissible navigation dropdown; persistent sidebar accordions opt out. */
export function NavigationDetails({ children, closeOnNavigate = true, onClick, onPointerEnter, onPointerLeave, onPointerDown, ...props }: Omit<ComponentProps<"details">, "ref"> & { closeOnNavigate?: boolean }) {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pointerType = useRef<string>("");

    function cancelClose() {
        if (closeTimer.current !== null) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }

    useEffect(() => () => cancelClose(), []);

    useEffect(() => {
        if (!closeOnNavigate) return;
        const details = detailsRef.current;
        if (!details) return;

        const dismissOutside = (event: Event) => {
            if (event.target instanceof Node && !details.contains(event.target)) {
                details.open = false;
            }
        };

        const dismissWithEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape" || !details.open) return;
            details.open = false;
            details.querySelector("summary")?.focus();
        };

        document.addEventListener("pointerdown", dismissOutside, true);
        document.addEventListener("focusin", dismissOutside);
        document.addEventListener("keydown", dismissWithEscape);
        return () => {
            document.removeEventListener("pointerdown", dismissOutside, true);
            document.removeEventListener("focusin", dismissOutside);
            document.removeEventListener("keydown", dismissWithEscape);
        };
    }, [closeOnNavigate]);

    return <details
        {...props}
        ref={detailsRef}
        name={closeOnNavigate ? (props.name ?? "navigation-dropdown") : props.name}
        onPointerEnter={(event) => {
            onPointerEnter?.(event);
            cancelClose();
            if (closeOnNavigate && event.pointerType === "mouse" && window.matchMedia("(hover: hover)").matches) {
                event.currentTarget.open = true;
            }
        }}
        onPointerLeave={(event) => {
            onPointerLeave?.(event);
            if (!closeOnNavigate || event.pointerType !== "mouse") return;
            cancelClose();
            const details = event.currentTarget;
            // Allow crossing the small gap between the trigger and its panel.
            closeTimer.current = setTimeout(() => { details.open = false; }, 180);
        }}
        onPointerDown={(event) => {
            onPointerDown?.(event);
            pointerType.current = event.pointerType;
        }}
        onClick={(event) => {
            onClick?.(event);
            // Next Link prevents the browser's default navigation before this bubbles.
            if (!closeOnNavigate || !(event.target instanceof Element)) return;
            if (event.target.closest("summary") && event.detail > 0 && pointerType.current === "mouse" && window.matchMedia("(hover: hover)").matches) {
                // A mouse click must not immediately collapse a menu opened by hover.
                event.preventDefault();
                event.currentTarget.open = true;
            }
            const action = event.target.closest("a, button");
            if (action && !action.closest("summary")) event.currentTarget.open = false;
        }}
    >{children}</details>;
}
