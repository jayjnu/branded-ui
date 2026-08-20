import type { ComponentType, ExoticComponent } from "react";
import type {
  AsyncUISet,
  Binding,
  LayoutUI,
  PureUI,
} from "@jayjnu/branded-ui";

type ReactComponent = ComponentType<any> | ExoticComponent<any>;
type BrandedComponent = PureUI | LayoutUI | Binding;
type Unbranded<Component> = Component extends BrandedComponent ? never : Component;

export function pureUI<const Component extends ReactComponent>(
  component: Unbranded<Component>,
): PureUI<Component> {
  return component as unknown as PureUI<Component>;
}

export function layoutUI<const Component extends ReactComponent>(
  component: Unbranded<Component>,
): LayoutUI<Component> {
  return component as unknown as LayoutUI<Component>;
}

export function asyncUI<
  const Layout extends LayoutUI,
  const Component extends PureUI,
  const Skeleton extends PureUI,
  const Error extends PureUI | undefined = undefined,
>(config: {
  readonly layout: Layout;
  readonly component: Component;
  readonly skeleton: Skeleton;
  readonly error?: Error;
}): AsyncUISet<Layout, Component, Skeleton, Error> {
  return config as AsyncUISet<Layout, Component, Skeleton, Error>;
}

export function binding<
  const UI extends AsyncUISet,
  const Component extends ReactComponent,
>(config: {
  readonly ui: UI;
  readonly component: Unbranded<Component>;
}): Binding<Component, UI> {
  return config.component as unknown as Binding<Component, UI>;
}
