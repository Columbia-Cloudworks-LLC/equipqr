
import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SIDEBAR_WIDTH_MOBILE } from "./sidebar-constants"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

/**
 * Main Sidebar container component
 */
export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { className?: string; open?: boolean }
>(({ className, open, ...props }, ref) => {
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar()
  const isOpen = state === "expanded" || openMobile

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
            "fixed inset-y-0 left-0 z-50 flex h-full flex-col overflow-hidden border-r text-white shadow-sm transition-all duration-300 ease-in-out",
            isOpen
              ? isMobile
                ? `w-[${SIDEBAR_WIDTH_MOBILE}]`
                : `w-[${SIDEBAR_WIDTH}]`
              : `w-[${SIDEBAR_WIDTH_ICON}]`,
            isMobile && !openMobile && "translate-x-[-100%]",
            isMobile && openMobile && "translate-x-0",
            className
          )}
          style={{
            width: isOpen
              ? isMobile
                ? SIDEBAR_WIDTH_MOBILE
                : SIDEBAR_WIDTH
              : SIDEBAR_WIDTH_ICON,
          }}
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
  
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b px-3",
        className
      )}
      {...props}
    >
      {children}
      {showTrigger && !isMobile && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-accent/50 text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "transition-transform duration-200",
              state === "collapsed" ? "rotate-180" : "rotate-0"
            )}
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
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
    className={cn("flex flex-1 flex-col overflow-auto py-2", className)}
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
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="footer"
    className={cn("mt-auto flex shrink-0 flex-col border-t", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"
