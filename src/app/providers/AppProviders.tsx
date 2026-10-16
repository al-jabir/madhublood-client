import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { qc } from "@/lib/query-client";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </ErrorBoundary>
  );
}
