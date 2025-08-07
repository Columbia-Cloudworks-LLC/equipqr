import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentedProgressProps {
  segments: Array<{
    id: string
    status: 'not_rated' | 'ok' | 'adjusted' | 'recommend_repairs' | 'requires_immediate_repairs' | 'unsafe_condition'
  }>
  className?: string
}

const getSegmentColor = (status: SegmentedProgressProps['segments'][0]['status']) => {
  switch (status) {
    case 'ok':
      return 'bg-green-500'
    case 'adjusted':
      return 'bg-yellow-500'
    case 'recommend_repairs':
      return 'bg-orange-500'
    case 'requires_immediate_repairs':
      return 'bg-red-500'
    case 'unsafe_condition':
      return 'bg-red-700'
    case 'not_rated':
    default:
      return 'bg-muted'
  }
}

const SegmentedProgress = React.forwardRef<
  HTMLDivElement,
  SegmentedProgressProps
>(({ segments, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-md bg-secondary flex",
      className
    )}
  >
    {segments.map((segment, index) => (
      <div
        key={segment.id}
        className={cn(
          "h-full transition-all duration-300",
          getSegmentColor(segment.status),
          index > 0 && "border-l border-background"
        )}
        style={{ 
          width: `${100 / segments.length}%`,
          minWidth: segments.length <= 5 ? '12px' : '8px'
        }}
        title={`Item ${index + 1}: ${segment.status.replace(/_/g, ' ')}`}
      />
    ))}
  </div>
))

SegmentedProgress.displayName = "SegmentedProgress"

export { SegmentedProgress }