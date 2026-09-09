# ADR-016: Pocka Brand Mark

## Status

Accepted on 2026-09-09 after the user approved a smiling Pocka icon and its use as the site favicon.

## Context

Pocka currently uses unrelated text placeholders for its compact brand symbol: `฿` in the protected application, `P` in the Marketing navigation and another `P` in the Login dialog. The browser favicon is an unrelated purple mark. These symbols do not carry the visual identity of the Pocka coin-purse mascot and make the product appear inconsistent across entry, authentication and application surfaces.

The full mascot artwork contains texture, limbs and small details that disappear at navigation and favicon sizes. A compact Brand Mark therefore needs a deliberately simplified silhouette rather than a scaled copy of the raster mascot.

## Decision

- Create one reusable **Pocka Brand Mark** as a code-native SVG: a rounded green coin purse with a gold clasp and a simple smiling face.
- Preserve the mascot's recognizable green body, twin gold clasp and friendly expression. Omit arms, legs, coins, gradients that require fine detail, lettering and currency symbols.
- Use the same geometry and proportions in the protected Sidebar, Marketing navigation, Login dialog and browser favicon.
- Keep the `Pocka` wordmark beside the icon in Sidebar and Marketing navigation. The Login dialog may use the mark alone at a larger display size because its surrounding copy already names the product.
- Provide a reusable Brand Icon component for application UI instead of copying SVG markup into multiple components. The component owns explicit size variants and remains presentation-only.
- Use a compact navigation variant around 32–34 CSS pixels and a larger Login variant around 56–64 CSS pixels. Preserve a square view box and internal safe area so the clasp is not clipped.
- The SVG uses Pocka's semantic green and gold palette with sufficient outline contrast on Light and Dark surfaces. It must remain recognizable at 16 CSS pixels for browser tabs.
- The favicon uses the same mark, with no wordmark or surrounding text. It may use a slightly stronger outline or simplified facial strokes for legibility at 16 pixels, but cannot change the silhouette or become a separate logo.
- When visible text already identifies Pocka, render the mark as decorative and exclude it from the accessibility tree. The favicon has no interactive semantics.
- Preserve the Google `G` and provider-button treatment in the Login dialog. The Pocka Brand Mark identifies the product above the form and never replaces or visually imitates the Google provider mark.
- Apply component stylesheet ownership and domain-explicit naming rules to every changed UI component. Brand geometry belongs to the shared component; placement and surrounding layout belong to each consuming component.

## Acceptance qualities

- At 16, 24, 32 and 64 CSS pixels, the mark reads as the same smiling coin-purse character without relying on the letter `P` or `฿`.
- The gold clasp remains visible and the eyes and smile do not merge at the smallest size.
- The mark has no clipping, blur or uneven stretching at supported device-pixel ratios.
- Light and Dark themes keep equivalent prominence without a theme flash or separate brand identity.
- Sidebar collapse and mobile navigation behavior remain unchanged because only the existing compact brand slot changes.
- Marketing header and Login dialog retain their current spacing, focus order and Google sign-in semantics.

## Consequences

- Pocka gains one consistent Brand Mark across anonymous, authentication, protected and browser surfaces.
- The shared component becomes the source of truth for in-application icon geometry, while the favicon remains a standalone SVG derived from that geometry because HTML cannot render a React component as a favicon.
- Changes to the mark require checking a multi-size matrix in both themes as well as the browser tab representation.
- Existing `P` and `฿` placeholders and the unrelated favicon are removed once all consumers migrate.

## Alternatives considered

- Reuse the full raster mascot: rejected because facial and material detail becomes muddy and the limbs weaken the silhouette at small sizes.
- Use only a `P`: rejected because it does not distinguish Pocka from a generic letter badge.
- Use only `฿`: rejected because it communicates currency but not the product's mascot identity.
- Create separate icons for each surface: rejected because small placement differences would fragment the brand and increase maintenance.

