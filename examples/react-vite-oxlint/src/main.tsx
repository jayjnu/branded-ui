import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "./dashboard/Dashboard.binding";

const queryClient = new QueryClient();
const root = document.getElementById("root");

if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  </StrictMode>,
);
