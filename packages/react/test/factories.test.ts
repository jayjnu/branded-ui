import { forwardRef } from "react";
import type {
  ComponentProps,
  ComponentPropsWithRef,
  ReactNode,
} from "react";
import { describe, expect, expectTypeOf, it } from "vite-plus/test";
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
    expectTypeOf<
      ComponentProps<typeof ui.states.success.content.List>
    >().toEqualTypeOf<{ orderId: string }>();
  });

  it("injects the Layout component and PascalCase state groups", () => {
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
    const component = (props: { orderId: string }) => props.orderId;
    let definitions = 0;

    const bounded = binding(ui)(
      ({ Layout, Success, Empty, Pending, Failed, Fallback }) => {
        definitions += 1;
        expect(Layout).toBe(layout.component);
        expect(Success).toBe(ui.states.success);
        expect(Empty).toBe(ui.states.empty);
        expect(Pending).toBe(ui.states.pending);
        expect(Failed).toBe(ui.states.failed);
        expect(Fallback.Layout).toBe(fallbackLayout.component);
        expect(Fallback.content).toBe(ui.fallback?.slots.content);
        return component;
      },
    );

    expect(definitions).toBe(1);
    expect(bounded).toBe(component);
    expectTypeOf<ComponentProps<typeof bounded>>().toEqualTypeOf<{
      orderId: string;
    }>();
  });
});
