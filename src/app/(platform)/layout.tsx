"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { TopNav } from "@/components/navbar/top-nav";
import { CommandPalette } from "@/components/command-palette";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AppSidebar />
      <CommandPalette />
      <main className="ml-[280px]">
        <TopNav />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
