// import Head from "next/head";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReduxProvider } from './providers/ReduxProvider';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";
import { PanelLeft } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Controls loading behavior
})

import { ThemeProvider } from "@/components/theme-provider"
// import { ActiveThemeProvider } from "@/components/active-theme";
import { cookies } from 'next/headers';

import "./globals.css";

export const metadata: Metadata = {
  title: "AKM AI Assisted Modelling App",
  description: "AI assisted Active Knowledge Modelling app",
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
        <meta name="next-size-adjust" content="true" />
      </head>
      <body className={`${inter.className}`}>
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            >
            {/* Set defaultOpen to true if no cookie is found */}
            <SidebarProvider defaultOpen={sidebarState?.value !== "false"}>
              <AppSidebar variant="inset"/>
              <main className="flex flex-1 flex-col p-0 max-h-screen transition-all duration-300 ease-in-out">
                <div className="fixed left-2 z-50 flex items-top gap-2 m-0 p-0">
                  <SidebarTrigger>
                    <PanelLeft className="h-4 w-2" />
                  </SidebarTrigger>
                </div>
                <div className="h-full rounded-md p-0">
                  {children}
                </div>
              </main>
            </SidebarProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}