import type { ComponentProps, ReactNode } from "react";
import type {
  AsyncUISet,
  Binding,
  LayoutSlots,
  LayoutUI,
  PureUI,
} from "@jayjnu/branded-ui";
import { asyncUI, binding, layoutUI, pureUI } from "@jayjnu/branded-ui-react";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;
type Assert<Value extends true> = Value;

type OrdersLayoutProps = {
  header: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
  density?: "compact" | "normal";
};

const OrdersLayoutComponent = (props: OrdersLayoutProps) => (
  <main>
    <header>{props.header}</header>
    <section>{props.content}</section>
    <footer>{props.footer}</footer>
  </main>
);

const OrdersLayout = layoutUI({
  component: OrdersLayoutComponent,
  slots: ["header", "content", "footer"],
});

const OrdersFallbackLayout = layoutUI({
  component: (props: { content: ReactNode; action: ReactNode }) => (
    <main>
      {props.content}
      {props.action}
    </main>
  ),
  slots: ["content", "action"],
});

const OrdersUI = asyncUI({
  layout: OrdersLayout,
  states: {
    success: {
      header: {
        Toolbar: () => <nav />,
      },
      content: {
        List: (props: { orderId: string }) => <div>{props.orderId}</div>,
      },
      footer: {
        Pagination: () => <nav />,
      },
    },
    empty: {
      header: {
        Toolbar: () => <nav />,
      },
      content: {
        Message: () => <p>No orders</p>,
      },
    },
    pending: {
      header: {
        Title: () => <h1>Orders</h1>,
      },
      content: {
        Skeleton: () => <p>Loading</p>,
      },
    },
    failed: {
      header: {
        Title: () => <h1>Orders</h1>,
      },
      content: {
        Message: (props: { message: string }) => <p>{props.message}</p>,
        Retry: (props: { onRetry: () => void }) => (
          <button onClick={props.onRetry}>Retry</button>
        ),
      },
    },
  },
  fallback: {
    layout: OrdersFallbackLayout,
    slots: {
      content: {
        Message: (props: { message: string }) => <p>{props.message}</p>,
      },
      action: {
        Reset: (props: { onReset: () => void }) => (
          <button onClick={props.onReset}>Reset</button>
        ),
      },
    },
  },
});

const OrdersPage = binding(OrdersUI)(
  ({ Layout, Success, Empty, Pending, Failed, Fallback }) => {
    type _LayoutIsInjected = Assert<
      Equal<typeof Layout, typeof OrdersUI.layout.component>
    >;
    type _SuccessIsInjected = Assert<
      Equal<typeof Success, typeof OrdersUI.states.success>
    >;
    type _EmptyIsInjected = Assert<
      Equal<typeof Empty, typeof OrdersUI.states.empty>
    >;
    type _PendingIsInjected = Assert<
      Equal<typeof Pending, typeof OrdersUI.states.pending>
    >;
    type _FailedIsInjected = Assert<
      Equal<typeof Failed, typeof OrdersUI.states.failed>
    >;
    type _FallbackLayoutIsInjected = Assert<
      Equal<typeof Fallback.Layout, typeof OrdersFallbackLayout.component>
    >;
    type _FallbackSlotsAreInjected = Assert<
      Equal<
        typeof Fallback.content,
        NonNullable<typeof OrdersUI.fallback>["slots"]["content"]
      >
    >;

    return (props: { orderId: string }) => (
      <Layout
        header={<Success.header.Toolbar />}
        content={<Success.content.List {...props} />}
        footer={<Success.footer.Pagination />}
      />
    );
  },
);

type _RuntimeSlotNamesArePreserved = Assert<
  Equal<typeof OrdersLayout.slots, readonly ["header", "content", "footer"]>
>;
type _LayoutSlotsArePreserved = Assert<
  Equal<
    LayoutSlots<typeof OrdersLayout>,
    Pick<OrdersLayoutProps, "header" | "content" | "footer">
  >
>;
type _StateComponentPropsArePreserved = Assert<
  Equal<
    ComponentProps<typeof OrdersUI.states.success.content.List>,
    { orderId: string }
  >
>;
type _BindingPropsArePreserved = Assert<
  Equal<ComponentProps<typeof OrdersPage>, { orderId: string }>
