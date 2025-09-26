import { SidebarProvider } from "@/components/ui/sidebar";
import { getAllPlaygroundForUser } from "@/modules/dashboard/actions";
import React from "react";
import { DashboardSidebar } from "@/modules/dashboard/components/dashboard-sidebar";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const playgroundData = await getAllPlaygroundForUser();

  const technologyIconMap: Record<string, string> = {
    REACT: "Zap",
    NEXTJS: "Lightbulb",
    EXPRESS: "Database",
    VUE: "Compass",
    HONO: "FlameIcon",
    ANGULAR: "Terminal",
  };
  type PlaygroundItem = {
    Starmark: any;
    id: string;
    title: string;
    template: string;
    // add other properties if needed
  };

  const formatedPlaygroundData = playgroundData?.map((item: PlaygroundItem) => ({
    id: item.id,
    name: item.title,
    starred: item.Starmark[0]?.isMarked || false, 
    icon: technologyIconMap[item.template] || "Code2",
  }));
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden ">
        {/* @ts-ignore */}
        <DashboardSidebar initialPlaygroundData={formatedPlaygroundData} />
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
