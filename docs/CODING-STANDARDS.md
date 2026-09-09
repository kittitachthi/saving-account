# Coding standards

These standards prioritize maintainability for multiple developers. They apply to web UI, hooks, API clients, backend routes/services/repositories, shared contracts and project-owned utilities. Read them before implementation and use them during review.

## Component and file ownership

- Name React component files in PascalCase, matching the principal component export.
- A `.tsx` component that owns custom styles must own a colocated `<ComponentName>.module.css`. For example, `TransactionActions.tsx` imports `./TransactionActions.module.css`, and `TransactionForm.tsx` imports `./TransactionForm.module.css`.
- Do not create an empty stylesheet for a composition-only component, a provider or an unstyled component. Hook/utility files that do not contain JSX use `.ts`.
- A file may contain small private rendering helpers belonging exclusively to its main component. Extract a separate component when it has independent responsibility, state, reuse or a useful testing boundary; do not split markup merely to satisfy file counts.
- The stylesheet contains that component's layout, states, responsive rules and motion rules. Do not collect independently maintained components into a feature-wide stylesheet such as `Transactions.module.css`.
- A parent owns layout around a child; the child owns its internal appearance. Communicate variants and open/closed states through explicit props/callbacks. Do not select another component's private classes or depend on its internal DOM structure.
- Reuse shared UI through a real shared component and its public API. Shared primitives own their own matching CSS Modules. Do not duplicate an entire button/dialog design just to preserve file pairing, and do not create speculative shared abstractions.
- Global CSS remains limited to reset, fonts, document defaults and design tokens. Dynamic values such as chart geometry or calculated positions may use inline styles/custom properties.

## CSS class naming

Use lowercase kebab-case with the structure **owner-purpose-element**, where each part contributes meaning. The owner is the domain or component, the purpose is its action or meaning, and the element is its UI role. Do not invent an action for a passive element.

| Role | Class |
|---|---|
| Edit transaction button | `transaction-edit-button` |
| Save transaction form button | `transaction-save-button` |
| Transaction action list | `transaction-actions-popover` |
| Transaction amount field | `transaction-amount-input` |
| Expense chart legend | `expense-chart-legend` |
| Empty transaction list message | `transaction-empty-message` |

Use full words (`button`, `container`, `message`) rather than abbreviations (`btn`, `cnt`, `msg`). Prefer meaning over visual implementation: avoid `red-button`, `left-box`, `style1`, or generic `wrapper`/`actions` without an owner. Local state classes remain descriptive, for example `transaction-actions-open`; native states such as `:disabled`, `:focus-visible` and ARIA state attributes are appropriate when they describe the behavior.

Access kebab-case exports explicitly:

```tsx
<button className={styles["transaction-edit-button"]}>แก้ไข</button>
```

The prefix improves searchability and ownership for this team; CSS Modules already provide technical name isolation. Their documentation recommends camelCase for dot access, but this project intentionally chooses kebab-case with bracket access. See [CSS Modules naming](https://github.com/css-modules/css-modules/blob/master/docs/naming.md) and [local scope](https://github.com/css-modules/css-modules/blob/master/docs/local-scope.md).

## Function and API naming

Every project-owned named function must reveal its behavior and subject at the call site. A name must distinguish opening an editor, validating input, sending a request and persisting a change; these are different operations.

Use **domain + operation** in lowerCamelCase, following the user's requested example `transactionEdit`. This is the current project default; verb-first alternatives were suggested for discussion but are not a second interchangeable convention.

| Responsibility | Example |
|---|---|
| Open a transaction editor | `transactionEditDialogOpen` |
| Handle an edit request in the UI | `handleTransactionEditRequest` |
| Notify a parent of an edit request | `onTransactionEditRequest` |
| Manage transaction editing state in a hook | `useTransactionEditor` |
| Send an update through an API client | `transactionUpdateRequest` |
| Handle an incoming update HTTP request | `transactionUpdateHandler` |
| Apply the update use case | `transactionUpdate` |
| Persist the update in a repository | `transactionUpdatePersist` |
| Validate transaction input | `transactionInputValidate` |
| Calculate available Wallet balance | `walletAvailableBalanceCalculate` |

These are examples for responsibilities that exist, not a requirement to introduce extra layers or wrappers. Within a layer, add a suffix only when it distinguishes real responsibilities.

- Use lowerCamelCase for functions/methods, PascalCase for React components and `use…` for React hooks.
- Use `handle…` for UI event handlers and `on…` for callback props, retaining the domain and event, such as `handleTransactionEdit` and `onTransactionEdit`.
- API client names state the operation/resource. Backend handlers, services and repository methods also state their resource and responsibility; placing a vague method inside a class does not automatically satisfy the team's naming rule.
- Prefer accurate verbs: opening a form is not editing persisted data, validation is not saving, and deleting a transaction is not deleting its Wallet.
- Avoid ambiguous names such as `add`, `next`, `save`, `run`, `process`, `dataHandler`, or `handleClick` for project business functions. Avoid equally unclear long names and redundant repetition of layers.
- A short inline callback passed directly to `map`/`filter` does not need an artificial named wrapper. Name callback parameters meaningfully. Extract nontrivial workflow logic into a named function when it benefits understanding or testing.
- Preserve names required by frameworks, third-party contracts, generated code, interface implementations and standards. For example, Express's middleware continuation `next` is not the application's “next transaction” operation. Existing public contracts need a deliberate compatibility plan before renaming.
- Do not rename HTTP paths, database tables/columns or JSON fields merely to match an internal function naming rule.

## Adoption and review

- These rules apply immediately to new code. Materially changed components/functions should adopt them within the current task's scope.
- Existing code is migration work, not a precedent for adding further exceptions. If splitting a shared stylesheet or renaming a public method would expand the task substantially, identify the affected code and record the remaining work; do not silently rewrite unrelated features.
- The first migration covers the former `Transactions.module.css` consumers and generic Transaction/Wallet operations such as `add`, `create` and `edit`. Later migrations must apply the same rules while preserving public behavior, money precision, focus, stacking order, themes and reduced motion.
- Before completion, check file pairing, CSS ownership, class names, function semantics and dependency direction. After code changes, run checks appropriate to the affected behavior. Documentation-only changes do not require application tests.
- These rules are currently enforced through repository instructions and code review. Automated lint checks are a separate implementation task, and syntax checks alone cannot establish whether a name accurately describes its behavior.
