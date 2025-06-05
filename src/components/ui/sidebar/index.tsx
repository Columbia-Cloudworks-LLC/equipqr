
import { TooltipProvider } from "@/components/ui/tooltip"

// Re-export everything
export * from "./sidebar-context"
export * from "./sidebar-components"
export * from "./sidebar-group"
export * from "./sidebar-menu"
export * from "./sidebar-trigger"

// Add SidebarInset component
import * as React from "react"
import { cn } from "@/lib/utils"

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <main
    ref={ref}
    className={cn(
      "relative flex min-h-screen flex-1 flex-col bg-background",
      "peer-data-[variant=inset]:min-h-[calc(100vh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
      className
    )}
    {...props}
  />
))
SidebarInset.displayName = "SidebarInset"
