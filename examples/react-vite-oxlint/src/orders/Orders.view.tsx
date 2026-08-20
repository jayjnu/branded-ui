import { pureUI } from "@jayjnu/branded-ui-react";

export type Order = {
  id: string;
  name: string;
};

export const OrdersView = pureUI((props: { orders: readonly Order[] }) => (
  <ul>
    {props.orders.map((order) => (
      <li key={order.id}>{order.name}</li>
    ))}
  </ul>
));

export const OrdersSkeleton = pureUI(() => <p>Loading orders…</p>);

export const OrdersError = pureUI((props: { message: string }) => (
  <p role="alert">{props.message}</p>
));
