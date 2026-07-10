"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/hooks/use-store";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard, MessageSquare, FileText, Network, Wrench,
  Calendar, AlertTriangle, Shield, BarChart3, Bot, Bell, Settings,
} from "lucide-react";
import { useEffect } from "react";

const commands = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Copilot", href: "/copilot", icon: MessageSquare },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Knowledge Graph", href: "/knowledge-graph", icon: Network },
  { name: "Equipment", href: "/equipment", icon: Wrench },
  { name: "Maintenance", href: "/maintenance", icon: Calendar },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle },
  { name: "Compliance", href: "/compliance", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "AI Agents", href: "/agents", icon: Bot },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandOpen, setCommandOpen } = useStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandOpen, setCommandOpen]);

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search pages, equipment, documents..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {commands.map((cmd) => (
            <CommandItem
              key={cmd.href}
              onSelect={() => { router.push(cmd.href); setCommandOpen(false); }}
              className="rounded-xl"
            >
              <cmd.icon className="mr-3 h-4 w-4 text-[#6B7280]" />
              <span className="text-[13px]">{cmd.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
