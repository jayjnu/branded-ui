declare const role: unique symbol;
declare const layoutSlotProps: unique symbol;
declare const consumedUI: unique symbol;

type Branded<Value, Role> = Value & { readonly [role]: Role };
type ComponentSlots = Readonly<Record<string, PureUI>>;
type StateSlots = Readonly<Record<string, ComponentSlots>>;

export type PureUI<Component = unknown> = Branded<Component, "PureUI">;

export type LayoutUI<
  Component = unknown,
  SlotNames extends readonly string[] = readonly string[],
  Slots = unknown,
> = Branded<
  {
    readonly component: Component;
    readonly slots: SlotNames;
  },
  "LayoutUI"
> & { readonly [layoutSlotProps]: Slots };

export type LayoutSlots<Layout extends LayoutUI> =
  Layout[typeof layoutSlotProps];

export type AsyncUIStates<
  Success extends StateSlots = StateSlots,
  Empty extends StateSlots = StateSlots,
  Pending extends StateSlots = StateSlots,
  Failed extends StateSlots = StateSlots,
> = {
  readonly success: Success;
  readonly empty: Empty;
  readonly pending: Pending;
  readonly failed: Failed;
};

export type FallbackUI<
  Layout extends LayoutUI = LayoutUI,
  Slots extends StateSlots = StateSlots,
> = {
  readonly layout: Layout;
  readonly slots: Slots;
};

export type AsyncUISet<
  Layout extends LayoutUI = LayoutUI,
  States extends AsyncUIStates = AsyncUIStates,
  Fallback extends FallbackUI | undefined = FallbackUI | undefined,
> = Branded<
  {
    readonly layout: Layout;
    readonly states: States;
    readonly fallback?: Fallback;
  },
  "AsyncUISet"
>;

export type Binding<
  Component = unknown,
  UI extends AsyncUISet = AsyncUISet,
> = Branded<Component, "Binding"> & { readonly [consumedUI]: UI };
