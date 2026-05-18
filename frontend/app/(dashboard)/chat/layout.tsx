"use client";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="relative h-full w-full !min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <Suspense fallback={<div className="w-64 h-full bg-gray-50 border-r border-gray-200 animate-pulse" />}>
        <ChatSidebar className="!absolute !h-full z-10" />
      </Suspense>
      <SidebarInset className="bg-transparent overflow-hidden flex flex-col h-full min-h-0 min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-100 px-4 bg-white/50 backdrop-blur-sm z-20">
          <SidebarTrigger className="-ml-1 text-gray-500 hover:text-gray-900" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 font-medium text-sm text-gray-800">
            Riwayat Chat
          </div>
        </header>
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
