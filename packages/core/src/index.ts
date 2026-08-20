declare const role: unique symbol;
declare const consumedUI: unique symbol;

type Branded<Component, Role> = Component & { readonly [role]: Role };

export type PureUI<Component = unknown> = Branded<Component, "PureUI">;
export type LayoutUI<Component = unknown> = Branded<Component, "LayoutUI">;

export type AsyncUISet<
  Layout extends LayoutUI = LayoutUI,
  Component extends PureUI = PureUI,
  Skeleton extends PureUI = PureUI,
  Error extends PureUI | undefined = PureUI | undefined,
> = Branded<
  {
    readonly layout: Layout;
    readonly component: Component;
    readonly skeleton: Skeleton;
    readonly error?: Error;
  },
  "AsyncUISet"
>;

export type Binding<
  Component = unknown,
  UI extends AsyncUISet = AsyncUISet,
> = Branded<Component, "Binding"> & { readonly [consumedUI]: UI };