>;

const _layoutContract: LayoutUI = OrdersUI.layout;
const _componentContract: PureUI = OrdersUI.states.success.content.List;
const _ordersBinding: Binding<unknown, typeof OrdersUI> = OrdersPage;
const StandaloneView = pureUI((props: { label: string }) => (
  <div>{props.label}</div>
));

// @ts-expect-error density is a prop, but not a declared layout slot
const _densitySlot: LayoutSlots<typeof OrdersLayout> = { density: "compact" };

layoutUI({
  component: OrdersLayoutComponent,
  // @ts-expect-error declared layout slot names must exist in component props
  slots: ["missing"],
});

// @ts-expect-error required layout slot props remain required
const _missingLayoutSlot = <OrdersLayoutComponent header={<h1>Orders</h1>} />;

const RawStates = {
  success: {
    header: { Toolbar: () => null },
    content: { List: () => null },
  },
  empty: {
    header: { Toolbar: () => null },
    content: { Message: () => null },
  },
  pending: {
    header: { Title: () => null },
    content: { Skeleton: () => null },
  },
  failed: {
    header: { Title: () => null },
    content: { Message: () => null },
  },
};

// @ts-expect-error asyncUI requires a branded LayoutUI declaration
asyncUI({ layout: OrdersLayoutComponent, states: RawStates });

const MissingState = {
  layout: OrdersLayout,
  states: {
    success: RawStates.success,
    empty: RawStates.empty,
    pending: RawStates.pending,
  },
};

// @ts-expect-error all four async states are required
asyncUI(MissingState);

asyncUI({
  layout: OrdersLayout,
  states: {
    success: {
      header: { Toolbar: () => null },
      // @ts-expect-error state slot names must be declared by the LayoutUI
      aside: { Details: () => null },
      content: { List: () => null },
    },
    empty: RawStates.empty,
    pending: RawStates.pending,
    failed: RawStates.failed,
  },
});

asyncUI({
  layout: OrdersLayout,
  states: {
    success: {
      header: { Toolbar: () => null },
      content: {
        // @ts-expect-error state component keys must use PascalCase
        list: () => null,
      },
    },
    empty: RawStates.empty,
    pending: RawStates.pending,
    failed: RawStates.failed,
  },
});

const MissingRequiredSlot = {
  layout: OrdersLayout,
  states: {
    success: {
      header: { Toolbar: () => null },
    },
    empty: RawStates.empty,
    pending: RawStates.pending,
    failed: RawStates.failed,
  },
};

// @ts-expect-error every state must declare required LayoutUI slots
asyncUI(MissingRequiredSlot);

const MissingFallbackSlot = {
  layout: OrdersLayout,
  states: RawStates,
  fallback: {
    layout: OrdersFallbackLayout,
    slots: {
      content: { Message: () => null },
    },
  },
};

// @ts-expect-error fallback must declare its required LayoutUI slots
asyncUI(MissingFallbackSlot);

asyncUI({
  layout: OrdersLayout,
  states: RawStates,
  fallback: {
    layout: OrdersFallbackLayout,
    slots: {
      content: { Message: () => null },
      action: { Reset: () => null },
      // @ts-expect-error fallback slots belong to the fallback LayoutUI
      header: { Title: () => null },
    },
  },
});

// @ts-expect-error a branded PureUI cannot be redeclared as a Binding
binding(OrdersUI)(() => StandaloneView);

const CustomersUI = asyncUI({
  layout: OrdersLayout,
  states: {
    success: {
      header: { Toolbar: () => null },
      content: {
        List: (props: { customerId: number }) => <div>{props.customerId}</div>,
      },
    },
    empty: RawStates.empty,
    pending: RawStates.pending,
    failed: RawStates.failed,
  },
});

binding(CustomersUI)(({ Fallback }) => {
  type _FallbackIsOptional = Assert<Equal<typeof Fallback, undefined>>;
  return () => null;
});

// @ts-expect-error the Binding carries the UI contract it consumes
const _customersBinding: Binding<unknown, typeof CustomersUI> = OrdersPage;

// @ts-expect-error raw declarations are not AsyncUISet contracts
const _rawSet: AsyncUISet = { layout: OrdersLayout, states: RawStates };
