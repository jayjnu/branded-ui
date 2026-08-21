# Branded UI

[English](README.md) | [한국어](README.ko.md)

## Branded UI란?

Branded UI는 일반 UI 컴포넌트에 정의와 조합 규칙을 더하는 작은 라이브러리입니다. 화면만 그리는 컴포넌트와 레이아웃 슬롯을 구분합니다. 어떤 화면 상태가 있는지, 앱 로직은 어디에서 들어오는지도 타입 계약으로 남깁니다.

렌더러나 상태 관리 도구, 데이터 호출 라이브러리, 스타일 시스템을 대신 골라주지는 않습니다. 핵심 역할은 특정 프레임워크에 묶이지 않으며 어댑터가 같은 계약을 각 프레임워크의 컴포넌트 문법에 맞게 옮깁니다.

## 상태

Branded UI는 실험 단계이며 `1.0` 이전까지 API가 변경될 수 있습니다.

## Branded UI 작동 방식

먼저 데이터나 앱 상태를 끌어오지 않은 채 화면 계약부터 선언합니다.

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

그다음 Hook과 데이터 호출, 상태 전이를 Binding으로 옮깁니다. Binding에는 앞서 선언한 레이아웃과 상태가 주어지며 모든 상태를 빠짐없이 처리해야 합니다.

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

같은 계약을 가져다 쓰면 데이터 계층 없이도 독립된 시나리오를 렌더링할 수 있습니다.

```tsx
// Orders.scenario.tsx — Story와 테스트에서 이 컴포넌트를 가져와 사용합니다.
const Layout = OrdersUI.layout.component;
const Pending = OrdersUI.states.pending;

export const PendingOrders = pureUI(() => (
  <Layout content={<Pending.content.Message />} />
));
```

상태를 빠뜨리거나 잘못된 슬롯에 컴포넌트를 넣으면 TypeScript 오류가 납니다. props가 맞지 않거나 브랜드 역할을 어겨도 마찬가지입니다. Oxlint 플러그인을 함께 쓰면 UI 모듈이 Binding을 import하는 경우처럼 파일 단위에서만 찾을 수 있는 문제도 잡아냅니다. Storybook과 테스트는 같은 UI 계약을 렌더링하고, CI와 pre-commit hook은 이 규칙이 계속 지켜지는지 확인합니다.

## 예제

중첩 Binding과 TanStack Query, Suspense, Error Boundary, Oxlint를 함께 쓰는 예제는 [`examples/react-vite-oxlint`](examples/react-vite-oxlint)에 있습니다.

## 핵심 개념

Branded UI는 화면을 함수형 코어로 두고 바깥의 Binding이 앱 동작을 맡는 구조입니다.

| 개념 | 책임 |
| --- | --- |
| **Pure UI** | 데이터와 액션을 props로만 받는 화면 컴포넌트입니다. |
| **Layout** | 이름이 붙은 슬롯으로 UI가 들어갈 자리를 정하는 구조 컴포넌트입니다. |
| **Sync UI** | 레이아웃 하나와 동기 화면에 필요한 컴포넌트 묶음입니다. |
| **Async UI** | 레이아웃과 상태별 컴포넌트 묶음입니다. 필요하면 Suspense fallback도 함께 선언합니다. |
| **Binding** | UI 계약을 받아 Hook과 데이터 호출, effect, 상태 전이를 맡는 바깥 계층입니다. |
| **Brand** | 역할이 섞이거나 다른 역할로 다시 선언되지 않게 하는 컴파일 타임 표식입니다. |

### 왜 Branded Type을 쓰는가?

TypeScript는 구조가 같으면 같은 타입으로 봅니다. 하지만 UI 역할은 구조만으로 구분하기 어렵습니다. Branded Type은 값의 타입에 외부에서 볼 수 없는 `unique symbol` 표식을 더해 고유한 이름을 붙입니다.

```ts
declare const role: unique symbol;
type Branded<Value, Role> = Value & { readonly [role]: Role };
```

이 표식은 컴파일할 때만 쓰입니다. 실제 값이 일반 컴포넌트여도 TypeScript는 `PureUI`, `LayoutUI`, `Binding`을 서로 다른 역할로 구분합니다. 덕분에 컴포넌트를 엉뚱한 역할에 쓰거나 다른 역할로 다시 선언하면 타입 오류가 납니다.

브랜드 자체가 런타임 값을 감싸지는 않습니다. 실행할 때는 평소처럼 프레임워크 컴포넌트를 조합하고, 브랜드는 구조적 타입에 없는 아키텍처 정보만 전달합니다.

## 패키지

| 패키지 | 목적 | 문서 |
| --- | --- | --- |
| [`@jayjnu/branded-ui`](packages/core) | 프레임워크에 종속되지 않는 역할 계약 | 소스 패키지 |
| [`@jayjnu/branded-ui-react`](packages/react) | React 팩토리와 Binding, exhaustive 상태 처리, Suspense 조합 | [React 가이드](packages/react/README.ko.md) |
| [`@jayjnu/oxlint-plugin-branded-ui-react`](packages/oxlint-plugin-branded-ui-react) | React 프로젝트에서 아키텍처 규칙을 검사하는 Oxlint 플러그인 | [플러그인 가이드](packages/oxlint-plugin-branded-ui-react/README.md) |

