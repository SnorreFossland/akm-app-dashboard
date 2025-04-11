"use client"

import Image from "next/image";
import Link from "next/link";
import {
  Atom,
  Bird,
  BookOpen,
  Bot,
  Code2,
  Eclipse,
  Frame,
  History,
  LifeBuoy,
  // Link,
  Map,
  PieChart,
  Rabbit,
  Send,
  Settings2,
  SquareTerminal,
  Star,
  Turtle,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
// import { NavProjects } from "@/components/nav-projects"
// import { NavSecondary } from "@/components/nav-secondary"
// import { NavUser } from "@/components/nav-user"
// import { StorageCard } from "@/components/storage-card"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarGroup, SidebarGroupLabel, SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from '@/components/mode-toggle'

const data = {
  teams: [
    {
      name: "AKM Team ",
      logo: Atom,
      plan: "Enterprise",
    },
    {
      name: "OSDU Team",
      logo: Eclipse,
      plan: "Startup",
    },
    {
      name: "Dementia Team",
      logo: Rabbit,
      plan: "Free",
    },
  ],
  user: {
    name: "Modeller",
    email: "home@example.com",
    avatar: "/avatar.png",
  },
  navMain: [
    {
      title: "AKM AI Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "0 AI chat basis",
          url: "/aichat-basis",
          icon: Star,
          description: "Prompt Builder",
        },
        {
          title: "1 Prompt builder",
          url: "/prompt-builder",
          icon: Star,
          description: "Prompt Builder",
        },
        {
          title: "2 Domain Builder",
          url: "/domain-builder",
          icon: Star,
          description: "Domain Builder",
        },
        {
          title: "3 Ontology Builder.",
          url: "/concept-builder",
          icon: Star,
          description: "Concept Knowledge Modelling",
        },
        {
          title: "4 POPS Model Builder.",
          url: "/streaming",
          icon: Star,
          description: "Product, Organisation, Process, System (POPS) Modelling",
        },
        {
          title: "4 IRTV Model Builder",
          url: "/model-builder",
          icon: Star,
          description: "Active Knowledge Modelling with IRTV",
        },
        {
          title: "5 Modelview Builder ",
          url: "/model-universe",
          icon: Star,
          description: "Active Knowledge Modelling with IRTV",
        },
        {
          title: "streaming test",
          url: "/streaming",
          icon: Star,
          description: "Streaming",
        },
        // {
        //   title: "History",
        //   url: "#",
        //   icon: History,
        //   description: "View your recent prompts",
        // },
        // {
        //   title: "Starred",
        //   url: "#",
        //   icon: Star,
        //   description: "Browse your starred prompts",
        // },
        // {
        //   title: "Settings",
        //   url: "#",
        //   icon: Settings2,
        //   description: "Configure your playground",
        // },
      ],
    },
    // {
    //   title: "Models",
    //   url: "#",
    //   icon: Bot,
    //   items: [
    //     {
    //       title: "Genesis",
    //       url: "#",
    //       icon: Rabbit,
    //       description: "Our fastest model for general use cases.",
    //     },
    //     {
    //       title: "Explorer",
    //       url: "#",
    //       icon: Bird,
    //       description: "Performance and speed for efficiency.",
    //     },
    //     {
    //       title: "Quantum",
    //       url: "#",
    //       icon: Turtle,
    //       description: "The most powerful model for complex computations.",
    //     },
    //   ],
    // },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    // {
    //   title: "API",
    //   url: "#",
    //   icon: Code2,
    //   items: [
    // {
    //   title: "Chat",
    //   url: "#",
    // },
    // {
    //   title: "Completion",
    //   url: "#",
    // },
    // {
    //   title: "Images",
    //   url: "#",
    // },
    // {
    //   title: "Video",
    //   url: "#",
    // },
    // {
    //   title: "Speech",
    //   url: "#",
    // },
    //   ],
    // },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
  searchResults: [
    {
      title: "Routing Fundamentals",
      teaser:
        "The skeleton of every application is routing. This page will introduce you to the fundamental concepts of routing for the web and how to handle routing in Next.js.",
      url: "#",
    },
    {
      title: "Layouts and Templates",
      teaser:
        "The special files layout.js and template.js allow you to create UI that is shared between routes. This page will guide you through how and when to use these special files.",
      url: "#",
    },
    {
      title: "Data Fetching, Caching, and Revalidating",
      teaser:
        "Data fetching is a core part of any application. This page goes through how you can fetch, cache, and revalidate data in React and Next.js.",
      url: "#",
    },
    {
      title: "Server and Client Composition Patterns",
      teaser:
        "When building React applications, you will need to consider what parts of your application should be rendered on the server or the client. ",
      url: "#",
    },
    {
      title: "Server Actions and Mutations",
      teaser:
        "Server Actions are asynchronous functions that are executed on the server. They can be used in Server and Client Components to handle form submissions and data mutations in Next.js applications.",
      url: "#",
    },
  ],
}

export function AppSidebar({ ...props }) {
  // console.log("291 AppSidebar", props)
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="sidebar-header mt-1">
        <div className="flex w-full justify-between items-center">
          <TeamSwitcher teams={data.teams} />
        </div>
      </SidebarHeader>
      <SidebarContent className="sidebar-content">
        <SidebarGroup className="sidebar-group">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
              title="AKM Modeller"
            >
              <Atom className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm sidebar-item-content">AKM Modeller</span>
            </Link>
          </div>
        </SidebarGroup>
        <SidebarGroup className="sidebar-group">
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <NavMain items={data.navMain} searchResults={data.searchResults} />
        </SidebarGroup>

        <div className="flex flex-col gap-4">

          {/* <div className="flex flex-col">
            <span className="text-sm font-semibold">Projects</span>
            <div className="flex flex-col space-y-2">
              {data.projects.map((project) => (
                <Link
                  key={project.name}
                  href={project.url}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent"
                >
                  <project.icon className="h-4 w-4" />
                  <span className="text-sm">{project.name}</span>
                </Link>
              ))}
            </div>
          </div> */}
          {/* <div className="flex flex-col">
            <span className="text-sm font-semibold">Storage</span>
            <div className="flex flex-col space-y-2">
              <StorageCard
                title="AKM Storage"
                description="Your active knowledge modelling storage."
                icon={BookOpen}
              />
            </div>
          </div> */}
          <ModeToggle />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Secondary</span>
            <div className="flex flex-col space-y-2">
              {data.navSecondary.map((item) => (
                <Link
                  key={item.title}
                  href={item.url}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="sidebar-footer">
        <div className="flex items-center space-x-2">
          <Image
            src={data.user.avatar}
            alt="User Avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{data.user.name}</span>
            <span className="text-xs text-muted-foreground">
              {data.user.email}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
