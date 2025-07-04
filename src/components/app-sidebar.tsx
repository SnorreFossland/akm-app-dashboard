"use client"
import { useState } from "react"
import Image from "next/image";
import Link from "next/link";
import {
  Atom,
  Frame,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarGroup, SidebarGroupLabel, SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from '@/components/mode-toggle'
import { navigationData } from '@/data/navigationData'

export function AppSidebar({ ...props }) {
  // console.log("291 AppSidebar", props)
  const [isCollapsed, setIsCollapsed] = useState(false); // Replace with your actual logic

  // Toggle handler for the sidebar trigger
  const handleToggleSidebar = () => setIsCollapsed((prev) => !prev);

  return (
    <div className="relative">
      {/* Fixed topbar, only as wide as the sidebar */}
      <div className="fixed top-0 left-0 z-30 w-6 h-6 flex flex-row items-center justify-between bg-transparent">
        <SidebarTrigger onClick={handleToggleSidebar} />
        {/* {!isCollapsed && <ModeToggle />} */}
      </div>
      {/* Sidebar with top padding to avoid overlap */}
      <div className="pl-6 pt-12">
        <Sidebar {...props}>
          <SidebarHeader className="sidebar-header mt-1">
            {/* <div className="flex w-full justify-between items-center">
          <TeamSwitcher teams={navigationData.teams} />
        </div> */}
          </SidebarHeader>
          <SidebarContent className="sidebar-content">
            <SidebarGroup className="sidebar-group">
              <SidebarGroupLabel>AI Chat</SidebarGroupLabel>
              <NavMain items={navigationData.navMain} searchResults={navigationData.searchResults} />
            </SidebarGroup>
            <SidebarGroup className="sidebar-group">
              <SidebarGroupLabel>Mimris Modelling</SidebarGroupLabel>
              <NavMain items={navigationData.navMimris} searchResults={navigationData.searchResults} />
            </SidebarGroup>
            <SidebarGroup className="sidebar-group">
              <SidebarGroupLabel>Mimris Modelling</SidebarGroupLabel>
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-accent"
                  title="Home"
                >
                  <Frame className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm sidebar-item-content">Home</span>
                </Link>
                <Link
                  href="/modelling"
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-accent"
                  title="Mimris Modelling"
                >
                  <Atom className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm sidebar-item-content">Mimris Modelling</span>
                </Link>
              </div>
            </SidebarGroup>

            <div className="flex flex-col gap-4">
              <ModeToggle />
            </div>
          </SidebarContent>

          <SidebarFooter className="sidebar-footer">
            <div className="flex items-center space-x-2">
              <ModeToggle />
            </div>
          </SidebarFooter>
        </Sidebar>
      </div>
    </div >
  )
}
