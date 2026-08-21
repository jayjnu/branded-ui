# @jayjnu/branded-ui-react

[English](README.md) | [한국어](README.ko.md)

Branded UI 계약을 React에서 선언하고 앱 로직과 연결하는 패키지입니다.

## 설치

```sh
pnpm add @jayjnu/branded-ui-react
```

peer dependency로 React 18 이상이 필요합니다.

## 기본 구조

Branded UI로 만든 기능은 UI 선언과 Binding으로 나뉩니다.

- **UI 선언**에는 레이아웃과 슬롯, 화면 컴포넌트, 화면에 보일 상태를 적습니다.
- **Binding**에는 Hook과 데이터 호출, effect, 상태 전이를 둡니다. 여기서는 앞서 선언한 UI만 조합합니다.

이렇게 나누면 화면 계약만 따로 읽을 수 있습니다. TypeScript는 슬롯 이름과 컴포넌트 props가 맞는지 확인하고 빠진 상태가 없는지, Binding이 어떤 계약을 쓰는지도 추적합니다.

## API

| 팩토리 | 역할 |
| --- | --- |
| `pureUI(component)` | 독립된 화면 컴포넌트에 `PureUI` 역할을 부여합니다. |
| `layoutUI({ component, slots })` | 컴포넌트 props 가운데 UI가 들어갈 슬롯을 지정합니다. |
| `syncUI({ layout, slots })` | 레이아웃과 동기 화면용 컴포넌트 묶음을 선언합니다. |
| `asyncUI({ layout, states, fallback? })` | 상태별 컴포넌트 묶음과 선택적인 Suspense fallback을 선언합니다. |
| `asyncUI.states(states)` | 사용자 상태는 그대로 두면서 `success`, `empty`, `pending`, `failed`를 반드시 받습니다. |
| `asyncUI.exhaustive(state, states, cases)` | 선언된 상태와 case를 일대일로 맞춥니다. 빠지거나 더 들어간 case는 허용하지 않습니다. |
| `binding(ui)(definition)` | UI 계약의 레이아웃과 컴포넌트를 Binding에 넘깁니다. |
| `suspense(fallback, renderFallback)(content)` | 비동기 상태 정보가 Binding 타입에서 사라지지 않게 React Suspense를 조합합니다. |

## 동기 UI

화면 코드와 동작을 나눠 선언합니다.

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

React 상태는 Binding에서 관리합니다. Binding callback에는 앞서 선언한 `Layout`과 `Slots`만 전달됩니다.

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

레이아웃 슬롯에는 선택적인 슬롯도 둘 수 있습니다. 필수 prop은 모든 동기 슬롯 묶음과 비동기 상태에 있어야 합니다. 선택적 prop은 빼도 됩니다.

## 비동기 UI: 명시적 결과 상태

pending과 failed 상태를 Binding에서 직접 처리한다면 `asyncUI.states()`를 사용합니다.

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

`asyncUI.exhaustive()`는 선언한 상태와 case를 묶어 검사합니다. 상태를 추가하거나 지우면 Binding도 함께 고칠 때까지 타입 오류가 납니다.

## 비동기 UI: Suspense

데이터를 읽다가 suspend되는 경우에는 fallback 화면을 데이터가 준비된 뒤의 상태와 따로 선언합니다.

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

fallback은 앱 상태를 억지로 하나 더 만든 것이 아니라 별도의 화면 계약입니다. 쿼리 오류와 쿼리별 reset은 상위 Error Boundary에서 처리합니다.

## 컴포지션 규칙

- Branded UI 팩토리에는 아직 브랜드가 없는 컴포넌트만 넘길 수 있습니다. `PureUI`나 `Binding`을 다른 역할로 다시 포장할 수 없습니다.
- 슬롯 안의 컴포넌트 키는 대문자로 시작해야 합니다.
- Binding은 앱 수준에서 다른 Binding을 자식으로 조합할 수 있습니다. 반대로 UI 선언 모듈에서 Binding 모듈을 import하면 안 됩니다.
- `asyncUI.exhaustive()`는 빠진 case와 불필요하게 들어간 case를 모두 거부합니다.
- Exhaustive async Binding은 함수 컴포넌트를 기준으로 설계했습니다. ref를 전달하는 async Binding용 어댑터는 아직 없습니다.

대부분은 TypeScript가 검사합니다. Binding import나 슬롯 배치처럼 파일을 직접 살펴야 하는 규칙은 [`@jayjnu/oxlint-plugin-branded-ui-react`](https://github.com/jayjnu/branded-ui/tree/main/packages/oxlint-plugin-branded-ui-react)에서 검사할 수 있습니다.

## 예제

- [`examples/react-vite-oxlint`](https://github.com/jayjnu/branded-ui/tree/main/examples/react-vite-oxlint)은 중첩 Binding과 TanStack Query, Suspense, Error Boundary, Oxlint를 함께 보여줍니다.
- [`examples/next-app-router`](https://github.com/jayjnu/branded-ui/tree/main/examples/next-app-router)는 App Router 데이터 로딩을 async Server Component Binding과 Suspense, exhaustive UI 상태로 표현합니다.

## 라이선스

[MIT](https://github.com/jayjnu/branded-ui/blob/main/LICENSE)
