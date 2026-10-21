"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;

export function ModalContent({
    title,
    description,
    children,
    footer,
    className,
}: {
    title: string;
    description?: string;
    children?: ReactNode;
    footer?: ReactNode;
    className?: string;
}) {
    return (
        <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[3px] transition-opacity data-ending:opacity-0 data-starting:opacity-0" />
            <Dialog.Popup
                className={cn(
                    "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-float outline-none transition-[opacity,scale] data-ending:scale-95 data-ending:opacity-0 data-starting:scale-95 data-starting:opacity-0",
                    className,
                )}
            >
                <div className="pr-9">
                    <Dialog.Title className="text-xl font-bold tracking-tight">
                        {title}
                    </Dialog.Title>
                    {description && (
                        <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {description}
                        </Dialog.Description>
                    )}
                </div>
                <Dialog.Close
                    render={
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="absolute top-4 right-4"
                            aria-label="Đóng hộp thoại"
                        />
                    }
                >
                    <X />
                </Dialog.Close>
                {children && <div className="mt-6">{children}</div>}
                {footer && (
                    <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
                        {footer}
                    </div>
                )}
            </Dialog.Popup>
        </Dialog.Portal>
    );
}
