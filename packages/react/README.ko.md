# @jayjnu/branded-ui-react

[English](README.md) | [한국어](README.ko.md)

Branded UI 계약을 선언하고 애플리케이션 동작에 연결하기 위한 React 팩토리입니다.

## 설치

```sh
pnpm add @jayjnu/branded-ui-react
```

peer dependency로 React 18 이상이 필요합니다.

## 멘탈 모델

Branded UI 기능은 두 부분으로 나뉩니다.

- **UI 선언**은 레이아웃, 슬롯, 컴포넌트, 화면에 보이는 상태를 정의합니다.
- **Binding**은 Hook, 데이터 접근, effect, 상태 전이를 소유하고 선언된 UI만 조합합니다.

프레젠테이션 계약을 독립적으로 읽을 수 있으며, TypeScript가 슬롯 이름, 컴포넌트 props, 상태 처리 범위, Binding 식별자를 검증합니다.

## API

| 팩토리 | 역할 |
| --- | --- |
| `pureUI(component)` | 독립적인 프레젠테이션 컴포넌트에 브랜드를 부여합니다. |
| `layoutUI({ component, slots })` | 컴포넌트 props 중 어떤 항목이 컴포지션 슬롯인지 선언합니다. |
| `syncUI({ layout, slots })` | 하나의 동기적인 슬롯 컴포넌트 집합을 가진 UI를 선언합니다. |
| `asyncUI({ layout, states, fallback? })` | 상태별 슬롯 컴포넌트와 선택적인 Suspense fallback을 선언합니다. |
| `asyncUI.states(states)` | 사용자 정의 상태를 보존하면서 `success`, `empty`, `pending`, `failed`를 필수로 요구합니다. |
| `asyncUI.exhaustive(state, states, cases)` | 선언된 모든 상태를 매칭하며 누락되거나 불필요한 case를 거부합니다. |
| `binding(ui)(definition)` | 계약의 레이아웃과 컴포넌트를 동작 소유 컴포넌트에 주입합니다. |
| `suspense(fallback, renderFallback)(content)` | Binding 타입의 비동기 상태 처리 범위를 보존하면서 React Suspense를 조합합니다. |

## 동기 UI

프레젠테이션을 동작과 분리하여 선언합니다.

```tsx
// Counter.ui.tsx
import type { ReactNode } from "react";
import { layoutUI, syncUI } from "@jayjnu/branded-ui-react";

const CounterLayout = layoutUI({
  component: (props: { content: ReactNode; actions: ReactNode }) => (
    <section>
      <div>{props.content}</div>
      <footer>{props.actions}</footer>
    </section>
  ),
  slots: ["content", "actions"],
});

export const CounterUI = syncUI({
  layout: CounterLayout,
  slots: {
    content: { Value: (props: { value: number }) => <output>{props.value}</output> },
    actions: { Increment: (props: { onClick: () => void }) => <button onClick={props.onClick}>Increment</button> },
  },
});
```

Binding은 React 상태를 소유하며 선언된 컴포지션 표면만 전달받습니다.

```tsx
// Counter.binding.tsx
import { useState } from "react";
import { binding } from "@jayjnu/branded-ui-react";
import { CounterUI } from "./Counter.ui";

export const Counter = binding(CounterUI)(({ Layout, Slots }) => {
  return function CounterBinding() {
    const [value, setValue] = useState(0);

    return (
      <Layout
        content={<Slots.content.Value value={value} />}
        actions={<Slots.actions.Increment onClick={() => setValue(value + 1)} />}
      />
    );
  };
});
```

레이아웃 슬롯은 선택적일 수 있습니다. 필수 레이아웃 prop은 모든 동기 슬롯 집합과 모든 비동기 상태에 선언되어야 하며, 선택적 prop은 생략할 수 있습니다.

## 비동기 UI: 명시적 결과 상태

