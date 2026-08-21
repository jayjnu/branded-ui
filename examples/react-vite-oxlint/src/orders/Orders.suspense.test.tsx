import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vite-plus/test";
import { DashboardPage } from "../dashboard/Dashboard.binding";

const container = document.createElement("div");
const root = createRoot(container);

afterEach(async () => {
  await act(() => root.render(null));
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("moves query pending and errors through Suspense and ErrorBoundary", async () => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  await act(() =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    ),
  );
  expect(container.textContent).toContain("Loading orders");

  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(container.textContent).toContain("Starter plan");

  const errorButton = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === "Load query error",
  );
  await act(() => errorButton?.click());
  expect(container.textContent).toContain("Loading orders");

  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(container.textContent).toContain("Could not load orders");
});
