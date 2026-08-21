import {
  forwardRef,
  isValidElement,
  Suspense as ReactSuspense,
} from "react";
import type {
  ComponentProps,
  ComponentPropsWithRef,
  ReactNode,
} from "react";
import { describe, expect, expectTypeOf, it } from "vite-plus/test";
import {
  asyncUI,
  binding,
  layoutUI,
  pureUI,
  suspense,
  syncUI,
} from "../src/index.js";

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

  it("preserves forwardRef component props and ref types", () => {
    const component = forwardRef<HTMLInputElement, { name: string }>(() => null);
    const branded = pureUI(component);

    expect(branded).toBe(component);
    expectTypeOf<ComponentPropsWithRef<typeof branded>>().toEqualTypeOf<
      ComponentPropsWithRef<typeof component>
    >();
  });

  it("returns a layout declaration with runtime slot names", () => {
    const component = (props: { header: ReactNode; content: ReactNode }) =>
      props.content;
    const contract = { component, slots: ["header", "content"] } as const;
    const layout = layoutUI(contract);

    expect(layout).toBe(contract);
    expect(layout.component).toBe(component);
    expect(layout.slots).toEqual(["header", "content"]);
    expectTypeOf<ComponentProps<typeof layout.component>>().toEqualTypeOf<{
      header: ReactNode;
      content: ReactNode;
    }>();
  });

  it("returns standard async states without changing them", () => {
    const states = {
      success: {},
      empty: {},
      pending: {},
      failed: {},
      refreshing: {},
    };

    expect(asyncUI.states(states)).toBe(states);
  });

  it("dispatches an exhaustive async state case", () => {
    const states = {
      idle: { content: { Message: () => null } },
      ready: { content: { View: () => null } },
    };

    expect(
      asyncUI.exhaustive("ready", states, {
        idle: () => "idle",
        ready: (Ready) =>
          Ready.content.View === states.ready.content.View ? "ready" : "wrong",
      }),
    ).toBe("ready");
  });

  it("brands sync UI slots without changing the declaration", () => {
    const layout = layoutUI({
      component: (props: { content: ReactNode }) => props.content,
      slots: ["content"],
    });
    const config = {
      layout,
      slots: {
        content: { View: (props: { label: string }) => props.label },
      },
    };
    const ui = syncUI(config);

    expect(ui).toBe(config);
    expect(ui.slots.content.View).toBe(config.slots.content.View);

    const component = () => null;
    expect(
      binding(ui)(({ Layout, Slots }) => {
        expect(Layout).toBe(layout.component);
        expect(Slots).toBe(ui.slots);
        return component;
      }),
    ).toBe(component);
  });

  it("brands nested async state components without changing the declaration", () => {
    const layout = layoutUI({
      component: (props: { content: ReactNode }) => props.content,
      slots: ["content"],
    });
    const config = {
      layout,
      states: {
        success: {
          content: {
            List: (props: { orderId: string }) => props.orderId,
            Pagination: () => null,
          },
        },
        empty: { content: { Message: () => null } },
        pending: { content: { Skeleton: () => null } },
        failed: { content: { Message: () => null } },
        refreshing: { content: { Indicator: () => null } },
      },
    };

    const ui = asyncUI(config);

    expect(ui).toBe(config);
    expect(ui.layout).toBe(layout);
    expect(ui.states.success.content.List).toBe(
      config.states.success.content.List,
    );
    expect(ui.states.success.content.Pagination).toBe(
      config.states.success.content.Pagination,
    );
    expect(ui.states.empty.content.Message).toBe(
      config.states.empty.content.Message,
    );
    expect(ui.states.refreshing.content.Indicator).toBe(
      config.states.refreshing.content.Indicator,
    );
    expectTypeOf<
      ComponentProps<typeof ui.states.success.content.List>
    >().toEqualTypeOf<{ orderId: string }>();
  });

  it("injects the Layout component, States, and Fallback", () => {
    const layout = layoutUI({
      component: (props: { content: ReactNode }) => props.content,
      slots: ["content"],
    });
    const fallbackLayout = layoutUI({
      component: (props: { content: ReactNode }) => props.content,
      slots: ["content"],
    });
    const ui = asyncUI({
      layout,
      states: {
        success: { content: { Content: () => null } },
        empty: { content: { Content: () => null } },
        pending: { content: { Content: () => null } },
        failed: { content: { Content: () => null } },
      },
      fallback: {
        layout: fallbackLayout,
        slots: { content: { Message: () => null } },
      },
    });
    const component = (props: { orderId: string }) =>
      asyncUI.exhaustive("success", ui.states, {
        success: () => props.orderId,
        empty: () => props.orderId,
        pending: () => props.orderId,
        failed: () => props.orderId,
      });
    let definitions = 0;

    const bounded = binding(ui)(
      ({ Layout, States, Fallback }) => {
        definitions += 1;
        expect(Layout).toBe(layout.component);
        expect(States).toBe(ui.states);
        expect(Fallback.Layout).toBe(fallbackLayout.component);
        expect(Fallback.content).toBe(ui.fallback?.slots.content);
        return component;
      },
    );

    let fallbackRenders = 0;
    const suspenseComponent = binding(ui)(({ Fallback }) =>
      suspense(Fallback, () => {
        fallbackRenders += 1;
        return "fallback";
      })(component),
    );
    const suspenseElement = suspenseComponent({ orderId: "1" });

    expect(definitions).toBe(1);
    expect(bounded).toBe(component);
    expect(fallbackRenders).toBe(1);
    expect(
      isValidElement(suspenseElement) &&
        suspenseElement.type === ReactSuspense,
    ).toBe(true);
    expectTypeOf<ComponentProps<typeof bounded>>().toEqualTypeOf<{
      orderId: string;
    }>();
    expectTypeOf<ComponentProps<typeof suspenseComponent>>().toEqualTypeOf<{
      orderId: string;
    }>();
  });
});
