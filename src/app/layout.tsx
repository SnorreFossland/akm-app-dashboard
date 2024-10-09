import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReduxProvider } from './providers/ReduxProvider';

// import { AppTopMenu } from "@/components/app-topmenu";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarLayout, SidebarTrigger } from "@/components/ui/sidebar";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AKM AI Assisted Modelling App",
  description: "AI assisted Active Knowledge Modelling app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { cookies } = await import("next/headers");
  return (
    <html lang="en">
      <body className={`${inter.className} dark`}>
        <ReduxProvider>
          {/* <AppTopMenu /> */}
          <SidebarLayout
            defaultOpen={cookies().get("sidebar:state")?.value === "true"}
          >
            <SidebarTrigger className="fixed top-0 left-50 z-1 text-red-500" />
            <AppSidebar />
            <main className="flex flex-1 flex-col p-0 transition-all duration-300 ease-in-out">
              <div className="h-full rounded-md border-2 border-dashed p-0">
                {children}
              </div>
            </main>
          </SidebarLayout>
        </ReduxProvider>
      </body>
    </html>
  );
}
