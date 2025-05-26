
import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight } from "lucide-react"

/**
 * Main Sidebar container component
 */
export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { className?: string }
>(({ className, ...props }, ref) => {
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar()

  // Close mobile sidebar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const isSidebarOrChild = target.closest("[data-sidebar]")
      if (openMobile && isMobile && !isSidebarOrChild) {
        setOpenMobile(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openMobile, setOpenMobile, isMobile])

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && openMobile && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 lg:hidden" 
          onClick={() => setOpenMobile(false)}
          data-sidebar="overlay"
        />
      )}
      
      <TooltipProvider delayDuration={0}>
        <aside
          ref={ref}
          data-sidebar="root"
          data-state={state}
          data-mobile-open={openMobile}
          className={cn(
            "flex h-full flex-col border-r bg-slate-800 text-white shadow-sm transition-all duration-300 ease-in-out overflow-hidden",
            // Only use fixed positioning for mobile
            isMobile ? "fixed inset-y-0 left-0 z-50" : "relative",
            state === "expanded" ? "w-64" : "w-14",
            isMobile && !openMobile && "translate-x-[-100%]",
            isMobile && openMobile && "translate-x-0 w-64", // Always expanded when mobile and open
            className
          )}
          {...props}
        />
      </TooltipProvider>
    </>
  )
})
Sidebar.displayName = "Sidebar"

/**
 * Sidebar header component - now includes the toggle button
 */
export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { showTrigger?: boolean }
>(({ className, children, showTrigger = false, ...props }, ref) => {
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b border-slate-700 px-3 relative",
        className
      )}
      {...props}
    >
      {children}
      
      {/* Toggle button - only show on desktop */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex h-6 w-6 items-center justify-center text-white rounded-md hover:bg-slate-700 transition-colors shrink-0",
            isCollapsed && "ml-auto" // Center when collapsed
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  )
})
SidebarHeader.displayName = "SidebarHeader"

/**
 * Sidebar content container
 */
export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="content"
    className={cn("flex flex-1 flex-col py-2 overflow-y-auto no-scrollbar min-h-0", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

/**
 * Sidebar footer - simplified, no longer contains toggle button
 */
export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn(
        "shrink-0 flex flex-col border-t border-slate-700",
        className
      )}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"