Binding이 표준 pending 및 failed 상태를 소유할 때 `asyncUI.states()`를 사용합니다.

```tsx
const OrdersUI = asyncUI({
  layout,
  states: asyncUI.states({
    success,
    empty,
    pending,
    failed,
    refreshing,
  }),
});

export const Orders = binding(OrdersUI)(({ Layout, States }) => {
  return function OrdersBinding() {
    const query = useQuery(/* ... */);
    const state = mapQueryToState(query);

    return asyncUI.exhaustive(state, States, {
      success: (Success) => renderSuccess(Layout, Success, query.data),
      empty: (Empty) => renderEmpty(Layout, Empty),
      pending: (Pending) => renderPending(Layout, Pending),
      failed: (Failed) => renderFailed(Layout, Failed, query.error),
      refreshing: (Refreshing) => renderRefreshing(Layout, Refreshing, query.data),
    });
  };
});
```

`asyncUI.exhaustive()`는 case map을 선언된 상태 map에 연결합니다. 상태를 추가하거나 제거하면 Binding의 처리를 갱신할 때까지 타입 오류가 발생합니다.

## 비동기 UI: Suspense

데이터 접근이 suspend될 때는 fallback 프레젠테이션을 해결된 애플리케이션 상태와 분리하여 선언합니다.

```tsx
const OrdersUI = asyncUI({
  layout,
  states: {
    success,
    empty,
    refreshing,
  },
  fallback: {
    layout: pendingLayout,
    slots: pendingSlots,
  },
});

export const Orders = binding(OrdersUI)(
  ({ Layout, States, Fallback }) =>
    suspense(Fallback, (Pending) => (
      <Pending.Layout content={<Pending.content.Skeleton />} />
    ))(function OrdersContent() {
      const query = useSuspenseQuery(/* ... */);
      const state = mapResolvedQueryToState(query);

      return asyncUI.exhaustive(state, States, {
        success: (Success) => renderSuccess(Layout, Success, query.data),
        empty: (Empty) => renderEmpty(Layout, Empty),
        refreshing: (Refreshing) => renderRefreshing(Layout, Refreshing, query.data),
      });
    }),
);
```

fallback은 인위적인 애플리케이션 상태가 아니라 프레젠테이션 계약입니다. 쿼리별 reset 동작을 포함한 쿼리 오류 처리는 상위 Error Boundary의 책임으로 남습니다.

## 컴포지션 규칙

- Branded UI 팩토리에 전달하는 컴포넌트에는 브랜드가 없어야 합니다. `PureUI`나 `Binding`을 다른 역할로 암묵적으로 다시 선언할 수 없습니다.
- 슬롯 내부의 컴포넌트 키는 대문자로 시작해야 합니다.
- Binding은 애플리케이션 수준의 자식으로 다른 Binding을 조합할 수 있지만, UI 선언 모듈은 Binding 모듈을 import하지 않아야 합니다.
- `asyncUI.exhaustive()`는 누락된 상태와 불필요한 상태 case를 모두 거부합니다.
- Exhaustive async Binding은 함수 컴포넌트를 대상으로 설계되었습니다. ref를 전달하는 async Binding을 위한 전용 어댑터는 아직 없습니다.

이 규칙은 주로 TypeScript가 강제합니다. Binding import나 직접적인 슬롯 배치 같은 파일 수준 아키텍처 검사는 [`@jayjnu/oxlint-plugin-branded-ui-react`](https://github.com/jayjnu/branded-ui/tree/main/packages/oxlint-plugin-branded-ui-react)에서 제공합니다.

## 예제

중첩 Binding, TanStack Query, Suspense, Error Boundary, Oxlint 통합은 [`examples/react-vite-oxlint`](https://github.com/jayjnu/branded-ui/tree/main/examples/react-vite-oxlint)에서 확인할 수 있습니다.

## 라이선스

[MIT](https://github.com/jayjnu/branded-ui/blob/main/LICENSE)
