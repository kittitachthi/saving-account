# ADR-014: Component stylesheet ownership and explicit naming

## Status

Adopted for new work on 2026-09-09, following the user's request for maintainability across multiple developers. Function ordering defaults to the user's domain-first example; a verb-first alternative remains open for discussion and is not an additional allowed convention.

## Context

`TransactionActions.tsx`, `TransactionForm.tsx`, `TransactionPanel.tsx` and other independent UI components currently share `Transactions.module.css`. This obscures ownership and makes unrelated developers more likely to modify the same file. Generic function names such as `add` or `edit` also omit the business subject when read at a call site.

The previous CSS guide explicitly allowed one module for a group of components and recommended short local class names. CSS Modules make that technically valid, but the team now prioritizes explicit ownership and searchability.

## Decision

1. Each UI component with its own styles owns a colocated stylesheet with the same basename. No empty stylesheets for unstyled/composition-only components. Shared UI is reused through actual shared components and public props, not through other components' private stylesheets.
2. CSS classes use owner-purpose-element in kebab-case, with full words: `transaction-edit-button`. Access exported names with bracket notation.
3. Project-owned functions use explicit domain + operation names in lowerCamelCase across frontend and backend. Preserve React component/hook/callback conventions and framework-required names. Name the actual effect: opening an editor, validating input and persisting an update are distinct operations.
4. Read the standards before implementation and check them before completion. Root `AGENTS.md` points to the normative guides.
5. Apply the rules to new work and bounded changes to existing code. Do not perform a repository-wide refactor as part of adopting the documentation. Track migration debt explicitly and preserve behavior during subsequent migration.

The normative examples and exceptions are in [Coding standards](CODING-STANDARDS.md). This decision updates the component-group ownership and class-naming conventions in [CSS Architecture](CSS-ARCHITECTURE.md); it does not replace the feature architecture or the decision to use CSS Modules/design tokens in ADR-005/006.

## Consequences

- More files and longer names, with clearer ownership and more discoverable intent.
- Prefixes are intentional team conventions, not a requirement for CSS isolation. Kebab-case requires bracket access in TypeScript.
- Component boundaries must be preserved when splitting styles: communicate state through props/callbacks instead of reaching across private selectors.
- Existing code, including transaction styles and generic wallet method names, remains migration debt until separately addressed. Renaming exported symbols requires updating callers and tests; internal naming changes do not imply changing HTTP or database contracts.
- Documentation and review enforce these rules today. Automated filename or naming checks may be added later; semantic accuracy still requires review.

## Alternatives considered

- Keep feature-wide stylesheets and short local names: valid with CSS Modules but does not meet the team's requested ownership convention.
- Create a CSS file for every TSX file regardless of content: rejected because empty files add maintenance without clarifying ownership.
- Use verb-first function names such as `editTransaction`: a readable alternative offered to the user; retain domain-first until the user selects a change.
- Rename framework continuations or generated methods mechanically: rejected because their contracts and conventional meanings already define their roles.

## Sources

- [CSS Modules local scope](https://github.com/css-modules/css-modules/blob/master/docs/local-scope.md)
- [CSS Modules naming guidance](https://github.com/css-modules/css-modules/blob/master/docs/naming.md)
