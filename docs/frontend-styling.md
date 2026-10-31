# Frontend styling conventions

The Office UI uses **Tailwind CSS 4** (`tailwindcss` and `@tailwindcss/vite`, pinned to the same version) with named design tokens. Presentation lives in utility classes on the markup; there are no component CSS classes.

## Where things live

| File | Responsibility |
| --- | --- |
| `src/style.css` | Entry point: font import, `@import 'tailwindcss'`, token imports, and minimal `html` document defaults (root font size, weight, `line-height: normal` to undo Preflight's 1.5, ink and canvas colors). |
| `src/tokens/colors.css` | **The only file with literal colors.** A `:root` palette (`--palette-<family>-<OKLCH lightness×1000>[-a<alpha%>]`, every value defined once), semantic `@theme` colors (`--color-*`, generate utilities such as `bg-drawer`, `text-muted`), team colors (`@theme static`, also read by Three.js), scene material colors (`--scene-*`), shadow tints and `--theme-color`. The default Tailwind palette is reset with `--color-*: initial`. |
| `src/tokens/typography.css` | DM Sans (`font-sans`) and Manrope (`font-display`), weights 400–800, the pixel type scale (`text-11` = 11px, `text-6.5` = 6.5px), tracking and leading by role. |
| `src/tokens/layout.css` | 4px spacing base (`--spacing: 4px`), named shell/scene dimensions (`h-topbar`, `w-drawer`, `max-w-bubble` …) and breakpoints. |
| `src/tokens/effects.css` | Radii, shadows (colors from tint tokens), blur, motion timing, animations, and the `reduce-motion:` variant. |
| `src/tokens/scene-colors.ts` | Names the CSS tokens used by Three.js materials, lights and the canvas-drawn operations screen. |
| `src/ui/` | Small shared pieces: `Button`, `IconButton`, `Tag`, `StatusDot`, `Select`, `TextLink`, `Notice`, `Section`, `PanelTitle`, `SectionTitle`, `Card`, decorative icon wrappers, and shared class strings (`interactive`, `focusRing`, `field`, `checkbox`, …). |

Utility tokens use `@theme`; values that should not generate utilities stay in `:root`. Import order in `style.css` is the ownership order.

## Rules

- **Colors:** use semantic tokens only (`bg-card`, `text-tag-blocked-ink`). Never write a hex/rgb/hsl value or an arbitrary color utility outside `colors.css`. Each role keeps its original value; only a measured contrast failure may re-point a role at another existing palette value, and nothing merges near-identical colors. The palette retains every original value, including ones with no current consumer, so it stays complete. `ui-source-guard.test.ts` pins the roles that a past merge once changed.
- **Form controls:** text inputs and textareas use `field` (a 3:1 boundary) plus a focus color (`fieldFocus`, or the compose box's own). Selects keep their original per-form border, surface and text colors; their value text and chevron identify them. `Select` accepts `focusClassName` for a role's own focus color.
- **Spacing:** 4px base, 2px steps for compact controls. Panel padding `p-6` (24px), cards `p-4` (16px), drawer sections `mt-6 pt-6` (24px), control gaps `gap-2` (8px). Shell and scene dimensions use the named tokens.
- **Breakpoints:** `max-compact:` (≤700px), `max-dock:` (≤760px), `max-tablet:` (≤1000px), `wide:` (≥1600px). Tailwind `max-*` is exclusive, so the tokens are 701/761/1001px. Ranges stack, e.g. `compact:max-tablet:hidden` for 701–1000px. The header is also an `@container/topbar`: below 360px of header width, `@max-[360px]/topbar:` makes the board link icon-only and tightens the project select so nothing clips or overlaps at 320px. The dock scrolls horizontally whenever its controls overflow.
- **Conditional classes:** choose between complete static strings (`selected?'bg-roster-hover':'border-transparent'`); never build class names from fragments.
- **Interaction:** every enabled control uses `interactive` (or `field`/`checkbox`/`summary`): a hover change, `transition-colors` at the shared 150ms timing, and the 3px `focus-visible` ring. Scene labels use `interactiveScene` (a darker ring with 3:1 against the room) and dark surfaces use `interactiveOnDark`. Do not use `transition` or `transition-all`.
- **Motion:** `reduce-motion:` applies under the OS preference *or* the Office "Reduced motion" setting (`data-motion="reduced"` on `<html>`). Motion animations also receive the `reduced` prop.
- **Inline styles:** none in source. Motion writes transforms/opacity and Drei writes overlay positions inside their libraries; those are the only runtime styles.
- **Scene colors:** `sceneColors()` reads the CSS tokens once and caches them. Values are sRGB CSS colors, so three.js color management and the canvas texture's `SRGBColorSpace` behave as before. Never call it per frame.
- **Semantics:** native buttons for actions, links for navigation, `details/summary` disclosures, labeled regions. The inspector is a non-modal `aside`; settings/help are named non-modal dialogs that take focus on open and return it on close. Icons are decorative (`aria-hidden`); status dots always pair with text.

`tests/unit/ui-source-guard.test.ts` enforces the color, selector, inline-style, transition and class-construction rules. Browser tests use roles, names or `data-*` hooks, never styling classes.

## Browser tests

`pnpm test:browser` starts `tests/browser/fixture-server.ts`: the built `dist/` plus an in-memory synthetic API on port 4460. It never contacts the installed Office. Use `OFFICE_FIXTURE_DIST` for another build, `OFFICE_EVIDENCE_DIR` for screenshots, and `OFFICE_TEST_BASE_URL` only for a separately started isolated server (`OFFICE_DATA_ROOT=<temp> OFFICE_NO_POLL=1 OFFICE_PORT=<port>`). `a11y.spec.ts` runs axe (WCAG 2.2 AA tags) through `@axe-core/playwright`.

## Sources

- Tailwind CSS: [Vite installation](https://tailwindcss.com/docs/installation/using-vite), [theme variables](https://tailwindcss.com/docs/theme), [colors](https://tailwindcss.com/docs/colors), [hover, focus and other states](https://tailwindcss.com/docs/hover-focus-and-other-states), [transition-property](https://tailwindcss.com/docs/transition-property)
- Accessibility: [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/), [semantic HTML](https://web.dev/learn/html/semantic-html), axe rules [color-contrast](https://dequeuniversity.com/rules/axe/4.14/color-contrast), [aria-hidden-focus](https://dequeuniversity.com/rules/axe/4.14/aria-hidden-focus), [target-size](https://dequeuniversity.com/rules/axe/4.14/target-size)
- Motion: [React accessibility](https://motion.dev/docs/react-accessibility)
- Brain note *Organize Tailwind 4 tokens by responsibility* (`knowledge/tailwind/responsibility-based-tokens.md`): `@theme` for utility-generating tokens, `:root` for the rest, one authoritative definition per token, scoped runtime exceptions.
