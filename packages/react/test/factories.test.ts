import { forwardRef } from "react";
import type {
  ComponentProps,
  ComponentPropsWithRef,
  ReactNode,
} from "react";
import { describe, expect, expectTypeOf, it } from "vitest";
import { asyncUI, binding, layoutUI, pureUI } from "../src/index.js";

describe("React factories", () => {
  it("brands a pure component without wrapping or mutating it", () => {
    const component = (props: { label: string }) => props.label;
    const keys = Reflect.ownKeys(component);
    const branded = pureUI(component);

    expect(branded).toBe(component);
    expect(Reflect.ownKeys(component)).toEqual(keys);
    expectTypeOf<ComponentProps<typeof branded>>().toEqualTypeOf<{
      label: string;
    }>();
  });

  it("brands a layout component without wrapping it", () => {
    const component = (props: { children?: ReactNode }) => props.children;
    const branded = layoutUI(component);

    expect(branded).toBe(component);
    expectTypeOf<ComponentProps<typeof branded>>().toEqualTypeOf<{
      children?: ReactNode;
    }>();
  });

  it("preserves forwardRef component props and ref types", () => {
    const component = forwardRef<HTMLInputElement, { name: string }>(() => null);
    const branded = pureUI(component);

    expect(branded).toBe(component);
    expectTypeOf<ComponentPropsWithRef<typeof branded>>().toEqualTypeOf<
      ComponentPropsWithRef<typeof component>
    >();
  });

  it("returns the original async UI declaration", () => {
    const config = {
      layout: layoutUI((props: { children?: ReactNode }) => props.children),
      component: pureUI((props: { orderId: string }) => props.orderId),
      skeleton: pureUI(() => null),
    };

    const ui = asyncUI(config);

    expect(ui).toBe(config);
    expect(ui.layout).toBe(config.layout);
    expect(ui.component).toBe(config.component);
    expect(ui.skeleton).toBe(config.skeleton);
    expect(ui.error).toBeUndefined();
  });

  it("preserves an optional async error component", () => {
    const error = pureUI((props: { message: string }) => props.message);
    const config = {
      layout: layoutUI((props: { children?: ReactNode }) => props.children),
      component: pureUI(() => null),
      skeleton: pureUI(() => null),
      error,
    };

    expect(asyncUI(config).error).toBe(error);
  });

  it("returns the binding component without wrapping it", () => {
    const ui = asyncUI({
      layout: layoutUI((props: { children?: ReactNode }) => props.children),
      component: pureUI(() => null),
      skeleton: pureUI(() => null),
    });
    const component = (props: { orderId: string }) => props.orderId;

    expect(binding({ ui, component })).toBe(component);
  });
});
