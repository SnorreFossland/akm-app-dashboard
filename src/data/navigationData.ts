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
    Map,
    PieChart,
    Rabbit,
    Send,
    Settings2,
    SquareTerminal,
    Star,
    Turtle,
} from "lucide-react"
import { LucideIcon } from "lucide-react"

export interface NavigationItem {
    title: string
    url: string
    icon?: LucideIcon
    description?: string
    items?: NavigationItem[]
}

export interface NavigationSection {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: NavigationItem[]
}

export interface Team {
    name: string
    logo: LucideIcon
    plan: string
}

export interface User {
    name: string
    email: string
    avatar: string
}

export interface Project {
    name: string
    url: string
    icon: LucideIcon
}

export interface SearchResult {
    title: string
    teaser: string
    url: string
}

export interface NavigationData {
    teams: Team[]
    user: User
    navMimris: NavigationSection[]
    navMain: NavigationSection[]
    navSecondary: NavigationItem[]
    projects: Project[]
    searchResults: SearchResult[]
}

export const navigationData: NavigationData = {
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
    navMimris: [
        {
            title: "AI Assisted Modelling",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "Domain Builder",
                    url: "/domain-builder",
                    icon: Star,
                    description: "Domain Scoping and Definition",
                },
                {
                    title: "Ontology Builder.",
                    url: "/ontology-builder",
                    icon: Star,
                    description: "Ontology Modelling",
                },
                {
                    title: "4 POPS Model Builder.",
                    url: "/",
                    icon: Star,
                    description: "Product, Organisation, Process, System (POPS) Modelling",
                },
                {
                    title: "5 IRTV Model Builder",
                    url: "/IRTV-builder",
                    icon: Star,
                    description: "Active Knowledge Modelling with IRTV",
                },
                {
                    title: "4 META Model Builder.",
                    url: "/model-builder",
                    icon: Star,
                    description: "Product, Organisation, Process, System (POPS) Modelling",
                },
            ]
        }
    ],
    navMain: [
        {
            title: "AI Chat Playground",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "0 AI Chat Basic",
                    url: "/ai-chat",
                    icon: Star,
                    description: "Basic AI Chat with templates",
                },
                {
                    title: "1 Prompt Builder",
                    url: "/prompt-builder",
                    icon: Star,
                    description: "Prompt Builder",
                },
            ]
        }
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

// Helper function to get current menu item description
export function getCurrentMenuItemDescription(pathname: string): string {
    // Search through all navigation items to find the matching URL
    const allItems = [
        ...navigationData.navMimris.flatMap(section => section.items || []),
        ...navigationData.navMain.flatMap(section => section.items || [])
    ];

    const currentItem = allItems.find(item => item.url === pathname);
    return currentItem?.description || '';
}