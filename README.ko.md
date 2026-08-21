# Branded UI

[English](README.md) | [한국어](README.ko.md)

## Branded UI란?

Branded UI는 일반 UI 컴포넌트 위에 얹는 작고 타입 우선적인 계약 계층입니다. 프레젠테이션 선언과 애플리케이션 동작을 분리하고, 의미 있는 상태를 명시하며, 새로운 렌더링 시스템을 도입하지 않고도 컴포지션 전반에서 각 역할을 보존합니다.

## 왜 필요한가?

순수 UI는 결정적입니다. 같은 입력에는 같은 출력을 만듭니다. UI를 함수형 코어로 만들면 이해하고, 테스트하고, 재사용하고, 격리된 환경에서 렌더링하기 쉬워집니다. 하지만 React는 이 경계를 강제하지 않습니다. Context와 Hook으로 어디서든 동작에 접근하기 쉬워지면서 프레젠테이션 컴포넌트와 동작을 소유한 컴포넌트의 구분은 개발자 개인이 지켜야 하는 관례가 되었습니다.

모든 UI 컴포넌트에는 최소 세 가지 사용처가 있습니다. 실제 애플리케이션, Storybook과 같은 독립 쇼케이스, 그리고 테스트입니다. 말단 컴포넌트가 직접 데이터를 불러오거나 숨겨진 애플리케이션 상태에 의존하면 처음에는 편리할 수 있지만, 다른 모든 사용처가 그 환경을 재현해야 합니다. 명확한 경계가 없으면 재사용은 결합으로 바뀌고 유지보수 비용은 커집니다.

AI 에이전트는 이 트레이드오프를 바꿉니다. 이제 코드를 생성하는 비용은 낮고, 독립적으로 생성된 코드가 올바르고 조합 가능하며 확장 가능한지 검증하는 비용이 높습니다. 따라서 아키텍처 의도는 개발자의 기억이나 문서에만 머물지 않고 기계가 읽을 수 있어야 합니다.

시각적 검증도 달라집니다. 에이전트가 한 세션에서 여러 컴포넌트와 상태 변형을 생성할 수 있다면 독립 쇼케이스는 더 이상 있으면 좋은 도구가 아닙니다. 사람이 결과를 검토할 수 있도록 의미 있는 모든 시나리오가 눈에 보이고 반복 가능한 형태로 표현되어야 합니다.

Branded UI는 이러한 경계를 계약으로 바꿉니다. 컴파일 타임 브랜드로 프레젠테이션 컴포넌트, 레이아웃, 상태, 동작을 소유한 Binding의 역할을 정의합니다. TypeScript는 컴포지션을 검사하고, 선택적인 린트 규칙은 타입이 볼 수 없는 파일 수준 경계를 검사합니다. 이 검사를 CI나 pre-commit hook에서 실행하면 AI 에이전트도 아키텍처를 위반하는 즉시 기계적인 피드백을 받을 수 있습니다.

## Branded UI는 어떻게 해결하는가

먼저 데이터 접근이나 애플리케이션 상태 없이 완전한 프레젠테이션 계약을 선언합니다.

```tsx
// Orders.ui.tsx
const OrdersLayout = layoutUI({
  component: ({ content }: { content: ReactNode }) => <section>{content}</section>,
  slots: ["content"],
});

export const OrdersUI = asyncUI({
  layout: OrdersLayout,
  states: asyncUI.states({
    success: {
      content: {
        List: ({ orders }: { orders: readonly Order[] }) => (
          <ul>{orders.map((order) => <li key={order.id}>{order.name}</li>)}</ul>
        ),
      },
    },
    empty: { content: { Message: () => <p>No orders yet.</p> } },
    pending: { content: { Message: () => <p>Loading orders…</p> } },
    failed: { content: { Message: () => <p>Could not load orders.</p> } },
  }),
});
```

그다음 Hook, 데이터 접근, 상태 전이를 Binding에 둡니다. 선언된 레이아웃과 상태가 주입되며 모든 상태를 빠짐없이 처리해야 합니다.

```tsx
// Orders.binding.tsx
export const Orders = binding(OrdersUI)(({ Layout, States }) => {
  return function OrdersBinding() {
    const { state, orders } = useOrders();

    return asyncUI.exhaustive(state, States, {
      success: (Success) => (
        <Layout content={<Success.content.List orders={orders} />} />
      ),
      empty: (Empty) => <Layout content={<Empty.content.Message />} />,
      pending: (Pending) => <Layout content={<Pending.content.Message />} />,
      failed: (Failed) => <Layout content={<Failed.content.Message />} />,
    });
  };
});
```

