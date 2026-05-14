"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const initialMessages = (() => {
    if (typeof window !== "undefined") {
      const insight = localStorage.getItem("chatInsight");
      if (insight) {
        localStorage.removeItem("chatInsight");
        return [{ role: "assistant" as const, content: insight }];
      }
    }
    return [{ role: "assistant" as const, content: "Halo, saya asisten SIAPGrek. Silakan tanya apa saja seputar sistem monitoring ini 😊" }];
  })();

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const newMessage: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, data?.reply ?? { role: "assistant", content: "Maaf, terjadi kesalahan." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Maaf, server chat sedang bermasalah." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-3 min-w-0">

      {/* TITLE */}
      <div className="flex-shrink-0">
        <h1 className="text-base lg:text-xl font-bold text-gray-800">Chat AI</h1>
        <p className="text-xs lg:text-sm text-gray-500">Asisten AI untuk sistem SIAPGrek</p>
      </div>

      {/* CHAT BOX */}
      <div className="flex-1 bg-gray-50 rounded-2xl flex flex-col min-h-0 min-w-0 overflow-hidden border border-gray-100">

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2.5 min-w-0">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex min-w-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`
                max-w-[80%] px-3 py-2 rounded-2xl text-xs lg:text-sm leading-relaxed break-words
                ${msg.role === "user"
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm shadow-sm"}
              `}>
                {msg.content}
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

        {/* INPUT — kunci: w-full + min-w-0 + box-border */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-200 p-2.5 lg:p-3 flex gap-2 flex-shrink-0 bg-white w-full min-w-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan..."
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