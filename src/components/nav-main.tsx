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
  forceShowText = false, // Add this prop
}: {
  items: NavigationSection[]
  searchResults: React.ComponentProps<typeof SidebarSearch>["results"]
  forceShowText?: boolean // Add this prop type
} & React.ComponentProps<"ul">) {
  const pathname = usePathname()
  const { state, isMobile } = useSidebar()

  // Use forceShowText prop to override collapsed behavior
  const shouldShowText = forceShowText || isMobile || state !== "collapsed"

  return (
    <SidebarMenu className={cn("grid gap-0.1", className)}>
      {items.map((item) => {
        const isActive = pathname === item.url

        if (!item.items) {
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className={cn("w-full justify-start flex items-center gap-2", isActive && "bg-accent text-accent-foreground")}
              >
                <Link href={item.url} className="flex items-center gap-2">
                  {item.icon && React.createElement(item.icon, { className: "h-5 w-5 flex-shrink-0" })}
                  {shouldShowText && (
                    <span className="nav-item-text" style={forceShowText ? { color: 'white', display: 'block' } : {}}>{item.title}</span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        }

        return (
          <Collapsible key={item.title} asChild>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className={cn("w-full justify-start", isActive && "bg-accent text-accent-foreground")}
                >
                  {item.icon && React.createElement(item.icon, { className: "h-4 w-4 shrink-0" })}
                  {shouldShowText && (
                    <div className="nav-item-text ml-2 line-clamp-1 pr-6" style={forceShowText ? { color: 'white', display: 'block' } : {}}>{item.title}</div>
                  )}
                  <ChevronRight className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90",
                    shouldShowText ? "ml-auto" : "ml-1"
                  )} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu className="ml-4 border-l px-2">
                  {item.items?.map((subItem) => (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton
                        className={cn(pathname === subItem.url && "bg-accent text-accent-foreground")}
                      >
                        <Link href={subItem.url} style={forceShowText ? { color: 'white' } : {}}>
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
        className="w-96 p-0 z-100"
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
