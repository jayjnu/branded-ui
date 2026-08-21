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
  SyncUISet,
  UIContract,
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
type AsyncStateMap<Layout extends LayoutUI> = Readonly<
  Record<string, StateMap<Layout>>
>;
type StandardAsyncStates = Readonly<Record<string, unknown>> & {
  readonly success: unknown;
  readonly empty: unknown;
  readonly pending: unknown;
  readonly failed: unknown;
};
type StatesInput<
  Layout extends LayoutUI,
  States extends AsyncStateMap<Layout>,
> = {
  readonly [State in keyof States]: StateInput<Layout, States[State]>;
};
type BrandedStates<States> = {
  readonly [State in keyof States]: BrandedState<States[State]>;
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
type ReactAsyncUISlots<UI extends AsyncUISet> = {
  readonly Layout: UI["layout"]["component"];
  readonly States: UI["states"];
  readonly Fallback: ReactFallback<UI>;
};
type ReactSyncUISlots<UI extends SyncUISet> = {
  readonly Layout: UI["layout"]["component"];
  readonly Slots: UI["slots"];
};
type ReactUISlots<UI extends UIContract> = UI extends SyncUISet
  ? ReactSyncUISlots<UI>
  : UI extends AsyncUISet
    ? ReactAsyncUISlots<UI>
    : never;

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

export function syncUI<
  const Layout extends LayoutUI,
  const Slots extends StateMap<Layout>,
>(config: {
  readonly layout: Layout;
  readonly slots: Slots & StateInput<Layout, NoInfer<Slots>>;
}): SyncUISet<Layout, BrandedState<Slots>> {
  return config as unknown as SyncUISet<Layout, BrandedState<Slots>>;
}

export function asyncUI<
  const Layout extends LayoutUI,
  const States extends AsyncStateMap<Layout>,
  const FallbackLayout extends LayoutUI | undefined = undefined,
  const FallbackSlots = undefined,
>(config: {
  readonly layout: Layout;
  readonly states: States & StatesInput<Layout, NoInfer<States>>;
  readonly fallback?: FallbackInput<FallbackLayout, FallbackSlots>;
}): AsyncUISet<
  Layout,
  BrandedStates<States>,
  BrandedFallback<FallbackLayout, FallbackSlots>
> {
  return config as unknown as AsyncUISet<
    Layout,
    BrandedStates<States>,
    BrandedFallback<FallbackLayout, FallbackSlots>
  >;
}

export namespace asyncUI {
  export function states<const States extends StandardAsyncStates>(
    states: States,
  ): States {
    return states;
  }
}

export function binding<const UI extends UIContract>(ui: UI) {
  return function<const Component extends ReactComponent>(
    define: (slots: ReactUISlots<UI>) => Unbranded<Component>,
  ): Binding<Component, UI> {
    const slots = ("states" in ui
      ? {
          Layout: ui.layout.component,
          States: ui.states,
          Fallback: ui.fallback
            ? {
                Layout: ui.fallback.layout.component,
                ...ui.fallback.slots,
              }
            : undefined,
        }
      : {
          Layout: ui.layout.component,
          Slots: ui.slots,
        }) as unknown as ReactUISlots<UI>;

    return define(slots) as unknown as Binding<Component, UI>;
  };
}
