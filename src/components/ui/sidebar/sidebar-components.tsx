
import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SIDEBAR_WIDTH_MOBILE } from "./sidebar-constants"
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
      if (openMobile && !isSidebarOrChild) {
        setOpenMobile(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openMobile, setOpenMobile])

  return (
    <>
      {/* Mobile overlay */}
      {openMobile && (
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
            "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-slate-800 text-white shadow-sm transition-all duration-300 ease-in-out",
            state === "expanded" ? "w-64" : "w-14",
            isMobile && !openMobile && "translate-x-[-100%]",
            isMobile && openMobile && "translate-x-0",
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
 * Sidebar header component - typically contains logo and controls
 */
export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { showTrigger?: boolean }
>(({ className, children, showTrigger = false, ...props }, ref) => {
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"
  
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b border-slate-700 px-3",
        className
      )}
      {...props}
    >
      {children}
      {showTrigger && !isMobile && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-700 text-white"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle Sidebar</span>
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
    className={cn("flex flex-1 flex-col py-2 overflow-hidden", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

/**
 * Sidebar footer - contains fixed content at the bottom
 */
export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("mt-auto shrink-0 flex flex-col border-t border-slate-700", className)}
      {...props}
    >
      {/* Add collapse/expand button in footer when collapsed */}
      {isCollapsed && (
        <button
          onClick={toggleSidebar}
          className="flex h-10 w-full items-center justify-center text-white hover:bg-slate-700 transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Expand Sidebar</span>
        </button>
      )}
      {/* User content in footer */}
      {props.children}
    </div>
  )
})
SidebarFooter.displayName = "SidebarFooter"
