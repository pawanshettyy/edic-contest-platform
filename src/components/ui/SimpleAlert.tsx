import * as React from "react"
import { cn } from "@/lib/utils"

interface SimpleAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

const SimpleAlert = React.forwardRef<HTMLDivElement, SimpleAlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-sm",
        variant === "destructive"
          ? "border-red-500/50 text-red-600 dark:border-red-500 [&>svg]:text-red-600"
          : "border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        className
      )}
      {...props}
    />
  )
)
SimpleAlert.displayName = "SimpleAlert"

const SimpleAlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
SimpleAlertDescription.displayName = "SimpleAlertDescription"

export { SimpleAlert, SimpleAlertDescription }
