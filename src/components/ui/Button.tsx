
import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md text-sm font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer relative z-30 backdrop-blur-md",
    {
        variants: {
            variant: {
                default: "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/40 group-hover:bg-primary/40 shadow-[0_0_15px_rgba(102,252,241,0.1)]",
                destructive: "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40",
                outline: "border border-white/10 bg-transparent hover:bg-primary/20 hover:text-primary hover:border-primary/30",
                secondary: "bg-secondary/20 text-secondary-foreground border border-secondary/30 hover:bg-secondary/40",
                ghost: "hover:bg-primary/20 hover:text-primary",
                link: "text-primary underline-offset-4 hover:underline",
                glass: "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/40 group-hover:bg-primary/40",
            },
            size: {
                default: "h-9 px-6 py-2",
                sm: "h-8 px-4 text-xs",
                lg: "h-11 px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
