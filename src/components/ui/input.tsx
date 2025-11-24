import * as React from "react"

import { cn } from "@/lib/utils"

type NativeInputProps = Omit<React.ComponentProps<"input">, "size">;
interface InputProps extends NativeInputProps {
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeClasses: Record<string, string> = {
  xs: "h-6 px-2 py-0.5 text-xs",
  sm: "h-8 px-2 py-1 text-sm",
  md: "h-9 px-3 py-1 text-base",
  lg: "h-10 px-4 py-2 text-lg",
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "md", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-md border border-input bg-transparent shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          size && sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
