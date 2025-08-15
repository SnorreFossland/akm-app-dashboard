"use client"

import React from "react"
import Link from "next/link"
import { ChevronRight, Search, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"

interface NavigationItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

interface NavigationSection {
  title: string
  url: string
  icon: LucideIcon
  items?: NavigationItem[]
}

export function NavMain({
  className,
  items,
  searchResults,
  forceShowText = false,
}: {
  items: NavigationSection[]
  searchResults: React.ComponentProps<typeof SidebarSearch>["results"]
  forceShowText?: boolean
} & React.ComponentProps<"ul">) {
  const pathname = usePathname()
  const { state, isMobile, setOpen } = useSidebar() // Add setOpen

  // Track which collapsibles are open
  const [openCollapsibles, setOpenCollapsibles] = React.useState<Set<string>>(new Set())

  // Use forceShowText prop to override collapsed behavior
  const shouldShowText = forceShowText || isMobile || state !== "collapsed"

  // Close all collapsibles when sidebar collapses
  React.useEffect(() => {
    if (state === "collapsed") {
      setOpenCollapsibles(new Set())
    }
  }, [state])

  const toggleCollapsible = (itemTitle: string) => {
    setOpenCollapsibles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemTitle)) {
        newSet.delete(itemTitle)
      } else {
        newSet.add(itemTitle)
        // Auto-expand sidebar when opening a collapsible
        if (!isMobile && state === "collapsed") {
          setOpen(true)
        }
      }
      return newSet
    })
  }

  return (
    <div className="sticky top-0 z-[99] w-full bg-gray-900 text-foreground isolate">
      <SidebarMenu className={cn("grid gap-0.1", className)}>
        {items.map((item) => {
          const isActive = pathname === item.url
          const isOpen = openCollapsibles.has(item.title)

          if (!item.items) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  className={cn(
                    "w-full justify-start flex items-center gap-2 px-2 py-1.5 text-sm font-medium",
                    "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1", // Center and reduce padding when collapsed
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <Link href={item.url} className={cn(
                    "flex items-center gap-2 min-w-0",
                    "group-data-[collapsible=icon]:justify-center" // Center the link content when collapsed
                  )}>
                    {item.icon && React.createElement(item.icon, {
                      className: cn(
                        "h-5 w-5 flex-shrink-0",
                        "group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" // Smaller icon when collapsed
                      )
                    })}
                    {shouldShowText && (
                      <span
                        className="nav-item-text flex-1 min-w-0 truncate"
                        style={forceShowText ? { color: 'white', display: 'block' } : {}}
                      >
                        {item.title}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleCollapsible(item.title)}>
              <SidebarMenuItem className="group bg-gray-800">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className={cn(
                      "w-full justify-center group-data-[collapsible=icon]:justify-center", // Center when collapsed
                      "group-data-[collapsible=icon]:px-1", // Explicit padding when collapsed
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    {/* For collapsed state, wrap in a container */}
                    <div className={cn(
                      "flex items-center"
                    )}>
                      {item.icon && React.createElement(item.icon, {
                        className: cn(
                          "h-4 w-4 shrink-0"
                        )
                      })}
                      {shouldShowText && (
                        <div
                          className="nav-item-text ml-1 flex-1 min-w-0 truncate"
                          style={forceShowText ? { color: 'white', display: 'block' } : {}}
                        >
                          {item.title}
                        </div>
                      )}
                      {shouldShowText && (
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 bg-transparent shrink-0 transition-transform duration-200",
                            isOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      )}
                    </div>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu className="ml-4 border-l px-2">
                    {item.items?.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          className={cn(
                            "justify-start overflow-hidden",
                            pathname === subItem.url && "bg-accent text-accent-foreground"
                          )}
                        >
                          <Link
                            href={subItem.url}
                            className="block w-full min-w-0 truncate"
                            style={forceShowText ? { color: 'white' } : {}}
                          >
                            {subItem.title}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </div>
  )
}
function SidebarSearch({
  results,
}: {
  results: {
    title: string
    teaser: string
    url: string
  }[]
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger className="min-w-8 flex h-8 w-full flex-1 items-center gap-2 overflow-hidden rounded-md px-1.5 text-sm font-medium outline-none ring-ring transition-all hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
          <Search className="h-4 w-4 shrink-0" />
          <div className="flex flex-1 overflow-hidden">
            <div className="line-clamp-1 pr-1">Search</div>
          </div>
        </DrawerTrigger>
        <DrawerContent>
          <form>
            <div className="border-b p-2.5">
              <Input
                type="search"
                placeholder="Search..."
                className="h-8 rounded-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </form>
          <div className="grid gap-1 p-1.5 text-sm">
            {results.map((result) => (
              <Link
                href={result.url}
                key={result.title}
                className="rounded-md p-2.5 outline-none ring-ring hover:bg-accent hover:text-accent-foreground focus-visible:ring-2"
              >
                <div className="font-medium">{result.title}</div>
                <div className="line-clamp-2 text-muted-foreground">
                  {result.teaser}
                </div>
              </Link>
            ))}
            <Separator className="my-1.5" />
            <Link
              href="#"
              className="rounded-md px-2.5 py-1 text-muted-foreground outline-none ring-ring hover:text-foreground focus-visible:ring-2"
            >
              See all results
            </Link>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover>
      <PopoverTrigger className="min-w-8 flex h-8 w-full flex-1 items-center gap-2 overflow-hidden rounded-md px-1.5 text-sm font-medium outline-none ring-ring transition-all hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
        <Search className="h-4 w-4 shrink-0" />
        <div className="flex flex-1 overflow-hidden">
          <div className="line-clamp-1 pr-6">Search</div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={0}
        className="w-96 p-0 z-[220]"
      >
        <form>
          <div className="border-b p-2.5">
            <Input
              type="search"
              placeholder="Search..."
              className="h-8 rounded-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </form>
        <div className="grid gap-1 p-1 text-sm bg-gray-800 rounded">
          {results.map((result) => (
            <Link
              href={result.url}
              key={result.title}
              className="rounded-md p-1 outline-none ring-ring bg-red-400 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2"
            >
              <div className="font-medium">{result.title}</div>
              <div className="line-clamp-2 text-muted-foreground">
                {result.teaser}
              </div>
            </Link>
          ))}
          <Separator className="my-1.5" />
          <Link
            href="#"
            className="rounded-md px-1.5 py-1 text-muted-foreground outline-none ring-ring hover:text-foreground focus-visible:ring-2"
          >
            See all results
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
