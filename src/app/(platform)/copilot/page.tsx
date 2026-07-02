"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Send, Sparkles, FileText, Bot, Clock, Plus, PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, Conversation } from "@/types";
import { getSuggestedPrompts } from "@/services/api/chat";

const mockConversations: Conversation[] = [
  { id: "1", title: "VMC Machine Selection", lastMessage: "Based on your 800x500x400mm requirement...", timestamp: "2h ago", messageCount: 12 },
  { id: "2", title: "Maintenance Schedule", lastMessage: "The SURFGRIND-600 is overdue...", timestamp: "1d ago", messageCount: 8 },
  { id: "3", title: "ISO Compliance Gaps", lastMessage: "I found 3 critical areas...", timestamp: "2d ago", messageCount: 15 },
  { id: "4", title: "Root Cause Analysis", lastMessage: "The bearing failure pattern...", timestamp: "3d ago", messageCount: 6 },
];

const mockMessages: ChatMessage[] = [
  { id: "1", role: "user", content: "What VMC machine do you recommend for a workpiece of 800x500x400mm in automotive die manufacturing?", timestamp: "2h ago" },
  { id: "2", role: "assistant", content: "Based on your requirements of 800×500×400mm workpiece for automotive die manufacturing, I recommend the **CVM-850** from our CVM Series.\n\n**Why CVM-850:**\n- Travel: 850×500×500mm (covers your requirement with margin)\n- Spindle: 12,000 RPM direct drive\n- Ideal for die & mould applications\n- High rigidity box guideway design\n\nWould you like me to compare it with the DYNAMILL-1200 for a larger workspace option?", timestamp: "2h ago", sources: [{ id: "1", title: "CVM Series Technical Specifications", type: "document", relevance: 0.96 }, { id: "2", title: "Die & Mould Application Guide", type: "document", relevance: 0.89 }] },
];

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [showSources, setShowSources] = useState(true);

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
    // TODO: Call Flask RAG backend via service
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Conversation History Sidebar */}
      <div className="w-64 shrink-0 rounded-xl border border-border/50 bg-card/50 backdrop-blur flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="text-sm font-medium">History</span>
          <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {mockConversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
              >
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{conv.timestamp}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col rounded-xl border border-border/50 bg-card/50 backdrop-blur">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Copilot</span>
            <Badge variant="secondary" className="text-[10px]">RAG Powered</Badge>
          </div>
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[70%] rounded-xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent/50 border border-border/50"
                )}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <span className="mt-2 block text-[10px] opacity-60">{msg.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Suggested Prompts */}
        {messages.length <= 2 && (
          <div className="flex flex-wrap gap-2 px-6 py-3 border-t border-border/50">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setInput(prompt)}
                className="rounded-full border border-border/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about machines, maintenance, compliance..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sources Panel */}
      {showSources && (
        <div className="w-72 shrink-0 rounded-xl border border-border/50 bg-card/50 backdrop-blur flex flex-col">
          <div className="border-b border-border p-4">
            <span className="text-sm font-medium">Sources</span>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.filter(m => m.sources).flatMap(m => m.sources || []).map((source) => (
                <div key={source.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">{source.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{source.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">
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
