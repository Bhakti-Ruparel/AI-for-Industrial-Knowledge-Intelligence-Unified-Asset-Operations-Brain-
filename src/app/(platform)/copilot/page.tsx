"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, Sparkles, FileText, Bot, Clock, Plus, PanelRightOpen, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, Conversation } from "@/types";

const mockConversations: Conversation[] = [
  { id: "1", title: "VMC Machine Selection", lastMessage: "Based on your 800x500x400mm requirement...", timestamp: "2h ago", messageCount: 12 },
  { id: "2", title: "Maintenance Schedule", lastMessage: "The SURFGRIND-600 is overdue...", timestamp: "1d ago", messageCount: 8 },
  { id: "3", title: "ISO Compliance Gaps", lastMessage: "I found 3 critical areas...", timestamp: "2d ago", messageCount: 15 },
  { id: "4", title: "Root Cause Analysis", lastMessage: "The bearing failure pattern...", timestamp: "3d ago", messageCount: 6 },
];

const mockMessages: ChatMessage[] = [
  { 
    id: "1", 
    role: "user", 
    content: "What VMC machine do you recommend for a workpiece of 800x500x400mm in automotive die manufacturing?", 
    timestamp: "2h ago" 
  },
  { 
    id: "2", 
    role: "assistant", 
    content: "Based on your requirements of 800×500×400mm workpiece for automotive die manufacturing, I recommend the **CVM-850** from our CVM Series.\n\n**Why CVM-850:**\n- Travel: 850×500×500mm (covers your requirement with margin)\n- Spindle: 12,000 RPM direct drive\n- Ideal for die & mould applications\n- High rigidity box guideway design\n\nWould you like me to compare it with the DYNAMILL-1200 for a larger workspace option?", 
    timestamp: "2h ago", 
    sources: [
      { id: "1", title: "CVM Series Technical Specifications", type: "document", relevance: 0.96 }, 
      { id: "2", title: "Die & Mould Application Guide", type: "document", relevance: 0.89 }
    ] 
  },
];

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [showSources, setShowSources] = useState(true);
  const [activeChat, setActiveChat] = useState("1");

  const suggestedPrompts = [
    "What machine is best for automotive die manufacturing?",
    "Show me overdue maintenance tasks",
    "Analyze compliance gaps for ISO 9001",
    "Recommend a VMC for 800x500x400mm workpiece",
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: input, timestamp: "Just now" };
    setMessages([...messages, userMsg]);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-140px)] w-full gap-5 p-1 bg-[#f8f9fa]">
      
      {/* 1. History Panel Sidebar */}
      <div className="w-64 shrink-0 rounded-2xl border border-zinc-200/80 bg-white flex flex-col shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 p-4">
          <span className="text-sm font-semibold text-zinc-900">History</span>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors">
            <Plus className="h-4 w-4 text-zinc-600" />
          </button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {mockConversations.map((conv) => {
              const isSelected = conv.id === activeChat;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveChat(conv.id)}
                  className={cn(
                    "w-full rounded-xl p-3 text-left transition-all relative group border border-transparent",
                    isSelected 
                      ? "bg-[#fff5f2] border-[#ffe6df]" 
                      : "hover:bg-zinc-50"
                  )}
                >
                  <p className={cn(
                    "text-xs font-semibold truncate",
                    isSelected ? "text-[#ff6b4a]" : "text-zinc-800"
                  )}>{conv.title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-400 truncate">{conv.lastMessage}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-zinc-400">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px] font-medium">{conv.timestamp}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* 2. Primary Workspace Chat Environment */}
      <div className="flex flex-1 flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
        {/* Workspace Suite Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-[#fff5f2]">
              <Sparkles className="h-4 w-4 text-[#ff6b4a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">AI Copilot</span>
                <Badge variant="outline" className="text-[10px] bg-zinc-50 border-zinc-200 font-normal px-2 py-0.5 text-zinc-500">
                  RAG Powered
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSources(!showSources)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition-all text-zinc-500 hover:bg-zinc-50",
              showSources && "border-zinc-200 bg-zinc-50 text-zinc-800"
            )}
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        </div>

        {/* Messaging Stream Window */}
        <ScrollArea className="flex-1 px-8 py-6 bg-white">
          <div className="space-y-8 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-2">
                {msg.role === "user" ? (
                  /* User Prompt Node */
                  <div className="space-y-1.5 pl-12 text-left max-w-2xl ml-auto">
                    <div className="inline-block rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-2.5 shadow-2xs">
                      <p className="text-xs text-zinc-800 font-normal leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                    <span className="block text-[10px] text-zinc-400 text-right pr-2">{msg.timestamp}</span>
                  </div>
                ) : (
                  /* Assistant Intelligent Response Block */
                  <div className="flex gap-4 items-start w-full max-w-2xl">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#fff5f2] border border-[#ffe6df] mt-0.5 shadow-2xs">
                      <Bot className="h-4 w-4 text-[#ff6b4a]" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="rounded-2xl border border-zinc-200/70 bg-white px-5 py-4 shadow-2xs">
                        <p className="text-xs leading-relaxed text-zinc-800 whitespace-pre-wrap font-normal">
                          {msg.content}
                        </p>
                      </div>
                      <span className="block text-[10px] text-zinc-400 pl-2 pt-0.5">{msg.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Command Box Input Terminal Interface */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 space-y-3">
          {/* Quick Start Injection Badges */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 max-w-3xl mx-auto">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500 hover:border-[#ff6b4a]/40 hover:text-zinc-900 transition-all shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Core Interactive Messaging Input Row */}
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2 max-w-3xl mx-auto shadow-xs focus-within:border-[#ff6b4a]/60 focus-within:ring-2 focus-within:ring-[#ff6b4a]/5 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about machines, maintenance, compliance..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-400 text-zinc-800"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff6b4a] text-white disabled:opacity-30 transition-all hover:bg-[#e05638] shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Right Reference & Sources Sidebar */}
      {showSources && (
        <div className="w-72 shrink-0 rounded-2xl border border-zinc-200/80 bg-white flex flex-col shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-200">
          <div className="border-b border-zinc-100 p-4">
            <span className="text-sm font-semibold text-zinc-900">Sources</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {messages
                .filter((m) => m.sources)
                .flatMap((m) => m.sources || [])
                .map((source) => (
                  <div 
                    key={source.id} 
                    className="group rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-3.5 space-y-2.5 transition-all hover:bg-zinc-50 hover:border-zinc-300"
                  >
                    <div className="flex items-start gap-2.5">
                      <FileText className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5 group-hover:text-zinc-600 transition-colors" />
                      <span className="text-xs font-semibold text-zinc-800 leading-tight">{source.title}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <Badge variant="outline" className="text-[9px] font-medium uppercase tracking-wider px-1.5 bg-white border-zinc-200 text-zinc-500">
                        {source.type}
                      </Badge>
                      <span className="text-[10px] font-semibold text-zinc-400">
                        {Math.round(source.relevance * 100)}% relevant
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}