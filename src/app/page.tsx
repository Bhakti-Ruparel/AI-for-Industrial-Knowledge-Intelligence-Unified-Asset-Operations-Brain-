"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Sparkles, Bot, FileText, Shield, BarChart3, Network,
  ArrowRight, CheckCircle, Wrench, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  { icon: Bot, title: "AI Copilot", description: "RAG-powered assistant with deep knowledge of your equipment, documents, and regulations." },
  { icon: FileText, title: "Document Intelligence", description: "Upload, OCR, embed, and search across all your industrial documents instantly." },
  { icon: Network, title: "Knowledge Graph", description: "Visualize relationships between equipment, incidents, and compliance data." },
  { icon: Shield, title: "Compliance Tracker", description: "Stay ahead of Factory Act, ISO, PESO, and OISD audits with AI monitoring." },
  { icon: BarChart3, title: "Analytics Dashboard", description: "Real-time KPIs, equipment health, and predictive maintenance insights." },
  { icon: Sparkles, title: "AI Agents", description: "Specialized agents for maintenance prediction, RCA, and compliance gap analysis." },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-[#F3F4F6]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B2C] to-[#FF824E]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold text-[#111827]">PlantMind AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-[13px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard" className="rounded-2xl bg-[#111827] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#374151] active:scale-[0.98]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_#FFF2EB_0%,_transparent_70%)]" />
        <div className={cn("relative z-10 text-center px-6 max-w-4xl mx-auto transition-all duration-700", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5")}>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF2EB] px-4 py-2 text-[12px] font-semibold text-[#FF6B2C] mb-8">
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered Industrial Intelligence
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-[#111827] sm:text-6xl lg:text-7xl leading-[1.1]">
            Industrial Knowledge
            <br />
            <span className="bg-gradient-to-r from-[#FF6B2C] to-[#FF824E] bg-clip-text text-transparent">Intelligence Platform</span>
          </h1>

          <p className="mt-6 text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
            Transform your CNC operations with AI-powered copilot, predictive maintenance,
            compliance monitoring, and document intelligence.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 rounded-2xl bg-[#FF6B2C] px-7 py-3.5 text-[14px] font-semibold text-white shadow-lg shadow-[#FF6B2C]/20 transition-all hover:bg-[#FF824E] hover:shadow-xl hover:shadow-[#FF6B2C]/30 active:scale-[0.98]">
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/copilot" className="flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-7 py-3.5 text-[14px] font-semibold text-[#111827] shadow-sm transition-all hover:shadow-md hover:border-[#D1D5DB] active:scale-[0.98]">
              <Bot className="h-4 w-4" /> Try AI Copilot
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-[13px] text-[#6B7280]">
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#22C55E]" /> RAG Powered</span>
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#22C55E]" /> ISO Compliant</span>
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#22C55E]" /> Real-time Analytics</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-[#FAFAFA]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#111827]">Everything you need</h2>
            <p className="mt-3 text-[15px] text-[#6B7280]">One platform for all your industrial AI needs.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={cn(
                  "group rounded-[20px] bg-white p-7 border border-[#F3F4F6] transition-all duration-500 hover:shadow-lg hover:-translate-y-1 hover:border-[#FFEDD5]",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                )}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF2EB] transition-colors group-hover:bg-[#FF6B2C]">
                  <feature.icon className="h-5 w-5 text-[#FF6B2C] transition-colors group-hover:text-white" />
                </div>
                <h3 className="mt-5 text-[15px] font-semibold text-[#111827]">{feature.title}</h3>
                <p className="mt-2 text-[13px] text-[#6B7280] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#F3F4F6] py-8 px-6 bg-white">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF6B2C]" />
            <span className="text-[12px] text-[#9CA3AF]">PlantMind AI © 2026</span>
          </div>
          <div className="flex gap-6 text-[12px] text-[#9CA3AF]">
            <span className="hover:text-[#6B7280] cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-[#6B7280] cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-[#6B7280] cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
