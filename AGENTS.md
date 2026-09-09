# Project instructions

Before designing, creating, editing or reviewing project code, read:

1. `docs/CODING-STANDARDS.md` — component ownership and naming rules.
2. `docs/ARCHITECTURE.md` — dependency and feature boundaries.
3. `docs/CSS-ARCHITECTURE.md` — styling, theme, accessibility and motion rules.

Treat these standards as acceptance criteria from the start of each task, for both frontend and backend. Current explicit user instructions take precedence over repository conventions.

- A UI component with its own styles owns a colocated CSS Module with the same basename: `TransactionForm.tsx` and `TransactionForm.module.css`.
- Do not introduce feature-wide shared stylesheets for unrelated components or import another component's private CSS Module. Reuse a shared UI component through its public props instead.
- Name CSS classes by domain/component, purpose and element role, using kebab-case and full words, such as `transaction-edit-button`.
- Give project-owned functions explicit domain and behavior names. Do not introduce ambiguous business operations such as `add`, `next`, `save` or `process` without their subject. Follow the function naming policy in `docs/CODING-STANDARDS.md`, including framework-required exceptions.
- Apply the standards to new and materially changed components/functions. Keep legacy migration bounded to the task, identify remaining migration work explicitly, and verify behavior after moving styles or renaming symbols.
- Review compliance before completion. Documentation and review currently enforce these semantic rules; do not claim automated enforcement unless an actual check was added and run.
