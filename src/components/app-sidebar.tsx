"use client"
import type { LucideIcon } from "lucide-react"
import { useState } from "react"
import Image from "next/image";
import Link from "next/link";
import {
  Atom,
  Frame,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
  useSidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { ModeToggle } from '@/components/mode-toggle'
import { navigationData } from '@/data/navigationData'

export function AppSidebar({ ...props }) {
  // Use both sidebar state and mobile detection
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"

  // FIXED: On mobile, always show text since it's rendered as a sheet overlay
  // On desktop, show text only when not collapsed
  const shouldShowText = isMobile ? true : !isCollapsed

  return (
    <div className="relative bg-gray-500">
      {/* Mobile: High z-index trigger button */}
      {isMobile && (
        <div className="fixed top-0 left-1 z-[60] w-8 h-8 flex items-center justify-center bg-transparent rounded-md ">
          <SidebarTrigger />
        </div>
      )}

      {/* Desktop: Fixed toggler */}
      {!isMobile && (
        <div className="fixed top-0 left-1 z-30 w-6 h-6 flex flex-row items-center justify-between bg-transparent">
          <SidebarTrigger />
        </div>
      )}

      {/* Sidebar */}
      <div className="">
        <Sidebar collapsible="icon" {...props}>
          <SidebarHeader className="sidebar-header">
            {shouldShowText && (
              <div className="flex w-full justify-right items-center text-xs pl-5 text-white">
                <span className="text-white">AI Assisted Mimris Modelling</span>
                <span className="ml-2 text-sm text-gray-400">Beta</span>
              </div>
            )}
          </SidebarHeader>
          <SidebarGroup className="sidebar-group">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-white hover:text-white">
                  <Link href="/" title="Home" className="flex items-center text-white hover:text-white">
                    <Home className="h-4 w-4 flex-shrink-0 text-white" />
                    {shouldShowText && <span className="ml-2 text-white">Home</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-white hover:text-white">
                  <Link href="/modelling" title="Mimris Modelling" className="flex items-center text-white hover:text-white">
                    <Atom className="h-4 w-4 flex-shrink-0 text-white" />
                    {shouldShowText && <span className="ml-2 text-white">Mimris Modelling</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <hr className="border-gray-600" />
          <SidebarGroup className="sidebar-group">
            {shouldShowText && <SidebarGroupLabel className="text-gray-300">AI Chat</SidebarGroupLabel>}
            <div className="text-white">
              <NavMain items={navigationData.navMain} searchResults={navigationData.searchResults} />
            </div>
          </SidebarGroup>
          <hr className="border-gray-600" />
          <SidebarGroup className="sidebar-group">
            {shouldShowText && <SidebarGroupLabel className="text-gray-300">Mimris Modelling</SidebarGroupLabel>}
            <div className="text-white">
              <NavMain items={navigationData.navMimris} searchResults={navigationData.searchResults} />
            </div>
          </SidebarGroup>
          <SidebarFooter className="sidebar-footer mt-auto">
            <div className="flex items-center justify-left p-2">
              <ModeToggle />
            </div>
          </SidebarFooter>
        </Sidebar>
      </div>
    </div >
  )
}