같은 계약으로 데이터 계층을 재현하지 않고도 독립 시나리오를 렌더링할 수 있습니다.

```tsx
// Orders.scenario.tsx — Story와 테스트에서 이 컴포넌트를 가져와 사용합니다.
const Layout = OrdersUI.layout.component;
const Pending = OrdersUI.states.pending;

export const PendingOrders = pureUI(() => (
  <Layout content={<Pending.content.Message />} />
));
```

이제 TypeScript는 누락된 상태, 잘못된 슬롯, 호환되지 않는 props, 잘못된 브랜드 역할에 사용된 컴포넌트를 거부합니다. 선택적인 Oxlint 플러그인은 UI 모듈의 Binding import나 잘못된 레이아웃 슬롯 배치와 같은 파일 수준 문제를 추가로 검사합니다. Storybook과 테스트는 동일한 명시적 계약을 렌더링하고, CI와 pre-commit hook은 개발자의 규율에만 의존하지 않고 그 계약을 강제합니다.

## 핵심 개념

Branded UI는 기능 하나를 동작 소유 셸로 둘러싸인 함수형 코어로 모델링합니다.

| 개념 | 책임 |
| --- | --- |
| **Pure UI** | 데이터와 액션을 명시적인 props로 받는 프레젠테이션 컴포넌트입니다. |
| **Layout** | UI가 조합될 위치를 정의하는 이름 있는 슬롯을 가진 구조 컴포넌트입니다. |
| **Sync UI** | 하나의 레이아웃과 동기 UI를 위한 하나의 완전한 컴포넌트 집합입니다. |
| **Async UI** | 하나의 레이아웃, 명시적인 상태별 컴포넌트 집합, 선택적인 Suspense fallback입니다. |
| **Binding** | 정확한 UI 계약을 소비하고 Hook, 데이터 접근, effect, 상태 전이를 소유하는 셸입니다. |
| **Brand** | 각 역할을 보존하고 의도하지 않은 대체나 재선언을 막는 컴파일 타임 증거입니다. |

브랜드는 별도의 렌더러를 도입하지 않습니다. 런타임에서 애플리케이션은 여전히 일반적인 프레임워크 컴포넌트를 조합하고, 브랜드는 구조적 타입만으로 표현할 수 없는 아키텍처 정보를 TypeScript에 제공합니다.

## 설계 원칙

- **함수형 코어와 동작 소유 셸.** 프레젠테이션은 결정적으로 유지하고 환경 의존성은 Binding으로 옮깁니다.
- **숨겨진 의존성보다 명시적인 입력.** 데이터와 callback은 말단의 API 접근이나 애플리케이션 Context 대신 props를 통해 UI 경계를 넘습니다.
- **상태는 계약의 일부.** pending, empty, failed, success와 도메인별 상태를 먼저 설계하고 빠짐없이 처리합니다.
- **모든 사용처에서 하나의 계약.** 애플리케이션, Storybook, 테스트가 각자 다른 표현을 관리하지 않고 같은 UI 선언을 렌더링합니다.
- **기계로 검증 가능한 아키텍처.** 타입과 린트 규칙으로 사람과 AI 에이전트 모두에게 경계를 전달합니다.
- **프레임워크 장치보다 컴포지션.** 일반적인 컴포넌트 컴포지션을 유지하며 계약을 전달하는 데 필요한 최소한의 런타임 계층만 추가합니다.
- **프레임워크 중립적인 역할.** 핵심 모델은 프레임워크별 어댑터와 도구로부터 독립적입니다.

## 패키지

| 패키지 | 목적 | 문서 |
| --- | --- | --- |
| [`@jayjnu/branded-ui`](packages/core) | 프레임워크 중립적인 역할 계약 | 소스 패키지 |
| [`@jayjnu/branded-ui-react`](packages/react) | React 팩토리, Binding, exhaustive 상태 매칭, Suspense 컴포지션 | [React 가이드](packages/react/README.ko.md) |
| [`@jayjnu/oxlint-plugin-branded-ui-react`](packages/oxlint-plugin-branded-ui-react) | React 프로젝트를 위한 선택적 아키텍처 규칙 | [플러그인 가이드](packages/oxlint-plugin-branded-ui-react/README.md) |

## 예제

[`examples/react-vite-oxlint`](examples/react-vite-oxlint)에서 중첩 Binding, TanStack Query, Suspense, Error Boundary, Oxlint 통합을 확인할 수 있습니다.

## 상태

Branded UI는 실험 단계이며 `1.0` 이전까지 API가 변경될 수 있습니다.

## 라이선스

[MIT](LICENSE)
