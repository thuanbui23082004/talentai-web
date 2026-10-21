"use client";

import { Button as Primitive } from "@base-ui/react/button";
import { LoaderCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "ui-button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border text-sm font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                primary:
                    "border-transparent bg-primary text-primary-foreground shadow-button hover:bg-primary-hover",
                default:
                    "border-transparent bg-primary text-primary-foreground shadow-button hover:bg-primary-hover",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary-hover",
                outline:
                    "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary/50",
                ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-secondary hover:text-primary",
                destructive:
                    "border-transparent bg-destructive text-white hover:bg-destructive/90",
                link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-11 px-5",
                sm: "h-9 rounded-lg px-3 text-xs",
                lg: "h-12 px-6 text-base",
                icon: "size-11 p-0",
                "icon-sm": "size-9 rounded-lg p-0",
                "icon-lg": "size-12 p-0",
            },
        },
        defaultVariants: { variant: "primary", size: "default" },
    },
);

export type ButtonProps = Omit<Primitive.Props, "className"> &
    VariantProps<typeof buttonVariants> & {
        className?: string;
        loading?: boolean;
    };
export function Button({
    className,
    variant,
    size,
    loading = false,
    disabled,
    children,
    type = "button",
    ...props
}: ButtonProps) {
    return (
        <Primitive
            {...props}
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={cn(buttonVariants({ variant, size }), className)}
        >
            {loading && (
                <LoaderCircle
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                />
            )}
            {children}
        </Primitive>
    );
}
export { buttonVariants };
