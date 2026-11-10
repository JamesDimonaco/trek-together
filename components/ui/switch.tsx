"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    // The button is a 44px tap target on phones; the visible track stays small inside it.
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-6 sm:w-10",
        className
      )}
      {...props}
    >
      <span className="group-data-[state=checked]:bg-primary group-data-[state=unchecked]:bg-input dark:group-data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 items-center rounded-full border border-transparent shadow-xs transition-all">
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(
            "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
          )}
        />
      </span>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
