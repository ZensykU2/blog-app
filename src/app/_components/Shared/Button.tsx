"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost" | "glass";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Button({
    children,
    className = "",
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95";

    const variants = {
        primary: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]",
        secondary: "bg-white text-slate-900 hover:bg-slate-100 shadow-md hover:shadow-lg hover:shadow-white/10",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
        ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
        glass: "bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-slate-200",
    };

    const sizes = {
        sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
        md: "text-sm px-5 py-2.5 rounded-xl gap-2",
        lg: "text-base px-8 py-3.5 rounded-2xl gap-2",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={size === "lg" ? 20 : 16} />}
            {!isLoading && leftIcon}
            {children}
            {!isLoading && rightIcon}
        </button>
    );
}
