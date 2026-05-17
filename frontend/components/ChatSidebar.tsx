"use client";
import * as React from "react";
import { Plus, MessageSquare, Trash2, MoreHorizontal, MessageCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatSession = {
  id: string;
  title: string;
  updated_at: string;
};

export function ChatSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("session_id");
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/chat-sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSessions();
    const handleRefresh = () => fetchSessions();
    window.addEventListener("refresh-chat-sessions", handleRefresh);
    return () => window.removeEventListener("refresh-chat-sessions", handleRefresh);
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat-sessions/${id}`, { method: "DELETE" });
      if (activeSessionId === id) {
        router.push("/chat");
      }
      fetchSessions();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <Sidebar {...props} className={`border-r border-gray-200 bg-gray-50/50 ${props.className || ""}`}>
      <SidebarHeader className="p-4 border-b border-gray-100 h-14 justify-center">
        <div className="flex items-center gap-2 px-1">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-white">
            <MessageCircle className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-gray-900">SiapGrek AI</span>
            <span className="text-xs text-gray-500">Asisten Cerdas</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <div className="px-2 py-2">
            <SidebarMenuButton 
              size="default" 
              className="bg-white border border-gray-200 text-gray-900 shadow-sm hover:bg-gray-100 justify-center font-medium"
              onClick={() => router.push("/chat")}
            >
              <Plus className="size-4 mr-2" />
              Chat Baru
            </SidebarMenuButton>
          </div>
          <SidebarGroupLabel className="mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Riwayat
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <div className="p-4 text-xs text-gray-500 text-center animate-pulse">Memuat...</div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-xs text-gray-400 text-center">Belum ada chat.</div>
              ) : (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      isActive={activeSessionId === session.id}
                      onClick={() => router.push(`/chat?session_id=${session.id}`)}
                      className="group flex justify-between items-center pr-2 py-5"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <MessageSquare className="size-4 shrink-0 text-gray-400 group-data-[active=true]:text-primary" />
                        <span className="truncate text-sm group-data-[active=true]:font-medium group-data-[active=true]:text-primary">
                          {session.title || "Chat tanpa judul"}
                        </span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div
                            role="button"
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 rounded shrink-0 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4 text-gray-500" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer"
                            onClick={(e) => handleDelete(session.id, e as unknown as React.MouseEvent)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
