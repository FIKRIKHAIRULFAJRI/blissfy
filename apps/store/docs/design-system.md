# Blissfy Storefront Design System

## 1. Design Direction

Blissfy is a modern Korean/editorial fashion storefront with a serene, sophisticated, intentional, and approachable personality. It should feel curated rather than crowded, premium rather than ostentatious, and smart-casual rather than formal luxury.

The exact Stitch principles are:

- **Spatial luxury:** use generous negative space so fashion photography and product information can breathe.
- **Editorial rhythm:** create hierarchy through a strong contrast between large, tightly set headings and delicate functional labels.
- **Subtle tactility:** layer white focus surfaces over an Oat canvas with very soft ambient shadows.
- **Lowercase modernism:** preserve the lowercase `blissfy.co` wordmark as a humble but confident brand signal.
- **Curated simplicity:** present only information that advances discovery, evaluation, or purchase.

Photography is the dominant visual content. Interface chrome supports the images and should not compete with them. Product photography must be consistently rounded; editorial photography may lead entire sections while maintaining disciplined alignment and whitespace.

The visual hierarchy should follow this order: photography or page-level editorial statement, product or task title, price or primary action, supporting copy, then labels and metadata. Whitespace is structural, not decorative: use it to separate ideas, establish pace, and prevent commerce flows from feeling transactional or dense.

Blissfy should feel calm, warm, modern, editorial, tactile, and easy to shop. It must not resemble a SaaS product, an admin dashboard, a generic marketplace, an excessively luxurious fashion house, or a playful trend shop. Avoid dense toolbars, floating dashboard cards, aggressive promotional color, ornate luxury treatments, novelty shapes, and decorative motion.

## 2. Source of Truth

The storefront visual hierarchy is:

1. The Stitch project **Blissfy.co Korean Fashion E-commerce** and its `DESIGN.md`.
2. This `apps/store/docs/design-system.md` document.
3. Shared storefront UI, commerce, and layout components.
4. Individual storefront pages.

Individual pages must compose shared rules; they must not create page-specific colors, type scales, spacing scales, radii, shadows, or interaction conventions. If a screen requires a new visual rule, update this document and the relevant shared primitive before using it in a page.

Confidence labels used here:

- **Exact:** explicitly exposed by Stitch project metadata or `DESIGN.md`.
- **Approximation:** visually described by Stitch but not exposed as a precise numeric value. Preserve the described behavior without treating the number as canonical.
- **Recommended:** implementation guidance needed to make the system usable when Stitch does not expose a rule. Recommendations may be revised after direct visual comparison with Stitch previews.

## 3. Color System

The storefront palette is deliberately narrow. Oat is the canvas, Charcoal is the anchor, and white is the focus layer. Dusty Rose and Steel Blue are named by Stitch for functional signals, but their exact values are not exposed and must not be invented as canonical tokens.

| Semantic token | Value | Confidence | Use |
|---|---:|---|---|
| `--color-canvas` | `#F3EFE9` | Exact | Primary Oat page canvas |
| `--color-background` | `#FDF8F7` | Exact | Rendered warm background/surface |
| `--color-surface` | `#FFFFFF` | Exact | Cards, drawers, inputs, modals |
| `--color-surface-low` | `#F7F3F1` | Exact | Quiet tonal panel |
| `--color-surface-container` | `#F1EDEC` | Exact | Disabled/skeleton base |
| `--color-surface-high` | `#EBE7E6` | Exact | Stronger tonal layer |
| `--color-surface-highest` | `#E5E2E0` | Exact | Highest neutral tonal layer |
| `--color-text-primary` | `#1C1B1B` | Exact | Primary rendered text |
| `--color-text-brand` | `#2C2C2A` | Exact | Charcoal brand anchor and high-priority action |
| `--color-text-secondary` | `#484740` | Exact | Supporting text |
| `--color-text-muted` | `#6E6C68` | Exact | Metadata, placeholders, disabled text |
| `--color-border` | `#CAC6BD` | Exact | Outline variant/default border |
| `--color-border-strong` | `#79776F` | Exact | Strong outline |
| `--color-action-primary` | `#2C2C2A` | Exact | Primary action background |
| `--color-action-primary-text` | `#F3EFE9` | Exact | Preferred primary-action text; white is also exposed as on-primary |
| `--color-error` | `#BA1A1A` | Exact | Accessible error foreground |
| `--color-error-surface` | `#FFDAD6` | Exact | Soft error container |
| `--color-success` | TBD | Recommended | Restrained positive status; verify before implementation |
| `--color-success-surface` | TBD | Recommended | Restrained positive surface |
| `--color-warning` | TBD | Recommended | Pending/attention foreground |
| `--color-warning-surface` | TBD | Recommended | Pending/attention surface |
| `--color-disabled` | `#E5E2E0` | Recommended mapping | Disabled control surface |
| `--color-disabled-text` | `#6E6C68` | Recommended mapping | Disabled content |
| `--color-skeleton` | `#F1EDEC` | Recommended mapping | Pale Oat skeleton base |
| `--color-skeleton-highlight` | `#F7F3F1` | Recommended mapping | Pale Oat shimmer highlight |

