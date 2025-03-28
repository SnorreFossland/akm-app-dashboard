import { AppSidebar } from "@/components/app-sidebar"

export default async function Page() {
  const { cookies } = await import("next/headers")
  return (
      <main className="flex flex-1 flex-col p-2 transition-all duration-300 ease-in-out">
      </main>
  )
}
