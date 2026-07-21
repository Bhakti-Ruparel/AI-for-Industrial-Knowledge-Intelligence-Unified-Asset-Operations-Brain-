"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendChatMessage, fetchConversations, type ConversationSummary } from "@/services/api/chat";
import { useToast } from "@/components/ui/toast";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { SourcePreviewPanel } from "@/components/copilot/source-preview-panel";
import { Badge } from "@/components/ui/badge";
import {
  Send, Sparkles, FileText, Bot, Clock, Plus,
  PanelRightOpen, Loader2, BookOpen, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, Source } from "@/types";

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  "What are the latest documents uploaded?",
  "Show overdue maintenance tasks",
  "What equipment needs attention?",
  "Check compliance status",
  "Are there any open incidents?",
  "Give me a system overview",
];

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onSourceClick,
  selectedSourceId,
}: {
  msg: ChatMessage;
  onSourceClick: (src: Source) => void;
  selectedSourceId: string | null;
}) {
  const [showSources, setShowSources] = useState(true);
  const isUser = msg.role === "user";
  const sources = msg.sources ?? [];

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF2EB] border border-[#FFD6BE] mt-0.5">
          <Bot className="h-4 w-4 text-[#FF6B2C]" />
        </div>
      )}

      <div className={cn(
        "max-w-[85%] rounded-2xl border px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        isUser ? "bg-zinc-50 border-zinc-200" : "bg-white border-zinc-200"
      )}>
        {/* Author + time */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold text-zinc-500">{isUser ? "You" : "AI Copilot"}</span>
          <span className="text-[10px] text-zinc-300">{msg.timestamp}</span>
        </div>

        {/* Content */}
        <p className="text-[13px] text-zinc-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>

        {/* Sources */}
        {!isUser && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 transition-colors mb-2"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {sources.length} source{sources.length > 1 ? "s" : ""}
              {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showSources && (
              <div className="space-y-2">
                {sources.map((src, idx) => {
                  const isSelected = selectedSourceId === src.id;
                  return (
                    <button
                      key={`${src.id}-${idx}`}
                      onClick={() => onSourceClick(src)}
                      className={cn(
                        "w-full text-left rounded-xl border p-3 transition-all text-[11px]",
                        isSelected
                          ? "border-[#FF6B2C]/40 bg-[#FFF2EB]/50 ring-1 ring-[#FF6B2C]/20"
                          : "border-zinc-100 bg-zinc-50/50 hover:border-zinc-200 hover:bg-zinc-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded border border-zinc-200 bg-white text-[9px] font-bold text-zinc-500">
                            {idx + 1}
                          </span>
                          <FileText className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="font-semibold text-zinc-700 truncate max-w-[200px]">{src.title}</span>
                        </div>
                        <ConfidenceBadge value={src.relevance} />
                      </div>
                      {src.snippet && (
                        <p className="text-zinc-400 line-clamp-2 pl-9">{src.snippet}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-200 mt-0.5">
          <span className="text-[10px] font-bold text-zinc-500">YOU</span>
        </div>
      )}
    </div>
  );
}

// ── Thinking bubble ───────────────────────────────────────────────────────────

function ThinkingBubble() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF2EB] border border-[#FFD6BE] mt-0.5">
        <Bot className="h-4 w-4 text-[#FF6B2C]" />
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B2C] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B2C]" />
          </span>
          <span className="text-[12px] font-medium text-zinc-400">Retrieving sources and generating answer…</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CopilotPage() {
  const [input,          setInput]          = useState("");
  const [messages,       setMessages]       = useState<ChatMessage[]>([]);
  const [showSources,    setShowSources]    = useState(true);
  const [activeChat,     setActiveChat]     = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [conversationId, setConversationId] = useState(() => `conv_${Date.now()}`);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toast      = useToast();
  const queryClient = useQueryClient();

  // Load real conversation history
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn:  fetchConversations,
    staleTime: 30_000,
  });

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      sendChatMessage(message, conversationId, undefined),
    onSuccess: (data) => {
      // Update conversationId from server response (DB-assigned ID)
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }
      const assistantMsg: ChatMessage = {
        id:        data.messageId,
        role:      "assistant",
        content:   data.content,
        timestamp: "Just now",
        sources:   data.sources?.map((s, i) => ({
          id:        s.documentId || String(i),
          title:     s.title,
          type:      "document" as const,
          relevance: s.relevance,
          snippet:   s.chunk,
        })),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Refresh conversation history
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: Error) => {
      toast.error("AI response failed", err.message || "The AI service is unavailable.");
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const startNewConversation = () => {
    setMessages([]);
    setSelectedSource(null);
    setConversationId(`conv_${Date.now()}`);
    setActiveChat(null);
  };

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || chatMutation.isPending) return;

    setMessages((prev) => [...prev, {
      id:        crypto.randomUUID(),
      role:      "user",
      content:   msg,
      timestamp: "Just now",
    }]);
    setInput("");
    setSelectedSource(null);
    chatMutation.mutate(msg);
  };

  // Format relative time
  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const allSources = messages
    .filter((m) => m.sources?.length)
    .flatMap((m) => m.sources ?? []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex flex-1 gap-5 min-h-0 overflow-hidden">

        {/* ── History Sidebar ──────────────────────────────────────────────── */}
        <div className="w-60 shrink-0 rounded-2xl border border-zinc-200 bg-white flex flex-col shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 p-4">
            <span className="text-[13px] font-semibold text-zinc-900">History</span>
            <button
              onClick={startNewConversation}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
              title="New conversation"
            >
              <Plus className="h-3.5 w-3.5 text-zinc-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center px-3">
                  <Bot className="h-6 w-6 text-zinc-200" />
                  <p className="text-[11px] text-zinc-400">No conversations yet. Send a message to start.</p>
                </div>
              ) : (
                conversations.map((conv: ConversationSummary) => {
                  const isSelected = conv.id === activeChat;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveChat(conv.id)}
                      className={cn(
                        "w-full rounded-xl p-3 text-left transition-all border",
                        isSelected ? "bg-[#FFF2EB] border-[#FFD6BE]" : "border-transparent hover:bg-zinc-50"
                      )}
                    >
                      <p className={cn("text-[12px] font-semibold truncate", isSelected ? "text-[#FF6B2C]" : "text-zinc-800")}>
                        {conv.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-400 truncate">{conv.lastMessage}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-zinc-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px]">{timeAgo(conv.timestamp)}</span>
                        {conv.messageCount > 0 && (
                          <span className="ml-auto text-[9px] font-bold text-zinc-300">{conv.messageCount}</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Main Chat ────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-[#FFF2EB]">
                <Sparkles className="h-4 w-4 text-[#FF6B2C]" />
              </div>
              <span className="text-[14px] font-semibold text-zinc-900">AI Copilot</span>
              <Badge variant="outline" className="text-[10px] bg-zinc-50 border-zinc-200 text-zinc-500 font-normal px-2 py-0.5">
                RAG Powered
              </Badge>
            </div>
            <button
              onClick={() => setShowSources((v) => !v)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border transition-all",
                showSources ? "border-zinc-200 bg-zinc-50 text-zinc-700" : "border-transparent text-zinc-400 hover:bg-zinc-50"
              )}
              title={showSources ? "Hide sources" : "Show sources"}
            >
              <PanelRightOpen className="h-4 w-4" />
            </button>
          </div>

          {/* Agent routing info — auto mode */}
          <div className="border-b border-zinc-50 px-5 py-2 flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-zinc-400 font-medium">🤖 Auto-routing — I detect your intent and pick the right agent</span>
          </div>

          {/* Messages — scrollable area */}
          <div className="flex-1 overflow-y-auto px-5 py-5" ref={scrollContainerRef}>
            <div className="space-y-5 max-w-3xl mx-auto">
              {messages.length === 0 && !chatMutation.isPending && (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF2EB]">
                    <Bot className="h-7 w-7 text-[#FF6B2C]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-zinc-800">Ask me anything about your plant</p>
                    <p className="text-[12px] text-zinc-400 mt-1 max-w-xs">
                      Equipment, maintenance, compliance, machine recommendations — powered by your knowledge base.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onSourceClick={(src) => setSelectedSource((prev) => prev?.id === src.id ? null : src)}
                  selectedSourceId={selectedSource?.id ?? null}
                />
              ))}

              {chatMutation.isPending && <ThinkingBubble />}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Source preview panel */}
          {selectedSource && (
            <SourcePreviewPanel
              source={selectedSource}
              onClose={() => setSelectedSource(null)}
            />
          )}

          {/* Input */}
          <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 space-y-2.5 shrink-0">
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 max-w-3xl mx-auto">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[11px] text-zinc-500 hover:border-[#FF6B2C]/40 hover:text-zinc-800 transition-all shadow-xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 max-w-3xl mx-auto shadow-xs focus-within:border-[#FF6B2C]/60 focus-within:ring-2 focus-within:ring-[#FF6B2C]/5 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask about machines, maintenance, compliance…"
                disabled={chatMutation.isPending}
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-zinc-400 text-zinc-800 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || chatMutation.isPending}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B2C] text-white disabled:opacity-30 transition-all hover:bg-[#FF824E] shadow-xs"
              >
                {chatMutation.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Sources Panel ────────────────────────────────────────────────── */}
        {showSources && (
          <div className="w-72 shrink-0 rounded-2xl border border-zinc-200 bg-white flex flex-col shadow-xs overflow-hidden">
            <div className="border-b border-zinc-100 px-4 py-3.5 shrink-0">
              <p className="text-[13px] font-semibold text-zinc-900">Sources</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 space-y-2.5">
                {allSources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <FileText className="h-6 w-6 text-zinc-200" />
                    <p className="text-[11px] text-zinc-400">Sources will appear here after the AI responds.</p>
                  </div>
                ) : (
                  allSources.map((src, i) => {
                    const isSelected = selectedSource?.id === src.id;
                    return (
                      <button
                        key={`${src.id}-${i}`}
                        onClick={() => setSelectedSource((prev) => prev?.id === src.id ? null : src)}
                        className={cn(
                          "w-full text-left rounded-xl border p-3 transition-all",
                          isSelected
                            ? "border-[#FF6B2C]/40 bg-[#FFF2EB]/50 ring-1 ring-[#FF6B2C]/20"
                            : "border-zinc-100 bg-zinc-50/50 hover:border-zinc-200 hover:bg-zinc-50"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-zinc-800 leading-snug truncate">{src.title}</p>
                            {src.snippet && (
                              <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{src.snippet}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pl-6">
                          <Badge variant="outline" className="text-[9px] font-medium px-1.5 bg-white border-zinc-200 text-zinc-500">
                            {src.type}
                          </Badge>
                          <ConfidenceBadge value={src.relevance} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