Accents must stay below approximately 3% of a screen. Do not add a broad brand palette or use status colors as general navigation, hover, or decorative colors.

## 4. Typography

Poppins is the canonical storefront family for headings, body, labels, and controls.

| Stitch role | Size | Weight | Line height | Letter spacing | Confidence |
|---|---:|---:|---:|---:|---|
| Display Desktop | 48px | 600 | 1.1 | `-0.02em` | Exact |
| Display Mobile | 32px | 600 | 1.2 | `-0.01em` | Exact |
| Heading | 24px | 600 | 1.3 | `-0.01em` | Exact |
| Body Large | 18px | 400 | 1.6 | `0` | Exact |
| Body | 16px | 400 | 1.6 | `0` | Exact |
| Label | 12px | 500 | 1 | `0.05em` | Exact |

Semantic roles:

- **Display:** use the exact display tokens for major editorial statements only.
- **Page title:** use Display Mobile or Heading depending on page density; **Recommended** because Stitch does not expose a separate page-title token.
- **Section title:** use Heading.
- **Card title:** use Body with medium/semibold emphasis; **Recommended** weight 500–600.
- **Product title:** use Body; weight 500–600 is **Recommended**.
- **Price:** use Heading scaled down where required by density, as described in Stitch; exact scaled value is not exposed.
- **Body:** use Body.
- **Supporting text:** use Body or a smaller implementation size only when necessary; any smaller size is **Recommended**.
- **Label:** use Label; uppercase is appropriate for categories, breadcrumbs, and microcopy, not all interface text.
- **Button:** **Recommended** 14–16px, weight 600, based on control density rather than a new heading role.
- **Caption:** **Recommended** 12–14px with readable line-height; do not reduce below 12px.

Do not create a visual level for every HTML heading element. Semantic HTML and visual roles are separate concerns.

## 5. Spacing System

The exact Stitch scale is 4, 8, 16, 24, 48, and 80px.

| Token | Value | Use |
|---|---:|---|
| `--space-1` | 4px | Fine optical adjustment only |
| `--space-2` | 8px | Icon gaps, label-to-control, compact metadata |
| `--space-3` | 16px | Default component and form-field spacing |
| `--space-4` | 24px | Card padding, content groups, grid gutters |
| `--space-5` | 48px | Related section separation |
| `--space-6` | 80px | Major editorial/page section separation |

- Use 8px inside compact controls and between tightly related text.
- Use 16px between form fields and ordinary component children.
- Use 24px for default card padding and grouped information.
- Use 48px between related page sections.
- Use 80px between major editorial movements.
- Desktop page margin is exactly 60px.
- Mobile page margin is exactly 20px.

Do not add arbitrary spacing because a utility exists. A deviation must be documented as an optical adjustment or added to this scale.

## 6. Layout System

Stitch defines a fluid 12-column desktop grid, 60px desktop margins, and 20px mobile margins. Content should share common alignment lines across headers, hero copy, section headings, product grids, forms, summaries, and footers.

- **Editorial layouts:** let photography occupy dominant columns; alternate image and text without breaking shared alignment.
- **Commerce layouts:** use repeatable grid cells, stable product-card geometry, and a clear path from product information to price and selection.
- **Transactional layouts:** pair the primary task with a quieter summary at desktop widths and stack them on smaller screens.
- **Reading layouts:** constrain line length for policy and explanatory copy without inventing a separate page-wide alignment system.
- **Recommended:** an implementation max-width may be introduced to prevent excessive stretching on large displays, but Stitch does not expose an exact max-width. Validate the chosen width against Stitch before making it canonical.

## 7. Responsive System

Stitch does not expose dedicated mobile screens. Breakpoint numbers are therefore **Recommended**, while the behaviors below are Exact where identified.

| Mode | Recommended range | Behavior |
|---|---:|---|
| Mobile | `< 768px` | 20px margins; minimum 44px targets; two-column product catalog; editorial and transactional content stack; full-width content where appropriate |
| Tablet | `768–1023px` | Preserve 20–32px gutters; allow two/three-column commerce layouts only when content remains readable |
| Desktop | `1024–1439px` | 12-column layout; 60px margins; split commerce/transaction layouts |
| Large desktop | `>= 1440px` | Retain shared alignment and optionally apply a Recommended max-width; do not expand reading measures indefinitely |

Responsive changes should follow content pressure, not create alternate visual languages. Product imagery may be full-width or use a two-column staggered treatment on mobile. Cart, checkout, payment, and tracking flows stack into a single reading order.

## 8. Radius System

