# Pocka Brand Mark

## Problem Statement

Pocka uses unrelated placeholder symbols in its main brand locations: a baht symbol in the protected Sidebar, a letter `P` in the Marketing navigation and Login dialog, and an unrelated purple browser favicon. Users therefore see different visual identities while moving from the browser tab to Marketing, authentication and the financial Dashboard. The full mascot artwork cannot simply be scaled down because its limbs, textures and facial details become unclear at icon sizes.

## Solution

Introduce one recognizable Pocka Brand Mark: a simplified SVG coin purse with a green rounded body, twin gold clasp and friendly smiling face. Use the same geometry in the Sidebar, Marketing header, Login dialog and favicon. Keep the Pocka Wordmark beside the icon where space and context require the product name, while the Login dialog may use the mark alone at a larger size.

## User Stories

1. As a new visitor, I want to recognize Pocka immediately in the Marketing navigation, so that the page feels like a coherent product rather than a template.
2. As a returning user, I want the Login dialog to show the same Pocka identity as the Marketing page, so that I know I am authenticating into the expected product.
3. As an authenticated user, I want the Sidebar to use the Pocka Brand Mark, so that the protected application retains the identity established before login.
4. As a browser user, I want the tab favicon to match the product interface, so that I can find Pocka among open tabs.
5. As a user, I want the Brand Mark to resemble the coin-purse mascot, so that the compact logo still feels specific to Pocka.
6. As a user, I want the mark to include a friendly face, so that Pocka retains its warm and approachable personality.
7. As a user, I want the gold clasp to remain visible, so that the icon reads as a purse rather than a generic green circle.
8. As a user, I want the mark to remain clear at favicon size, so that its eyes, smile and clasp do not merge into visual noise.
9. As a user, I want the mark to remain crisp on high-density screens, so that it does not look blurred beside text and controls.
10. As a Light Theme user, I want the icon to have clear edges and contrast, so that it is visible on bright surfaces.
11. As a Dark Theme user, I want the same icon to remain equally recognizable, so that switching Theme does not weaken the brand.
12. As a user moving between themes, I want the mark's silhouette and identity to remain stable, so that Theme does not appear to switch logos.
13. As a desktop Dashboard user, I want the new icon to fit the current Sidebar brand slot, so that navigation alignment remains familiar.
14. As a collapsed-Sidebar user, I want the compact mark to remain centered and unclipped, so that it works without the Pocka Wordmark.
15. As a mobile user, I want existing navigation behavior to remain unchanged, so that introducing the mark does not consume content space.
16. As a Marketing visitor, I want “Pocka” to remain written beside the mark, so that the product name is explicit.
17. As an authenticated user, I want “Pocka” to remain written beside the mark when the Sidebar has room, so that the brand name is easy to learn.
18. As a Login dialog user, I want the larger mark to feel balanced with the heading and provider button, so that it supports rather than dominates the authentication task.
19. As a Google sign-in user, I want Google's official `G` and button treatment to remain unchanged, so that I can distinguish the authentication provider from Pocka.
20. As a screen-reader user, I want repeated decorative marks omitted from spoken output when visible copy already names Pocka, so that the interface remains concise.
21. As a keyboard user, I want the existing focus order and controls unchanged, so that decorative branding does not introduce new focus stops.
22. As a user, I want the Brand Mark to contain no letter or currency symbol, so that its identity comes from Pocka's character rather than another placeholder.
23. As a user, I want the icon to load with the application without a delayed layout shift, so that brand placement remains stable.
24. As a developer, I want one shared Brand Icon component for application surfaces, so that geometry and size variants do not drift between pages.
25. As a developer, I want the favicon derived from the same SVG geometry, so that the unavoidable standalone asset still follows the shared mark.
26. As a developer, I want consumers to own placement while the shared component owns icon geometry, so that layout and brand responsibilities remain clear.
27. As a product owner, I want old `P`, `฿` and unrelated favicon placeholders removed, so that no obsolete identity remains visible.

## Implementation Decisions

