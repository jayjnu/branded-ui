import type { ComponentProps } from "react";
import type { AsyncUISet, Binding } from "@jayjnu/branded-ui";
import { asyncUI, binding, layoutUI, pureUI } from "@jayjnu/branded-ui-react";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;
type Assert<Value extends true> = Value;

const OrdersView = pureUI((props: { orderId: string }) => (
  <div>{props.orderId}</div>
));
const OrdersLayout = layoutUI((props: { children?: React.ReactNode }) => (
  <main>{props.children}</main>
));
const OrdersSkeleton = pureUI(() => <div>Loading</div>);
const OrdersError = pureUI((props: { message: string }) => (
  <div>{props.message}</div>
));

const OrdersUI = asyncUI({
  layout: OrdersLayout,
  component: OrdersView,
  skeleton: OrdersSkeleton,
  error: OrdersError,
});

binding({
  ui: OrdersUI,
  component: (props: { orderId: string }) => <OrdersView {...props} />,
});

type _PropsArePreserved = Assert<
  Equal<ComponentProps<typeof OrdersView>, { orderId: string }>
>;

const RawComponent = () => <div>Raw</div>;

// @ts-expect-error raw components are not AsyncUISet contracts
const _rawSet: AsyncUISet = {
  layout: OrdersLayout,
  component: OrdersView,
  skeleton: OrdersSkeleton,
};

// @ts-expect-error raw components cannot fill a branded PureUI slot
asyncUI({ layout: OrdersLayout, component: RawComponent, skeleton: OrdersSkeleton });

// @ts-expect-error raw components cannot fill a branded LayoutUI slot
asyncUI({ layout: RawComponent, component: OrdersView, skeleton: OrdersSkeleton });

// @ts-expect-error raw components cannot fill a branded skeleton slot
asyncUI({ layout: OrdersLayout, component: OrdersView, skeleton: RawComponent });

// @ts-expect-error PureUI and Binding are distinct roles
const _binding: Binding = OrdersView;

// @ts-expect-error binding cannot redeclare a PureUI as a Binding
binding({ ui: OrdersUI, component: OrdersView });