| Token | Value | Semantic use |
|---|---:|---|
| `--radius-sm` | 4px | Fine details |
| `--radius-default` | 8px | Badges, tooltips, compact controls |
| `--radius-md` | 12px | Secondary controls and compact surfaces |
| `--radius-lg` | 16px | Primary card, image, button, and input radius |
| `--radius-xl` | 24px | Large feature panels and modals |
| `--radius-full` | 9999px | True circles/pills only |

The primary Blissfy radius is 16px. Do not make every control pill-shaped. Full radius is appropriate for circular swatches, count dots, and controls whose meaning depends on pill/circle geometry.

## 9. Borders and Shadows

Borders are quiet separators, not the primary means of producing hierarchy.

- Default border: 1px `#CAC6BD` where a boundary is necessary.
- Strong/selected border: Charcoal or `#79776F`, depending on emphasis.
- Dividers: use the outline variant or a lower-opacity form of it.
- Focus: a Charcoal border plus a visible focus indicator; exact outer-ring dimensions are **Recommended**.
- Canonical ambient shadow is approximately `0 4px 20px rgba(44, 44, 42, 0.04)`.
- Hover may slightly deepen the ambient shadow; exact value is an Approximation.

Avoid heavy drop shadows, multiple stacked shadow layers, hard black shadows, and floating SaaS-card elevation. Prefer tonal layering: Oat at level 0 and white at level 1.

## 10. Buttons

### Primary

- Exact: Charcoal background with Oat/light text.
- Exact: 16px radius.
- Recommended: minimum 48px height, 20–24px horizontal padding, 14–16px/600 text.
- Hover: slightly lighter Charcoal or a subtle lift/shadow; exact color and shadow are Approximation.
- Active: Recommended subtle `translateY(1px)` or `scale(.99)`.
- Focus-visible: Recommended 2px Charcoal ring with 2–3px offset.

### Secondary

- Transparent background, 1px Charcoal border, Charcoal text.
- Same radius, target size, and typography as Primary.
- Hover may use a quiet Oat/white tonal fill.

### Ghost/Text

- No persistent container.
- Use for low-priority actions and links; hover may underline or use a subtle tonal background.

### Destructive

- Use the Exact error foreground/container tokens.
- Reserve solid destructive fills for explicit high-risk confirmation.

### Disabled

- Use disabled surface and text tokens; retain readable shape and label.
- Do not communicate disabled state through opacity alone.

### Loading

- Retain button width and label context.
- Recommended inline progress indicator only when useful; page-level loading should use skeletons.

## 11. Form Controls

Text, email, phone, textarea, select, radio, checkbox, and search controls share one field system.

- Exact: white surface, 16px radius, 1px light neutral/Oat-tinted border, Charcoal focus border, 12px labels, and minimum 44px interaction target.
- Recommended: 48px single-line height, 16px horizontal padding, 8px label gap.
- Textarea uses the same field styling and grows vertically.
- Select retains native keyboard behavior and uses a restrained chevron.
- Radio is circular; checkbox is slightly rounded. Active controls use Charcoal fills.
- Search should remain visually consistent with text inputs and use a thin-stroke search icon.

States:

- **Default:** white surface, neutral border, primary text.
- **Hover:** stronger neutral border; Recommended.
- **Focus:** Charcoal border plus focus-visible ring.
- **Error:** error border and nearby descriptive error text; do not rely on color alone.
- **Disabled:** disabled surface/text, visible label, native disabled behavior.
- **Filled:** identical to default except populated text; do not add a competing background.

## 12. Product Card

The canonical Blissfy ProductCard is a white, 16px-rounded card with soft ambient shadow and left-aligned information.

- Fashion photography is dominant and uses 16px rounding.
- Product name uses the Body role.
- Current/sale price is visually stronger and remains close to the title.
- Previous price is muted and struck through only when discounted.
- Optional metadata is limited to information that changes purchase understanding.
- Card padding should use the exact 16/24px spacing scale according to density.
- Hover may deepen the shadow or scale the card/image to approximately `1.02`.
- Mobile uses the exact two-column catalog behavior; information must remain readable without adding marketplace CTA buttons.

Avoid excessive badges, large card-level purchase buttons, heavy borders, large shadows, right-heavy information layouts, and dense metadata.

## 13. Product Imagery

Photography leads the experience.

- All fashion photography uses the exact 16px radius.
- Listing images within one grid must use a consistent implementation aspect ratio.
- Product-detail media should use `object-fit: cover` for editorial/product photography unless preserving the full product requires `contain`.
- Thumbnails must share the gallery’s rounding and selection language.
- Editorial photography may use larger formats and asymmetrical layouts while staying on shared grid lines.
- Stitch does not expose a global image aspect ratio. Any chosen ratios are implementation constraints and must not be documented as Exact Stitch values.

## 14. Price System

