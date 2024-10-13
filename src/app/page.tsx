import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { FeatureAComponent } from '@/features';
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <>
      <header className="flex items-center p-2 m-0 bg-gray-800 text-white shadow-md z-10 fixed w-full">
        <h1 className="ml-4 text-xl">AKM App</h1>
      </header>
      <div className="pt-16"> {/* Add padding to avoid overlap with fixed header */}
        <Tabs defaultValue="akm-project" className="w-full">
          <TabsList>
            <TabsTrigger value="akm-project">AKM Projects</TabsTrigger>
            <TabsTrigger value="akm-objects">Objects</TabsTrigger>
          </TabsList>
            <TabsContent value="akm-project" className="w-full">
            <div className="flex gap-4 items-center flex-col sm:flex-row w-full">
              <main className="flex flex-col gap-8 row-start-4 items-center sm:items-start w-full">
              <Card className="w-full">
                <FeatureAComponent />
              </Card>
              </main>
            </div>
            </TabsContent>
          <TabsContent value="akm-objects" className="w-full">
            <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
              <main className="flex flex-col gap-2 row-start-2 items-center sm:items-start">
                <Link href="/login">
                  <Button>Login</Button>
                </Link>
                {/* <Image
                  className="dark:invert"
                  src="https://nextjs.org/icons/next.svg"
                  alt="Next.js logo"
                  width={180}
                  height={38}
                  priority
                /> */}
                <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
                  <li className="mb-2">
                    Get started by editing{" "}
                    <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
                      src/app/page.tsx
                    </code>
                  </li>
                  <li>Save and see your changes instantly.</li>
                </ol>
              </main>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}