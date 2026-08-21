export type Order = {
  id: string;
  customer: string;
  total: number;
};

export type OrdersScenario = "success" | "empty" | "failed";

const orders: readonly Order[] = [
  { id: "A-1042", customer: "Ada Lovelace", total: 128 },
  { id: "G-2048", customer: "Grace Hopper", total: 256 },
];

export async function getOrders(scenario: OrdersScenario): Promise<readonly Order[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (scenario === "failed") throw new Error("Orders query failed");
  return scenario === "empty" ? [] : orders;
}