- **Regular price:** close to the product title, Charcoal, semibold.
- **Discounted/current price:** strongest price in the local group; do not use aggressive promotional color.
- **Previous price:** muted, smaller, struck through.
- **Cart price:** show unit price only when useful; line total receives stronger emphasis.
- **Order total:** stronger size/weight after a divider; use tabular numerals.
- **Payment amount:** one of the strongest transactional elements, below only the status/page heading.

Stitch describes price as `headline-md` scaled down for product cards but does not expose the exact scaled value. That value remains an Approximation until visually verified.

## 15. Commerce Selectors

### Size selector

- Minimum 44px target.
- Default: white, neutral border, Charcoal text.
- Hover: stronger neutral border or quiet Oat fill; Recommended.
- Selected: Charcoal fill with light text.
- Unavailable: muted surface/text with a visible strike indicator.
- Disabled: native disabled behavior and non-color cue.
- Recommended: 8–12px radius; Stitch does not expose exact selector geometry. Do not default to a pill.

### Color selector

- Circular color swatch inside a minimum 44px target.
- White/light swatches require a visible border.
- Selected state must use an outer border/ring in addition to color.
- Unavailable and disabled states require a non-color indicator.
- Exact swatch size and surrounding-control geometry are not exposed.

### Quantity selector

- Minus, value, and plus form one clear control.
- Each interactive segment is at least 44px.
- Default uses white surface and subtle borders; disabled controls retain visible structure.
- Recommended: 12–16px group radius; full-pill treatment is not a canonical requirement.

## 16. Navigation

The canonical desktop header is sticky and white with a lowercase Charcoal `blissfy.co` wordmark, minimal navigation, and thin-stroke search, bag, and user icons.

- Recommended height: 72–80px; Stitch does not expose an exact header height.
- Horizontal alignment follows the 60px desktop margin and 12-column grid.
- Navigation spacing must feel open but not detached; exact gap is not exposed.
- Hover: darken or use a restrained underline.
- Active: Recommended small underline or weight change without an accent-color block.
- Sticky behavior must not obscure anchor targets or focused controls.
- Bag count may use a compact circular badge; the bag itself should not become a heavy marketplace CTA.

## 17. Mobile Navigation

No dedicated Stitch mobile screen exists. The following is conservative, Recommended implementation guidance rather than an alternate design:

- Preserve the white sticky header, lowercase wordmark, and thin-stroke utility icons.
- Use a menu trigger with a minimum 44px target.
- Open navigation in a simple white drawer or full-width sheet.
- Use at least 44px navigation rows, a clear close action, keyboard focus management, and background-scroll locking.
- Preserve visible search and bag access.
- Use a restrained fade/slide; do not add a novel mobile visual language.

## 18. Cart / Shopping Bag

The cart follows the Stitch Shopping Bag and Shopping Bag Empty State screens.

- Desktop uses a cart-item region and a quieter order-summary region; exact column widths are not exposed.
- Cart items are white, 16px rounded surfaces with soft ambient shadow and limited borders.
- Product thumbnail preserves the chosen catalog image ratio and 16px radius.
- Product information includes name, selected color/size, price, availability where needed, and quantity.
- Quantity uses the shared selector; remove is a low-emphasis action.
- Subtotal and order total use clear type hierarchy and tabular numerals.
- Checkout is the dominant Charcoal action.
- Empty cart uses centered Body Large copy, generous whitespace, minimal or no imagery, and a Secondary “Return to Shop” action.
- Mobile stacks items and summary in a logical reading order.

## 19. Checkout

The checkout follows the Stitch Checkout screen.

- Use a focused checkout shell with reduced navigation distraction.
- Group customer information, address, shipping, payment method, and review into clear sections.
- Use shared form controls and the exact spacing scale.
- Shipping options use selectable white surfaces with neutral borders and a clear selected state.
- Order summary is visually quieter than the form but keeps total and primary action prominent.
- The final action is a full-width Charcoal button within its region.
- Errors remain inline, descriptive, and focusable.
- Desktop may use form plus sticky summary; exact dimensions are not exposed.
- Mobile stacks transactional content; preserve one clear reading and focus order.

## 20. Payment

Patterns are derived from the Stitch QRIS Pending, Payment Success, and QRIS Expired screens.

- **Pending:** emphasize QR, payment amount, countdown, concise instructions, and a restrained status action.
- **QR container:** white focus surface, 16px radius, quiet border or ambient shadow; the QR itself remains square.
- **Countdown:** strong numerical hierarchy without an aggressive warning palette.
- **Success:** restrained positive treatment with order/track next step.
- **Expired:** soft error treatment with a clear retry or new-checkout path.
- **Recovery actions:** one clear primary/secondary hierarchy; avoid technical gateway language.
- Exact transaction container widths, QR size, and status accent colors are not exposed.

## 21. Order Tracking

Patterns are derived from Track Order and Order Tracking Detail.

