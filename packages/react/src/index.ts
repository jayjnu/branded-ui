import { createElement, Suspense as ReactSuspense } from "react";
import type {
  ComponentProps,
  ComponentType,
  ExoticComponent,
  ReactNode,
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

declare const exhaustiveResult: unique symbol;
declare const fallbackStates: unique symbol;

type ReactComponent = ComponentType<any> | ExoticComponent<any>;
type BrandedComponent = PureUI | Binding;
type Unbranded<Component> = Component extends BrandedComponent ? never : Component;
type SlotComponentInput<Component> = Component extends PureUI
  ? Component
  : Component extends Binding
    ? never
    : Component;
type BrandedSlotComponent<Component> = Component extends PureUI
  ? Component
  : PureUI<Component>;
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
      ? SlotComponentInput<Components[Key]>
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
  readonly [Key in keyof Components]: BrandedSlotComponent<Components[Key]>;
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
type ExhaustiveResult<States, Output extends ReactNode> = {
  readonly [exhaustiveResult]: {
    readonly states: States;
    readonly output: Output;
  };
};
type ExhaustiveCases<States extends Readonly<Record<string, unknown>>> = {
  readonly [State in keyof States]: (ui: States[State]) => ReactNode;
};
type ExactExhaustiveCases<
  States extends Readonly<Record<string, unknown>>,
  Cases extends ExhaustiveCases<States>,
> = Cases & {
  readonly [State in Exclude<keyof Cases, keyof States>]: never;
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
    ? { readonly Layout: Layout["component"] } & Slots & {
        readonly [fallbackStates]: UI["states"];
      }
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
type FallbackProjection = {
  readonly [fallbackStates]: Readonly<Record<string, unknown>>;
};
// ponytail: proof-preserving function components only; add an explicit exotic adapter if bindings need refs.
type ExhaustiveDefinitionFor<States> = (
  props: any,
) =>
  | ExhaustiveResult<States, ReactNode>
  | Promise<ExhaustiveResult<States, ReactNode>>;
type ExhaustiveDefinition<UI extends AsyncUISet> = ExhaustiveDefinitionFor<
  UI["states"]
>;
type UnwrapExhaustiveReturn<Value> = Value extends ExhaustiveResult<
  unknown,
  infer Output
>
  ? Output
  : Value extends Promise<infer Result>
    ? Promise<UnwrapExhaustiveReturn<Result>>
    : never;
type UnwrapExhaustiveDefinition<Definition> = Definition extends (
  ...args: infer Args
) => infer Result
  ? (...args: Args) => UnwrapExhaustiveReturn<Result>
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

  export function exhaustive<
    const States extends Readonly<Record<string, unknown>>,
    const State extends keyof States,
    const Cases extends ExhaustiveCases<States>,
  >(
    state: State,
    states: States,
    cases: ExactExhaustiveCases<States, Cases>,
  ): ExhaustiveResult<States, ReturnType<Cases[keyof Cases]>> {
    const render = cases[state] as (
      ui: States[State],
    ) => ReturnType<Cases[keyof Cases]>;
    return render(states[state]) as unknown as ExhaustiveResult<
      States,
      ReturnType<Cases[keyof Cases]>
    >;
  }
}

export function suspense<const Fallback extends FallbackProjection>(
  fallback: Fallback,
  renderFallback: (fallback: Fallback) => ReactNode,
) {
  return function<
    const Definition extends ExhaustiveDefinitionFor<
      Fallback[typeof fallbackStates]
    >,
  >(
    content: Definition,
  ): (
    ...args: Parameters<Definition>
  ) => ExhaustiveResult<Fallback[typeof fallbackStates], ReactNode> {
    return function (...args) {
      return createElement(
        ReactSuspense,
        { fallback: renderFallback(fallback) },
        createElement(
          content as unknown as ComponentType<any>,
          args[0] ?? null,
        ),
      ) as unknown as ExhaustiveResult<
        Fallback[typeof fallbackStates],
        ReactNode
      >;
    };
  };
}

export function binding<const UI extends SyncUISet>(
  ui: UI,
): <const Component extends ReactComponent>(
  define: (slots: ReactSyncUISlots<UI>) => Unbranded<Component>,
) => Binding<Component, UI>;
export function binding<const UI extends AsyncUISet>(
  ui: UI,
): <const Definition extends ExhaustiveDefinition<UI>>(
  define: (slots: ReactAsyncUISlots<UI>) => Definition,
) => Binding<UnwrapExhaustiveDefinition<Definition>, UI>;
export function binding(
  ui: UIContract,
): (define: (slots: any) => any) => any {
  return function (define) {
    const slots = "states" in ui
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
        };

    return define(slots as ReactUISlots<UIContract>);
  };
}
