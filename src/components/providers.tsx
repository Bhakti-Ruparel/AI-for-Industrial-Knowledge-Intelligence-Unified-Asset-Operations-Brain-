"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/auth/auth-provider";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false, retry: 1 },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
