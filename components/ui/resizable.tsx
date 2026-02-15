"use client"

import { GripVerticalIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple resizable panel implementation using CSS flexbox
// This is a fallback since react-resizable-panels has compatibility issues

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical'
}

function ResizablePanelGroup({
  direction = 'horizontal',
  className,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full",
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
      {...props}
    />
  )
}

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

function ResizablePanel({
  defaultSize = 50,
  className,
  style,
  ...props
}: ResizablePanelProps) {
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{ flex: `${defaultSize} 1 0%`, ...style }}
      {...props}
    />
  )
}

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizableHandleProps) {
  return (
    <div
      className={cn(
        "bg-border relative flex w-1 flex-col items-center justify-center cursor-col-resize hover:bg-primary/20 transition-colors",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </div>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
