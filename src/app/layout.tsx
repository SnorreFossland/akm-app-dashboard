// import Head from "next/head";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ReduxProvider from '../providers/ReduxProvider';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";
import { PanelLeft } from 'lucide-react';

import { AppHeader } from "@/components/AppHeader";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Controls loading behavior
})

import { ThemeProvider } from "@/components/theme-provider"
// import { ActiveThemeProvider } from "@/components/active-theme";
import { cookies } from 'next/headers';

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Assisted Mimris Modelling",
  description: "AI assisted Mimris Modelling app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar:state");

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* This helps Next.js better understand how to handle the preloaded resources */}
        {/* <meta name="next-size-adjust" content="true" /> */}
        {/* <meta name="viewport" content="width=device-width, initial-scale=1" /> */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.2"></meta>
      </head>
      <body className={`${inter.className}  overflow-hidden bg-background text-foreground antialiased`}>
        {/* <body className={`${inter.className}  overflow-hidden bg-background text-foreground antialiased`}> */}
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            {/* Set defaultOpen to true if no cookie is found */}
            <SidebarProvider defaultOpen={false}>
              {/* <SidebarProvider defaultOpen={sidebarState?.value !== "false"}> */}
              <AppSidebar />
              <main className="flex-1 flex flex-col overflow-auto">
                {/* <AppHeader /> */}
                {children}
              </main>
            </SidebarProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}