- Track Order uses a focused form with order identifier/contact fields and a clear primary action.
- Tracking Detail prioritizes current status, shipment progress, destination, and order summary.
- The progress timeline must distinguish complete, current, and future steps through text, shape, and color.
- Order items reuse compact commerce imagery, typography, and price rules.
- Shipment information uses grouped white surfaces or subtle dividers.
- Empty/error tracking states use the shared feedback language and preserve entered identifiers when possible.
- Timeline geometry and exact status colors are not exposed by Stitch.

## 22. Feedback States

### Loading

Use pale Oat skeleton/shimmer geometry that matches the final content. Avoid visually technical spinners as the primary page-level treatment. Exact shimmer timing is not exposed; **Recommended** duration is 1.2–1.6 seconds.

### Empty

Center the message, use generous whitespace, minimal or no imagery, Body Large copy, and one clear recovery action. Avoid turning ordinary emptiness into a warning panel.

### Error

Use the exact soft error container/foreground where appropriate. State what happened, preserve user work, and provide one concrete recovery action. Avoid large saturated error regions.

### Success

Use a restrained positive treatment, concise confirmation, and the next useful action. Success colors remain Recommended because Stitch does not expose exact values.

## 23. Motion and Interaction

- Hover motion is restrained and functional.
- Product cards may deepen their shadow or scale to approximately `1.02`.
- Image hover may use the same approximate scale without changing layout.
- Focus is immediate and must not depend on motion.
- Active controls may use a Recommended subtle press movement.
- Drawer/modal motion should use a short fade/slide; exact duration is Recommended.
- Loading transitions should not flash or shift layout.
- Avoid dramatic springs, excessive parallax, animated gradients, unnecessary page transitions, or motion that competes with photography.
- Always honor reduced-motion preferences.

## 24. Accessibility

- Exact minimum touch target: 44px.
- Provide persistent `:focus-visible` treatment with adequate contrast.
- All interactions must be keyboard operable, including navigation, selectors, quantity controls, drawers, and payment recovery.
- Use semantic headings, landmarks, lists, forms, labels, buttons, and links.
- Associate every form control with a visible or programmatic label.
- Connect errors with fields, explain resolution, and move focus appropriately after failed submission.
- Ensure text, borders used for meaning, and control states meet WCAG contrast expectations.
- Honor `prefers-reduced-motion`.
- Product and editorial imagery require useful alt text; decorative imagery uses empty alt text.
- Use buttons for actions and links for navigation; do not style one as the other without preserving semantics.
- Do not communicate status, availability, selection, or error through color alone.

## 25. Component Inventory

Proposed shared architecture only; these components do not yet need to be created:

```text
components/
  ui/
    Button
    Input
    Select
    Checkbox
    Radio
    Textarea
    SearchField
    Container
    Section
    Badge
    Skeleton
    FieldMessage

  commerce/
    ProductCard
    ProductPrice
    ProductGallery
    SizeSelector
    ColorSelector
    QuantitySelector
    CartItem
    OrderItem
    OrderSummary
    ShippingOption
    PaymentStatus
    OrderStatus
    OrderTimeline

  layout/
    StoreHeader
    StoreFooter
    MobileNavigation
    TransactionHeader

  feedback/
    LoadingState
    EmptyState
    ErrorState
    SuccessState
```

Page-specific composition should remain in pages or feature views. Data fetching, order/payment orchestration, checkout state, and screen-specific editorial composition should not be forced into generic visual primitives.

## 26. Design Tokens

The following is an implementation-ready proposal. Comments label Recommended mappings or values; uncommented values are Exact Stitch values.

```css
:root {
  --color-canvas: #f3efe9;
  --color-background: #fdf8f7;
  --color-surface: #ffffff;
  --color-surface-low: #f7f3f1;
  --color-surface-container: #f1edec;
  --color-surface-high: #ebe7e6;
  --color-surface-highest: #e5e2e0;

  --color-text-primary: #1c1b1b;
  --color-text-brand: #2c2c2a;
  --color-text-secondary: #484740;
  --color-text-muted: #6e6c68;
  --color-border: #cac6bd;
  --color-border-strong: #79776f;

  --color-action-primary: #2c2c2a;
  --color-action-primary-text: #f3efe9;
  --color-error: #ba1a1a;
  --color-error-surface: #ffdad6;

  /* Recommended semantic mappings from exact neutral tokens. */
  --color-disabled: #e5e2e0;
  --color-disabled-text: #6e6c68;
  --color-skeleton: #f1edec;
  --color-skeleton-highlight: #f7f3f1;

  /* Recommended: exact Stitch success/warning values are not exposed. */
  --color-success: initial;
  --color-success-surface: initial;
  --color-warning: initial;
  --color-warning-surface: initial;

  --font-storefront: "Poppins", Arial, sans-serif;
  --font-display-size: 48px;
  --font-display-mobile-size: 32px;
  --font-heading-size: 24px;
  --font-body-lg-size: 18px;
  --font-body-size: 16px;
  --font-label-size: 12px;
  --font-display-weight: 600;
  --font-body-weight: 400;
  --font-label-weight: 500;
  --line-display: 1.1;
  --line-display-mobile: 1.2;
  --line-heading: 1.3;
  --line-body: 1.6;
  --line-label: 1;
  --tracking-display: -0.02em;
  --tracking-display-mobile: -0.01em;
  --tracking-heading: -0.01em;
  --tracking-label: 0.05em;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 48px;
  --space-6: 80px;
  --page-margin-mobile: 20px;
  --page-margin-desktop: 60px;

  --radius-sm: 4px;
  --radius-default: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  --radius-card: 16px;
  --radius-image: 16px;
  --radius-control: 16px;

  /* Approximation explicitly provided by Stitch. */
  --shadow-card: 0 4px 20px rgba(44, 44, 42, 0.04);

  /* Recommended interaction tokens; exact timing is not exposed. */
  --duration-fast: 160ms;
  --duration-default: 200ms;
  --duration-slow: 280ms;
  --ease-blissfy: cubic-bezier(0.22, 1, 0.36, 1);
}
```

