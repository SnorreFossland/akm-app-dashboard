"use client"
import type { LucideIcon } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image";
import Link from "next/link";
import {
  Atom,
  Frame,
  Home,
  BookOpen,
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

  const sidebarRef = useRef<HTMLDivElement>(null)

  const { state, isMobile, setOpen, setOpenMobile, open } = useSidebar()
  const isCollapsed = state === "collapsed"
  const shouldShowText = isMobile ? true : !isCollapsed

  // Outside click handler - simplified
  useEffect(() => {
    if (isMobile || !open) return

    const handleClickOutside = (e: MouseEvent) => {
      const actualSidebar = document.querySelector('[data-sidebar="sidebar"]')
      const target = e.target as Node

      if (actualSidebar && !actualSidebar.contains(target)) {
        setOpen(false)
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobile, setOpen, open])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMobile) setOpenMobile(false)
        else setOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isMobile, setOpen, setOpenMobile])

  return (
    <div ref={sidebarRef} className="relative bg-gray-500"
    >
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
            {shouldShowText && <SidebarGroupLabel className="text-gray-300">Documents</SidebarGroupLabel>}
            <div className="text-white">
              <NavMain
                items={navigationData.navMain}
                searchResults={navigationData.searchResults}
              />
            </div>
          </SidebarGroup>
          <hr className="border-gray-600" />
          <SidebarGroup className="sidebar-group">
            {shouldShowText && <SidebarGroupLabel className="text-gray-300">Mimris Modelling</SidebarGroupLabel>}
            <div className="text-white">
              <NavMain
                items={navigationData.navMimris}
                searchResults={navigationData.searchResults}
              />
            </div>
          </SidebarGroup>
          <hr className="border-gray-600" />
          <SidebarGroup className="sidebar-group">
            {shouldShowText && <SidebarGroupLabel className="text-gray-300">Resources</SidebarGroupLabel>}
            <div className="text-white">
              <NavMain
                items={[
                  {
                    title: "Resources",
                    url: "#",
                    icon: navigationData.navSecondary[0]?.icon || BookOpen,
                    items: navigationData.navSecondary,
                  },
                ]}
                searchResults={navigationData.searchResults}
              />
            </div>
          </SidebarGroup>
          <SidebarContent className="sidebar-content" />
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