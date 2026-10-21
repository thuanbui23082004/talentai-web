"use client";

import { Tabs as Primitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

export const Tabs = Primitive.Root;
export function TabsList({
    className,
    ...props
}: Omit<Primitive.List.Props, "className"> & { className?: string }) {
    return (
        <Primitive.List
            {...props}
            className={cn(
                "flex w-fit max-w-full flex-wrap gap-1 rounded-xl border border-border bg-muted/50 p-1",
                className,
            )}
        />
    );
}
export function TabsTrigger({
    className,
    ...props
}: Omit<Primitive.Tab.Props, "className"> & { className?: string }) {
    return (
        <Primitive.Tab
            {...props}
            className={cn(
                "min-h-9 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-primary data-active:bg-card data-active:text-primary data-active:shadow-card data-disabled:cursor-not-allowed data-disabled:opacity-40",
                className,
            )}
        />
    );
}
export function TabsContent({
    className,
    ...props
}: Omit<Primitive.Panel.Props, "className"> & { className?: string }) {
    return (
        <Primitive.Panel
            {...props}
            className={cn("mt-5 rounded-lg", className)}
        />
    );
}
