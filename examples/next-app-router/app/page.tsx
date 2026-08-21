import Link from "next/link";
import type { OrdersScenario } from "../src/features/orders/Orders.data";
import { OrdersPanel } from "../src/features/orders/Orders.binding";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const requestedScenario = (await searchParams).scenario;
  const scenario: OrdersScenario =
    requestedScenario === "empty" || requestedScenario === "failed" ? requestedScenario : "success";

  return (
    <main>
      <h1>Branded UI + Next.js</h1>
      <p>The App Router streams an async server Binding through Suspense.</p>
      <nav aria-label="Order data scenarios">
        <Link href="/?scenario=success">Orders</Link>
        {" · "}
        <Link href="/?scenario=empty">Empty</Link>
        {" · "}
        <Link href="/?scenario=failed">Failure</Link>
      </nav>
      <OrdersPanel scenario={scenario} />
    </main>
  );
}
