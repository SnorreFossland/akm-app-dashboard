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
  // Use the actual sidebar state instead of local state
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div className="relative bg-gray-500">
      {/* Fixed toggler */}
      <div className="fixed top-0 left-0 z-30 w-6 h-6 flex flex-row items-center justify-between bg-transparent">
        <SidebarTrigger />
      </div>
      {/* Sidebar */}
      <div className="">
        <Sidebar collapsible="icon" {...props}>
          <SidebarHeader className="sidebar-header">
            {!isCollapsed && (
              <div className="flex w-full justify-right items-center text-xs pl-5">
                <span>AI Assisted Mimris Modelling</span>
                <span className="ml-2 text-sm text-gray-400">Beta</span>
              </div>
            )}
          </SidebarHeader>
          <SidebarGroup className="sidebar-group">
            {/* {!isCollapsed && <SidebarGroupLabel>Additional Links</SidebarGroupLabel>} */}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Link href="/" title="Home" className="flex items-center justify-center">
                    <Home className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-2">Home</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Link href="/modelling" title="Mimris Modelling" className="flex items-center justify-center">
                    <Atom className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-2">Mimris Modelling</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarContent className="sidebar-content">
            <SidebarGroup className="sidebar-group">
              {!isCollapsed && <SidebarGroupLabel>AI Chat</SidebarGroupLabel>}
              <NavMain items={navigationData.navMain} searchResults={navigationData.searchResults} />
            </SidebarGroup>
            <SidebarGroup className="sidebar-group">
              {!isCollapsed && <SidebarGroupLabel>Mimris Modelling</SidebarGroupLabel>}
              <NavMain items={navigationData.navMimris} searchResults={navigationData.searchResults} />
            </SidebarGroup>


            {!isCollapsed && (
              <div className="flex flex-col gap-4 px-4">
                <ModeToggle />
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="sidebar-footer">
            {!isCollapsed && (
              <div className="flex items-center space-x-2 px-4">
                <ModeToggle />
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
      </div>
    </div >
  )
}