## 27. Anti-Patterns

Do not:

- turn the storefront into a dashboard or SaaS interface;
- make every button, field, badge, selector, and card a pill;
- use huge, hard, or multi-layer shadows;
- use gradient-heavy UI or decorative gradients that compete with photography;
- frame every region with a border;
- introduce random spacing values or arbitrary gaps;
- introduce random font sizes or page-specific type scales;
- create marketplace-style product cards with dense metadata and prominent card-level CTA buttons;
- add excessive badges or promotional chips;
- expand the palette with unrelated brand colors;
- add excessive animation, springs, parallax, or page transitions;
- use inconsistent page containers or alignment lines;
- define page-specific design tokens;
- use status colors for ordinary hover, navigation, or decoration;
- replace whitespace with additional panels merely to fill the page.

## Current Storefront Migration Audit

The audit covers the customer storefront under `apps/store`; `apps/api`, admin behavior, and backend logic are out of scope. There are **24 tracked inconsistencies or migration items** below.

Correctly aligned foundations include Poppins loading, a warm neutral canvas, two-column mobile product grids, 4:5 implementation imagery consistency, minimum 44px targets in many commerce controls, split desktop cart/checkout layouts, sticky summaries, semantic form labels, and reduced-motion handling.

| Priority | Area | Current Problem | Design System Rule | Recommended Action |
|----------|------|-----------------|--------------------|--------------------|
| P0 | Public navigation/routes | Header links to `/about` and `/order/track`, but those public routes do not exist; Stitch also includes Contact and Privacy screens with no routes. | Navigation must lead to implemented storefront destinations and reflect the Stitch screen set. | Before visual rollout, define/implement approved public routes or remove dead links; do not change backend behavior. |
| P1 | Global colors | `globals.css` uses olive, taupe, and clay as prominent brand/interaction colors. | Oat, Charcoal, and white dominate; named accents are functional and sparse. | Replace storefront semantic tokens with exact Stitch tokens; keep product-supplied swatch colors separate. |
| P1 | Primary/focus states | Primary buttons, links, selection, and global focus use olive. | Charcoal is the action anchor and focus border. | Move interaction semantics to Charcoal and reserve status accents for status. |
| P1 | Radius scale | Current radii are 8, 14, 20, and 28px plus pill. | Exact scale is 4, 8, 12, 16, 24px, full; 16px is primary. | Replace radius tokens centrally before changing pages. |
| P1 | Shared buttons | Every shared Button uses full-pill radius; primary hover changes to olive. | Buttons use 16px radius; primary remains Charcoal/neutral. | Update Button variants and states after token migration. |
| P1 | ProductCard surface | Product card content is unframed below the image rather than a white card with ambient shadow. | White 16px card, soft shadow, left-aligned information. | Rebuild ProductCard visual shell while preserving data/link semantics. |
| P1 | ProductCard hierarchy | Price is right-aligned beside the title and metadata competes across two rows. | Name and price form a calm left-aligned hierarchy; metadata stays limited. | Introduce shared ProductPrice and simplify card content order. |
| P1 | Hero color/layout | Hero relies on a large olive panel and decorative border. | Oat/white/Charcoal editorial system; functional accents stay sparse. | Recompose HeroCampaign using Stitch palette and imagery-led hierarchy after foundations exist. |
| P1 | Typography scale | `.text-display-xl` reaches 72px with zero tracking; several pages independently use 30/36/48px headings. | Exact display is 48px desktop/32px mobile with tight tracking; Heading is 24px. | Replace utility and page-local heading classes with semantic type tokens. |
| P1 | Header utilities | Search is a text link, cart is a heavy outlined text button, wordmark begins uppercase, and the user icon is absent. | Lowercase wordmark and thin-stroke search, bag, and user icons. | Refactor StoreHeader after shared IconButton/navigation primitives are defined. |
| P1 | Mobile navigation | Native `<details>` opens a positioned dropdown without drawer focus management or scroll locking. | Conservative white drawer/sheet with 44px rows, close action, focus management. | Create a shared MobileNavigation while preserving the desktop information architecture. |
| P1 | Border-heavy commerce | Cart items, summaries, checkout groups, payment panels, and empty states frequently combine white surface and visible border. | Prefer white-on-Oat tonal layering and ambient shadow; borders are selective. | Audit each surface after tokens and Card/Section primitives land. |
| P2 | Shadows | Existing float/menu shadows use 8–10% opacity and larger offsets. | Canonical ambient shadow is approximately 4% Charcoal. | Replace shadow tokens and validate overlays separately from cards. |
| P2 | Container system | `.container-page` caps at 1440px and uses 16/24/32/48/56px gutters rather than exact 20/60px margins. | 20px mobile and 60px desktop margins; exact max-width is not exposed. | Introduce exact margin tokens; retain max-width only as a documented Recommended choice after visual verification. |
| P2 | Spacing consistency | Pages use many Tailwind spacing values outside 4/8/16/24/48/80, including 12, 20, 28, 32, 40, and 56px. | Use the exact Stitch scale; optical exceptions must be deliberate. | Add semantic spacing primitives and migrate page-by-page rather than blind replacement. |
| P2 | Form controls | Checkout defines `fieldClass` locally; admin-like field patterns are repeated elsewhere. | Storefront inputs/selects/textareas share one 16px-radius field system. | Extract storefront-only Input, Select, Textarea, and FieldMessage; do not alter admin forms. |
| P2 | Commerce selectors | Color, size, and quantity controls default to full pills. | Neutral selectors; full radius only when geometry requires it. | Extract ColorSelector, SizeSelector, and QuantitySelector using shared state rules. |
| P2 | Badges | Shared Badge and discount labels are universally pill-shaped and use noncanonical tones. | 8px badge radius; accents are sparse and functional. | Align Badge radius/tone API with documented semantics. |
| P2 | Loading | Loading routes use static `animate-pulse` blocks rather than pale Oat shimmer tokens. | Pale Oat skeleton/shimmer matching final geometry. | Add shared Skeleton and migrate route loading states. |
| P2 | Feedback duplication | Empty/error/loading markup is repeated across product, cart, checkout, and payment routes. | Feedback states share consistent spacing, surfaces, messaging, and recovery actions. | Extract storefront feedback primitives; keep copy and recovery callbacks page-specific. |
| P2 | Status palette | Success, warning, danger, and info are custom HSL values not supplied by Stitch. | Error has exact values; success/warning remain Recommended until verified. | Retain accessible temporary values but label them provisional; visually validate before canonicalizing. |
| P2 | Footer | Footer uses the shared shell but its spacing, information hierarchy, and links have not been reconciled against Stitch. | Footer must continue the editorial alignment and restrained navigation language. | Audit StoreFooter after Container/Section and typography foundations are stable. |
| P2 | Search experience | Header “Cari” navigates to the product index; there is no explicit no-results/search flow despite a Stitch screen. | Search should use the canonical input/empty-state language. | Define storefront search behavior and route separately; avoid backend changes in the visual migration. |
| P3 | Product color fallback | Product card and purchase form hardcode `#FFFEFA` for missing color values. | Page/components should use shared semantic tokens where the color is UI chrome. | Replace the visual fallback with an appropriate shared surface token while leaving real product swatches data-driven. |

