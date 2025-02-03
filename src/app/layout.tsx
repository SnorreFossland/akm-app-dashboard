import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReduxProvider } from './providers/ReduxProvider';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarLayout, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from '@/components/mode-toggle'
import { cookies } from 'next/headers';


import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AKM AI Assisted Modelling App",
  description: "AI assisted Active Knowledge Modelling app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="dark">
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <SidebarLayout
            defaultOpen={cookies().get("sidebar:state")?.value === "true"}
          >
            <SidebarTrigger className="fixed z-1 text-gray-500" />
            {/* <ModeToggle className="fixed z-1 text-gray-500" /> */}
            <AppSidebar />
            <main className="flex flex-1 flex-col p-0 max-h-screen transition-all duration-300 ease-in-out">
              <div className="h-full rounded-md border-2 border-dashed p-0">
                {children}
              </div>
            </main>
          </SidebarLayout>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}