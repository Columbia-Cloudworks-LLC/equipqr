
import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={cn("grid gap-0.5", className)}
      {...props}
    />
  )
})
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li"> & { showTooltipOnCollapsed?: boolean }
>(({ className, showTooltipOnCollapsed = true, ...props }, ref) => {
  return (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={cn("list-none", className)}
      {...props}
    />
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"

type SidebarMenuButtonProps = {
  asChild?: boolean
  tooltip?: string
  active?: boolean
  showTooltipOnCollapsed?: boolean
  className?: string
  children: React.ReactNode
}

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement | HTMLDivElement,
  SidebarMenuButtonProps & (
    | React.ButtonHTMLAttributes<HTMLButtonElement>
    | React.HTMLAttributes<HTMLDivElement>
  )
>(
  (
    { className, asChild, children, tooltip, active, showTooltipOnCollapsed = true, ...props },
    ref
  ) => {
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"
    
    const commonClassName = cn(
      "group relative flex h-9 w-full cursor-pointer items-center rounded-md px-2 text-sm font-medium transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      active && "bg-slate-700",
      className
    )

    const renderContent = () => {
      if (isCollapsed && tooltip && showTooltipOnCollapsed) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="min-w-[120px]">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )
      }
      return children
    }
    
    if (asChild) {
      // For div elements when using asChild
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          data-sidebar="menu-button"
          data-active={active}
          className={commonClassName}
          {...props as React.HTMLAttributes<HTMLDivElement>}
        >
          {renderContent()}
        </div>
      )
    }
    
    // For button elements (default)
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        data-sidebar="menu-button"
        data-active={active}
        className={commonClassName}
        {...props as React.ButtonHTMLAttributes<HTMLButtonElement>}
      >
        {renderContent()}
      </button>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export const SidebarMenuIcon = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const Component = asChild ? React.Fragment : "div"
  return (
    <Component
      ref={!asChild ? ref : undefined}
      data-sidebar="menu-icon"
      className={cn(
        "mr-2 flex h-5 w-5 shrink-0 items-center justify-center text-white",
        className
      )}
      {...(!asChild && props)}
    >
      {asChild && props.children}
    </Component>
  )
})
SidebarMenuIcon.displayName = "SidebarMenuIcon"

export const SidebarMenuText = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span"> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const { state } = useSidebar()
  const Component = asChild ? React.Fragment : "span"
  
  return (
    <Component
      ref={!asChild ? ref : undefined}
      data-sidebar="menu-text"
      className={cn(
        "truncate transition-all duration-300",
        state === "collapsed" ? "opacity-0 invisible w-0" : "opacity-100 visible w-auto",
        className
      )}
      {...(!asChild && props)}
    >
      {asChild ? props.children : props.children}
    </Component>
  )
})
SidebarMenuText.displayName = "SidebarMenuText"
