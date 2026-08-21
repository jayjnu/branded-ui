import type {
  ComponentProps,
  ComponentType,
  ExoticComponent,
} from "react";
import type {
  AsyncUISet,
  Binding,
  FallbackUI,
  LayoutSlots,
  LayoutUI,
  PureUI,
} from "@jayjnu/branded-ui";

type ReactComponent = ComponentType<any> | ExoticComponent<any>;
type BrandedComponent = PureUI | Binding;
type Unbranded<Component> = Component extends BrandedComponent ? never : Component;
type ComponentMap = Readonly<Record<string, ReactComponent>>;
type SlotNames<Layout extends LayoutUI> = Layout["slots"][number] & string;
type RequiredKeys<Value> = {
  [Key in keyof Value]-?: object extends Pick<Value, Key> ? never : Key;
}[keyof Value];
type RequiredSlotNames<Layout extends LayoutUI> = Extract<
  RequiredKeys<LayoutSlots<Layout>>,
  SlotNames<Layout>
>;
type OptionalSlotNames<Layout extends LayoutUI> = Exclude<
  SlotNames<Layout>,
  RequiredSlotNames<Layout>
>;
type StateMap<Layout extends LayoutUI> = {
  readonly [Slot in RequiredSlotNames<Layout>]: ComponentMap;
} & {
  readonly [Slot in OptionalSlotNames<Layout>]?: ComponentMap;
};
type ComponentInput<Components extends ComponentMap> = {
  readonly [Key in keyof Components]: Key extends string
    ? Key extends Capitalize<Key>
      ? Unbranded<Components[Key]>
      : never
    : never;
};
type StateInput<
  Layout extends LayoutUI,
  State extends StateMap<Layout>,
> = {
  readonly [Slot in keyof State]: Slot extends SlotNames<Layout>
    ? NonNullable<State[Slot]> extends ComponentMap
      ? ComponentInput<NonNullable<State[Slot]>>
      : never
    : never;
};
type BrandedComponents<Components extends ComponentMap> = {
  readonly [Key in keyof Components]: PureUI<Components[Key]>;
};
type BrandedState<State> = {
  readonly [Slot in keyof State]: NonNullable<State[Slot]> extends ComponentMap
    ? BrandedComponents<NonNullable<State[Slot]>>
    : never;
};
type FallbackInput<Layout, Slots> = Layout extends LayoutUI
  ? Slots extends StateMap<Layout>
    ? {
        readonly layout: Layout;
        readonly slots: Slots & StateInput<Layout, NoInfer<Slots>>;
      }
    : never
  : undefined;
type BrandedFallback<Layout, Slots> = Layout extends LayoutUI
  ? Slots extends StateMap<Layout>
    ? FallbackUI<Layout, BrandedState<Slots>>
    : undefined
  : undefined;
type FallbackContract<UI extends AsyncUISet> = Exclude<
  UI["fallback"],
  undefined
>;
type ReactFallback<UI extends AsyncUISet> = [FallbackContract<UI>] extends [
  never,
]
  ? undefined
  : FallbackContract<UI> extends FallbackUI<infer Layout, infer Slots>
    ? { readonly Layout: Layout["component"] } & Slots
    : undefined;
type ReactUISlots<UI extends AsyncUISet> = {
  readonly Layout: UI["layout"]["component"];
  readonly Success: UI["states"]["success"];
  readonly Empty: UI["states"]["empty"];
  readonly Pending: UI["states"]["pending"];
  readonly Failed: UI["states"]["failed"];
  readonly Fallback: ReactFallback<UI>;
};

export function pureUI<const Component extends ReactComponent>(
  component: Unbranded<Component>,
): PureUI<Component> {
  return component as unknown as PureUI<Component>;
}

export function layoutUI<
  const Component extends ReactComponent,
  const Slots extends readonly [
    keyof ComponentProps<Component> & string,
    ...(keyof ComponentProps<Component> & string)[],
  ],
>(contract: {
  readonly component: Unbranded<Component>;
  readonly slots: Slots;
}): LayoutUI<
  Component,
  Slots,
  Pick<ComponentProps<Component>, Slots[number]>
> {
  return contract as unknown as LayoutUI<
    Component,
    Slots,
    Pick<ComponentProps<Component>, Slots[number]>
  >;
}

export function asyncUI<
  const Layout extends LayoutUI,
  const Success extends StateMap<Layout>,
  const Empty extends StateMap<Layout>,
  const Pending extends StateMap<Layout>,
  const Failed extends StateMap<Layout>,
  const FallbackLayout extends LayoutUI | undefined = undefined,
  const FallbackSlots = undefined,
>(config: {
  readonly layout: Layout;
  readonly states: {
    readonly success: Success & StateInput<Layout, NoInfer<Success>>;
    readonly empty: Empty & StateInput<Layout, NoInfer<Empty>>;
    readonly pending: Pending & StateInput<Layout, NoInfer<Pending>>;
    readonly failed: Failed & StateInput<Layout, NoInfer<Failed>>;
  };
  readonly fallback?: FallbackInput<FallbackLayout, FallbackSlots>;
}): AsyncUISet<
  Layout,
  {
    readonly success: BrandedState<Success>;
    readonly empty: BrandedState<Empty>;
    readonly pending: BrandedState<Pending>;
    readonly failed: BrandedState<Failed>;
  },
  BrandedFallback<FallbackLayout, FallbackSlots>
> {
  return config as unknown as AsyncUISet<
    Layout,
    {
      readonly success: BrandedState<Success>;
      readonly empty: BrandedState<Empty>;
      readonly pending: BrandedState<Pending>;
      readonly failed: BrandedState<Failed>;
    },
    BrandedFallback<FallbackLayout, FallbackSlots>
  >;
}

export function binding<const UI extends AsyncUISet>(ui: UI) {
  return function<const Component extends ReactComponent>(
    define: (slots: ReactUISlots<UI>) => Unbranded<Component>,
  ): Binding<Component, UI> {
    const component = define({
      Layout: ui.layout.component,
      Success: ui.states.success,
      Empty: ui.states.empty,
      Pending: ui.states.pending,
      Failed: ui.states.failed,
      Fallback: (ui.fallback
        ? {
            Layout: ui.fallback.layout.component,
            ...ui.fallback.slots,
          }
        : undefined) as unknown as ReactFallback<UI>,
    });

    return component as unknown as Binding<Component, UI>;
  };
}
