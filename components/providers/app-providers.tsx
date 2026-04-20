"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { useAuthStore } from "@/store/auth-store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void Promise.resolve(useAuthStore.persist.rehydrate()).finally(() => {
      useAuthStore.getState().setHydrated(true);
    });
  }, []);

  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
        <Toaster
          theme="system"
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "backdrop-blur-xl border border-slate-300/60 bg-white/95 text-slate-900 dark:border-white/10 dark:bg-[#0B1F3A]/90 dark:text-white",
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
