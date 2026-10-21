"use client";

import { useId, useState, type ReactElement, type ReactNode } from "react";
import { Tooltip as Primitive } from "@base-ui/react/tooltip";

export const TooltipProvider = Primitive.Provider;

export function Tooltip({
    children,
    content,
    side = "top",
}: {
    children: ReactElement<{ "aria-describedby"?: string }>;
    content: ReactNode;
    side?: "top" | "right" | "bottom" | "left";
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const describedBy =
        [children.props["aria-describedby"], open ? id : undefined]
            .filter(Boolean)
            .join(" ") || undefined;
    return (
        <Primitive.Root open={open} onOpenChange={setOpen}>
            <Primitive.Trigger
                render={children}
                aria-describedby={describedBy}
            />
            <Primitive.Portal>
                <Primitive.Positioner
                    side={side}
                    sideOffset={8}
                    className="z-[70]"
                >
                    <Primitive.Popup
                        id={id}
                        role="tooltip"
                        className="max-w-64 rounded-lg bg-foreground px-3 py-2 text-xs leading-relaxed text-white shadow-card transition-opacity data-starting:opacity-0 data-ending:opacity-0"
                    >
                        {content}
                    </Primitive.Popup>
                </Primitive.Positioner>
            </Primitive.Portal>
        </Primitive.Root>
    );
}
