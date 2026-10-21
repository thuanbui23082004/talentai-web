"use client";

import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

export type ToastOptions = {
    title: string;
    description?: string;
    variant?: "success" | "error" | "info";
};

export function useToast() {
    const manager = Toast.useToastManager<Record<string, never>>();
    return {
        toast: ({ title, description, variant = "success" }: ToastOptions) =>
            manager.add({
                title,
                description,
                type: variant,
                priority: variant === "error" ? "high" : "low",
            }),
        dismiss: manager.close,
    };
}

function ToastViewport() {
    const { toasts } = Toast.useToastManager<Record<string, never>>();
    return (
        <Toast.Portal>
            <Toast.Viewport
                className="fixed right-4 bottom-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 outline-none"
                aria-label="Thông báo"
            >
                {toasts.map((toast) => {
                    const Icon =
                        toast.type === "error"
                            ? CircleAlert
                            : toast.type === "success"
                              ? CheckCircle2
                              : Info;
                    return (
                        <Toast.Root
                            key={toast.id}
                            toast={toast}
                            aria-hidden={false}
                            className="ui-toast"
                        >
                            <Icon
                                aria-hidden="true"
                                className={`mt-0.5 size-5 shrink-0 ${toast.type === "error" ? "text-destructive" : toast.type === "success" ? "text-success" : "text-info"}`}
                            />
                            <Toast.Content className="min-w-0 flex-1">
                                <Toast.Title className="text-sm font-semibold" />
                                <Toast.Description className="mt-1 text-xs leading-relaxed text-muted-foreground" />
                            </Toast.Content>
                            <Toast.Close
                                aria-hidden={false}
                                aria-label="Đóng thông báo"
                                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                            >
                                <X className="size-4" />
                            </Toast.Close>
                        </Toast.Root>
                    );
                })}
            </Toast.Viewport>
        </Toast.Portal>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    return (
        <Toast.Provider timeout={5000} limit={3}>
            {children}
            <ToastViewport />
        </Toast.Provider>
    );
}