- Build the Pocka Brand Mark as code-native SVG rather than raster artwork. It must scale cleanly and remain maintainable as a small set of meaningful shapes.
- The primary silhouette is a rounded green coin purse with a gold top frame and twin clasp. The face uses two simple eyes and a smile.
- Omit limbs, held coins, fabric texture, complex lighting, text, letters and currency symbols. These details reduce clarity at small sizes.
- Use one square view box, consistent proportions and internal safe area across all UI consumers.
- Create a shared presentational Brand Icon component that owns SVG geometry and explicit size variants. It has no business state, persistence, navigation or event behavior.
- Support compact navigation sizing around 32–34 CSS pixels and a Login presentation around 56–64 CSS pixels. Consumers may set documented sizes but cannot alter individual SVG parts.
- Keep the Pocka Wordmark beside the Brand Mark in the expanded Sidebar and Marketing navigation.
- Preserve collapsed Sidebar behavior: the Wordmark may hide at existing responsive breakpoints while the centered icon remains visible.
- Use the larger Brand Mark alone in the Login dialog because the heading and supporting copy provide the product context.
- Replace the existing standalone favicon with an SVG derived from the exact same geometry. A slightly stronger outline or simplified facial stroke is allowed only when necessary for 16-pixel legibility.
- Use Pocka semantic green and gold colors. Add shared semantic Brand tokens if existing tokens do not describe the mark accurately; avoid consumer-specific hard-coded recoloring.
- Make the mark decorative with `aria-hidden` when adjacent visible text or dialog content already identifies Pocka. It never becomes a button or focus target.
- Preserve the Login dialog's Google provider image, copy, color treatment, URL and focus behavior. The Pocka mark appears above the authentication content and does not replace Google's `G`.
- Preserve existing Marketing navigation, Login dialog, Sidebar and responsive behavior except for replacing their placeholder brand symbols.
- The shared Brand Icon component owns its matching CSS Module only if custom styles are required. Every materially changed styled component continues to follow same-basename CSS Module ownership and domain-explicit class/function naming.
- No backend, API, database or authentication-contract change is required.

## Testing Decisions

- Use existing Application and Marketing integration tests as the principal seam. Verify that the Sidebar, Marketing navigation and opened Login dialog render the Pocka Brand Mark while obsolete `P` and `฿` placeholders are absent from brand slots.
- At the same seam, verify opening and closing the Login dialog, focus restoration, Theme switching and the Google sign-in link remain unchanged.
- Test accessible behavior through roles and names: decorative marks must not create extra accessible images, buttons or repeated “Pocka” announcements.
- Add a focused shared-component test only if the integration seam cannot verify explicit size variants. Do not test internal SVG path strings or implementation-specific element counts.
- Use a browser matrix at 16, 24, 32 and 64 CSS pixels to inspect silhouette, clasp, eyes, smile, clipping and sharpness.
- Check the Sidebar, collapsed Sidebar, Marketing header and Login dialog at desktop, tablet and 320-pixel mobile widths in Light and Dark themes.
- Verify the favicon loads successfully as SVG, uses the approved Pocka geometry and remains legible in a browser tab preview. A source-level existence check alone is insufficient visual evidence.
- Compare bounding boxes before and after replacement to verify no brand-slot layout shift, navigation overflow or dialog reflow.
- Preserve existing provider-brand tests and Login interaction tests as regression coverage.
- Run repository typecheck, lint, production build and full tests after implementation. Record browser screenshots and review results with the implementation tickets.

## Out of Scope

- Changing the Pocka product name or Wordmark typography.
- Redesigning the full Pocka mascot or its Dashboard reaction assets.
- Creating animated Brand Mark behavior.
- Replacing navigation icons for Dashboard features.
- Changing the Google sign-in mark, provider button, authentication flow or return URL.
- Adding Apple, Microsoft or other authentication providers.
- Changing Sidebar navigation behavior, Marketing content or Login dialog workflow.
- Producing native mobile-app icons, social preview images, print assets or a complete external brand-guideline package.
- Backend, API or database changes.

## Further Notes

- ADR-016 is the governing design decision for this feature.
- “Pocka Brand Mark” means the icon geometry; “Pocka Wordmark” means the adjacent written product name. Consumers should not call either one a mascot image.
- This repository currently uses local specification tracking. Publishing to an external tracker requires project tracker configuration through `/setup-matt-pocock-skills`.