Shared candidates: Button, Badge, Input, Select, Textarea, FieldMessage, Container, Section, Skeleton, feedback states, ProductPrice, ProductCard, ColorSelector, SizeSelector, QuantitySelector, CartItem, OrderItem, OrderSummary, ShippingOption, PaymentStatus, OrderStatus, StoreHeader, StoreFooter, MobileNavigation, and TransactionHeader.

Page-specific responsibilities: homepage editorial composition, product data rendering, cart state/orchestration, checkout validation and region/shipping orchestration, payment polling/charge behavior, order-tracking data, and route-specific copy. Visual primitives may be shared without moving business logic.

Accessibility observations:

- Positive: skip link, semantic labels, many 44px targets, native controls, `aria-pressed` selectors, alt text, and reduced-motion CSS are already present.
- Required follow-up: fix dead navigation destinations; add robust mobile-drawer focus management; ensure selector unavailable states have non-color cues; connect field errors programmatically; verify focus contrast after removing olive; audit status contrast; and verify heading order after semantic type migration.

## Storefront UI Migration Plan

The plan deliberately migrates shared foundations before pages. It does not authorize implementation.

| Milestone | Files likely affected | Goal | Expected visual result | Risk | Verification |
|---:|---|---|---|---|---|
| 1. Design tokens / globals | `src/app/globals.css`, `src/app/layout.tsx` | Install exact Stitch colors, type roles, spacing, radii, shadow, and motion tokens without touching business logic. | Canonical Oat/Charcoal/white base and Poppins hierarchy across the storefront. | High | Token review against this document; build; visual snapshots of all public routes; contrast checks. |
| 2. Shared layout primitives | Proposed `components/ui/Container.tsx`, `Section.tsx`; storefront page shells | Standardize 20/60px margins, grid alignment, editorial and transaction layout composition. | Consistent page edges and vertical rhythm. | Medium | Responsive viewport matrix; alignment overlays; no horizontal overflow. |
| 3. Buttons and form controls | `components/ui/button.tsx`, `badge.tsx`, proposed Input/Select/Checkbox/Radio/Textarea/FieldMessage | Replace pill-first controls and duplicated field classes with shared stateful primitives. | 16px neutral controls with consistent hover/focus/error/disabled behavior. | High | Keyboard tests, focus-visible review, form validation tests, Storybook/isolated harness if available. |
| 4. Header/navigation | `components/store/StoreHeader.tsx`, proposed MobileNavigation/IconButton | Match canonical lowercase wordmark, restrained links, utility icons, and accessible mobile drawer. | Light editorial header rather than marketplace CTA bar. | High | Keyboard/mobile navigation test, focus trap and scroll lock, route-link validation. |
| 5. Footer | `components/store/StoreFooter.tsx` | Align footer typography, spacing, container, and navigation with storefront foundations. | Calm continuation of the editorial shell. | Low | Desktop/mobile visual review and link audit. |
| 6. ProductCard and commerce primitives | `ProductCard.tsx`, `ProductPurchaseForm.tsx`, `QuantityStepper.tsx`, proposed ProductPrice/SizeSelector/ColorSelector | Establish shared product, price, selector, and quantity language. | White ambient product cards and neutral selectors consistent with Stitch. | High | Catalog/product-detail snapshots, keyboard selector tests, availability-state matrix. |
| 7. Homepage | `src/app/page.tsx`, `HeroCampaign.tsx`, `SectionHeading.tsx` | Remove noncanonical hero accents and align editorial rhythm with Stitch. | Modern Korean editorial landing page with photography-led hierarchy. | Medium | Compare full-page desktop capture with Stitch homepage; mobile overflow/content-order review. |
| 8. Product listing | `src/app/products/page.tsx`, loading/error files | Apply canonical grid, card, empty, loading, and error patterns. | Calm two-column mobile/four-or-grid-derived desktop catalog. | Medium | Product-count variants, empty/error/loading snapshots, responsive grid test. |
| 9. Product detail | `src/app/products/[slug]/page.tsx`, `ProductPurchaseForm.tsx`, loading/error/not-found | Align gallery, price, information, selectors, and purchase hierarchy. | Image-led product page with clear neutral purchase flow. | High | Variant/stock matrix, gallery responsiveness, keyboard and screen-reader pass. |
| 10. Shopping bag | `src/app/cart/*`, `CartView.tsx`, proposed CartItem/OrderSummary | Apply refined Shopping Bag and empty-state patterns. | White-on-Oat line items, quieter sticky summary, dominant checkout CTA. | High | Empty/populated/stale-stock/error/loading states across mobile/desktop. |
| 11. Checkout | `src/app/checkout/*`, `CheckoutView.tsx`, shared form/shipping/summary primitives | Standardize field grouping, shipping selection, validation, and summary presentation. | Focused transactional flow consistent with Stitch Checkout. | High | End-to-end form validation, shipping state matrix, keyboard/focus testing, mobile order review. |
| 12. Payment states | `src/app/payment/[accessToken]/*`, `PaymentClient.tsx`, proposed PaymentStatus | Unify pending, success, expired, failure, and recovery presentation without changing payment logic. | Restrained QRIS task with clear amount, QR, countdown, and recovery hierarchy. | High | Mock each payment status, timer/polling regression tests, QR scaling and contrast review. |
| 13. Track order | New approved public route/components after route decision | Implement visual patterns for form and detail while keeping API scope separate. | Stitch-aligned tracking form, timeline, shipment, and order summary. | High | Route/API contract review, empty/error/success states, keyboard timeline semantics. |
| 14. Empty/error/loading states | Shared feedback components and route state files | Remove duplicated visual rules and install canonical feedback language. | Consistent pale Oat shimmer and calm recovery states. | Medium | Route-state snapshot matrix; reduced-motion test; recovery-action test. |
| 15. Responsive polish | All migrated storefront views | Resolve content-driven breakpoints, stacking, touch spacing, and image behavior. | Faithful desktop system with conservative mobile adaptation. | Medium | 320, 375, 768, 1024, 1440px review; zoom/reflow and overflow checks. |
| 16. Accessibility pass | All migrated storefront views and shared components | Verify semantics, focus, labels, contrast, alt text, motion, and target sizes. | Visually faithful storefront usable by keyboard and assistive technology. | High | Automated accessibility scan, keyboard-only walkthrough, screen-reader smoke test, contrast audit. |

