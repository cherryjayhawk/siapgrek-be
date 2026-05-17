"use client";

import { FormEvent, useEffect, useRef, useState, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearchParams, useRouter } from "next/navigation";

type ChatMessage = { role: "user" | "assistant"; content: string };

const GREETING_MESSAGE = "Halo, saya **SiapGrek AI** — asisten cerdas untuk sistem monitoring anggrekmu. Saya bisa mengakses data sensor, riwayat penyakit, dan cuaca secara langsung. Silakan tanya apa saja! 😊";

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const initialMessages = (() => {
    if (typeof window !== "undefined") {
      const insight = localStorage.getItem("chatInsight");
      if (insight) {
        localStorage.removeItem("chatInsight");
        return [{ role: "assistant" as const, content: insight }];
      }
    }
    return [{ role: "assistant" as const, content: GREETING_MESSAGE }];
  })();

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (sessionId) {
      // Fetch history
      setLoading(true);
      fetch(`/api/chat-sessions/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.messages) {
            setMessages(data.messages);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setMessages(initialMessages);
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    
    try {
      const apiMessages = newMessages.filter(msg => msg.content !== GREETING_MESSAGE);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: apiMessages,
          session_id: sessionId || undefined 
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "ok" && data.answer) {
        setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
        if (data.session_id && data.session_id !== sessionId) {
          window.dispatchEvent(new Event("refresh-chat-sessions"));
          router.replace(`/chat?session_id=${data.session_id}`);
        }
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.answer || "Maaf, terjadi kesalahan saat merespons." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Maaf, server AI sedang tidak tersedia. Coba lagi nanti." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col min-w-0 bg-white">
      {/* CHAT BOX */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 min-w-0 bg-gray-50/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex min-w-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`
                max-w-[80%] px-3 py-2 rounded-2xl text-xs lg:text-sm leading-relaxed break-words
                ${msg.role === "user"
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm shadow-sm prose prose-sm max-w-none"}
              `}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-200 p-2.5 lg:p-3 flex gap-2 flex-shrink-0 bg-white w-full min-w-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya tentang kondisi tanaman..."
            className="flex-1 min-w-0 w-0 rounded-xl border border-gray-200 px-3 py-2 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex-shrink-0 px-3 lg:px-4 py-2 rounded-xl bg-primary text-white text-xs lg:text-sm font-semibold disabled:opacity-60 transition"
          >
            {loading ? "..." : "Kirim"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div className="p-8">Memuat...</div>}>
      <ChatContent />
    </Suspense>
  );
}