## 왜 이런 계약이 필요한가?

### 순수 UI는 결정적이다

같은 입력을 주면 늘 같은 결과를 내놓는 UI가 순수 UI입니다. 함수형 코어로 작동하므로 이해와 테스트가 쉽고, 다른 곳에 가져다 쓰거나 따로 렌더링하기도 편합니다. 하지만 React가 이 경계를 지켜주지는 않습니다. Context와 Hook으로 어디서든 앱 로직에 접근할 수 있게 되면서 화면과 로직을 나누는 일은 개발자의 선택에 맡겨졌습니다.

UI 컴포넌트를 만들면 보통 앱과 Storybook, 테스트 세 곳에서 씁니다. 말단 컴포넌트에서 데이터를 직접 불러오거나 앱의 숨은 상태에 기대면 당장은 편합니다. 대신 Storybook과 테스트에서도 똑같은 환경을 만들어야 합니다. 경계가 흐릴수록 컴포넌트끼리 강하게 얽히고 유지보수도 어려워집니다.

### AI 에이전트에는 기계로 검증 가능한 경계가 필요하다

AI 에이전트가 코드를 쓰기 시작하면서 이 셈법도 달라졌습니다. 코드를 만드는 비용보다 제대로 만들었는지 확인하는 비용이 더 큽니다. 서로 다른 세션에서 만든 코드가 잘 맞물리고 규모가 커져도 버틸지는 더 꼼꼼히 살펴야 합니다. 아키텍처를 개발자의 머릿속이나 설명문에만 남겨둘 수 없는 이유입니다.

눈으로 확인할 방법도 필요합니다. 에이전트가 한 세션에서 여러 컴포넌트와 상태별 화면을 만들었다면 사람이 결과를 한눈에 비교할 수 있어야 합니다. 이제 Storybook 같은 독립 쇼케이스는 선택 사항이 아닙니다. 의미 있는 시나리오를 언제든 같은 모습으로 다시 열어볼 수 있어야 합니다.

Branded UI는 이 경계를 코드에 남깁니다. 컴파일 타임 브랜드가 프레젠테이션 컴포넌트와 레이아웃, 상태, Binding의 역할을 구분합니다. TypeScript는 이들이 올바르게 조합됐는지 확인하고 린트 규칙은 타입만으로 알 수 없는 파일 경계를 살핍니다. CI나 pre-commit hook에서 검사를 돌리면 AI 에이전트도 규칙을 어긴 순간 바로 피드백을 받습니다.

## 설계 원칙

### Functional Core, Imperative Shell

Branded UI의 중심에는 잘 알려진 **Functional Core, Imperative Shell** 원칙이 있습니다.

UI 선언은 함수형 코어입니다. 외부 환경을 직접 들여다보지 않고 명시적인 props만 받아 레이아웃과 화면 상태를 그립니다. 입력이 같으면 결과도 같습니다.

Binding은 명령형 셸입니다. Hook과 API 호출, effect, 상태 전이를 맡습니다. 계속 바뀌는 외부 상황을 UI가 이해할 수 있는 입력과 유한한 화면 상태로 바꿔 함수형 코어에 넘깁니다. 이렇게 하면 앱 로직까지 억지로 순수하게 만들지 않아도 화면은 결정적으로 유지됩니다.

### UI 계약으로 옮긴 SOLID

Branded UI는 SOLID의 원칙도 UI 컴포넌트 정의 방식에 맞게 풀어냅니다. 새 프레임워크를 강요하려는 게 아닙니다. 검증된 설계를 타입 계약으로 만들어 자연스럽게 따르도록 하는 것이 목표입니다.

- **단일 책임.** Pure UI는 화면을 그리고 Layout은 구조를 잡습니다. 앱 동작은 Binding이 맡습니다. 각 역할이 바뀌는 이유도 서로 다릅니다.
- **의존성 역전.** Binding은 UI 계약을 바라봅니다. 화면 컴포넌트는 props가 어떤 API 클라이언트나 상태 관리 도구에서 왔는지 알 필요가 없습니다.
- **인터페이스 분리.** 이름 붙은 슬롯은 조합할 자리만 엽니다. Binding은 허용된 자리에서만 UI를 조합합니다.
- **상태를 값으로 다루기.** 조건문 곳곳에 상태 처리를 흩어놓지 않습니다. UI 상태를 값으로 선언하고 빠짐없이 매칭합니다.
- **상속보다 조합.** 기존 프레임워크의 컴포넌트 모델은 그대로 둔 채 역할 정보만 더합니다.
- **기술 선택은 계약 밖에 두기.** 프레임워크와 컴포넌트 라이브러리, 상태 관리 도구, 데이터 클라이언트, 스타일 도구가 바뀌어도 UI의 핵심 역할은 유지됩니다.
- **좋은 설계를 코드로 검사하기.** 타입과 린트 규칙이 사람과 AI 에이전트 모두 바로 고칠 수 있는 피드백을 줍니다.

## 라이선스

[MIT](LICENSE)
