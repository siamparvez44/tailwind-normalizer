# tw-normalizer

A developer tool that converts AI-generated Tailwind slop into clean, canonical utility classes.

Paste arbitrary values, CSS declarations, or deprecated class names — get back proper Tailwind.

```
text-[16px] font-[700] p-[1rem] gap-[8px] flex-shrink-0 overflow-ellipsis
→ text-base font-bold p-4 gap-2 shrink-0 text-ellipsis
```

```css
display: flex;
align-items: center;
gap: 0.5rem;
padding: 1rem 2rem;
font-size: 1rem;
```
```
→ flex items-center gap-2 py-4 px-8 text-base
```

---

## Features

- **Arbitrary value conversion** — `text-[16px]` → `text-base`, `p-[1rem]` → `p-4`, `min-h-[110px]` → `min-h-27.5`
- **All CSS units** — `px`, `rem`, `em`, `%`, `vw`, `vh`, and opacity modifiers (`/[0.08]` → `/8`, `/[0.025]` → `/2.5`)
- **CSS → Tailwind** — paste raw CSS declarations or a full CSS block and get Tailwind classes out
- **CSS shorthand expansion** — `padding: 1rem 2rem` → `py-4 px-8` (4-value shorthands too)
- **Deprecated alias fixing** — `flex-shrink-0` → `shrink-0`, `overflow-ellipsis` → `text-ellipsis`, `font-hairline` → `font-thin`
- **Responsive + state prefixes** — `sm:`, `lg:`, `hover:`, `focus-visible:`, `dark:`, `placeholder:` all preserved through conversion
- **Tailwind v3 and v4** — separate maps for the changed border-radius scale, font sizes, and new `size-*` utilities in v4
- **60+ CSS keyword properties** — `display`, `flex-direction`, `justify-content`, `align-items`, `overflow`, `cursor`, `white-space`, `object-fit`, `background-*`, and more
- **Pure TypeScript core** — zero React in the logic file, usable in API routes, scripts, or CLI tools

---

## Project structure

```
src/
├── lib/
│   └── tw-normalizer.ts              # Pure TS logic — no React
├── components/
│   └── tw-normalizer/
│       ├── TailwindNormalizer.tsx    # Drop-in React component
│       └── index.ts                 # Barrel export
└── app/
    └── tools/
        └── normalizer/
            └── page.tsx             # /tools/normalizer route
```

---

## Getting started

### Prerequisites

- Next.js 13+ (App Router)
- Tailwind CSS v3 or v4
- shadcn/ui (for `cn` utility)

### Installation

1. Copy the source files into your project at the paths shown above.

2. Make sure you have the `cn` utility from shadcn:

```bash
pnpm dlx shadcn@latest init
```

3. That's it — no new npm dependencies. Visit `/tools/normalizer`.

---

## Usage

### Drop-in component

```tsx
import { TailwindNormalizer } from "@/components/tw-normalizer"

export default function Page() {
  return (
    <div className="p-8">
      <TailwindNormalizer defaultVersion={4} />
    </div>
  )
}
```

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `defaultVersion` | `3 \| 4` | `3` | Tailwind version to start on |
| `className` | `string` | — | Extra classes on the root element |

### Pure logic (no React)

The `tw-normalizer.ts` file has no React dependency and can be used anywhere:

```ts
import { normalize, detectMode, convertArbitrary, convertOpacityMod } from "@/lib/tw-normalizer"

// Normalize a string of Tailwind classes
const result = normalize("text-[16px] font-[700] p-[1rem] flex-shrink-0", 3)
console.log(result.output)
// → "text-base font-bold p-4 shrink-0"

console.log(result.stats)
// → { total: 4, fixed: 3, deprecated: 1, arbitrary: 0, ok: 0 }

// Normalize CSS input
const cssResult = normalize("display: flex; align-items: center; gap: 0.5rem;", 3)
console.log(cssResult.output)
// → "flex items-center gap-2"

// Detect whether input is CSS or Tailwind classes
const mode = detectMode("font-size: 16px; padding: 1rem;")
// → "css"

// Convert a single arbitrary class
const converted = convertArbitrary("min-h-[110px]", 3)
// → "min-h-27.5"

// Convert an opacity modifier
const opMod = convertOpacityMod("bg-white/[0.025]")
// → "bg-white/2.5"
```

### In an API route

```ts
// app/api/normalize/route.ts
import { normalize } from "@/lib/tw-normalizer"

export async function POST(req: Request) {
  const { input, version } = await req.json()
  const result = normalize(input, version ?? 3)
  return Response.json(result)
}
```

---

## What gets converted

### Arbitrary values → canonical classes

Any value that maps to a whole number of pixels converts to the corresponding Tailwind scale number (N spacing units = N × 4px).

| Input | Output | Notes |
|---|---|---|
| `text-[16px]` | `text-base` | font-size scale |
| `text-[0.875rem]` | `text-sm` | rem converted via ×16 |
| `font-[700]` | `font-bold` | font-weight |
| `p-[1rem]` | `p-4` | spacing scale |
| `p-[2em]` | `p-8` | em treated as rem |
| `gap-[0.5rem]` | `gap-2` | |
| `min-h-[110px]` | `min-h-27.5` | 110 ÷ 4 = 27.5 |
| `w-[100%]` | `w-full` | percentage fractions |
| `w-[50%]` | `w-1/2` | |
| `h-[100vh]` | `h-screen` | viewport units |
| `rounded-[0.5rem]` | `rounded-lg` | border-radius scale |
| `opacity-[0.5]` | `opacity-50` | |
| `z-[10]` | `z-10` | |
| `duration-[300ms]` | `duration-300` | |

### Opacity modifiers

| Input | Output |
|---|---|
| `bg-white/[0.08]` | `bg-white/8` |
| `bg-white/[0.025]` | `bg-white/2.5` |
| `border-white/[0.15]` | `border-white/15` |
| `hover:bg-black/[0.5]` | `hover:bg-black/50` |
| `sm:border-white/[0.08]` | `sm:border-white/8` |

### CSS declarations

| Input | Output |
|---|---|
| `display: flex` | `flex` |
| `font-size: 1rem` | `text-base` |
| `font-weight: 700` | `font-bold` |
| `padding: 1rem 2rem` | `py-4 px-8` |
| `margin: 0 auto` | `my-0 mx-auto` |
| `align-items: center` | `items-center` |
| `justify-content: space-between` | `justify-between` |
| `overflow: hidden` | `overflow-hidden` |
| `white-space: nowrap` | `whitespace-nowrap` |
| `cursor: pointer` | `cursor-pointer` |
| `border-radius: 0.5rem` | `rounded-lg` |
| `background-color: transparent` | `bg-transparent` |

CSS blocks are also supported:

```css
.card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
}
```
```
→ flex flex-col gap-4 p-6 rounded-lg
```

### Deprecated aliases

| Input | Output | Changed in |
|---|---|---|
| `flex-shrink-0` | `shrink-0` | v3 |
| `flex-shrink` | `shrink` | v3 |
| `flex-grow-0` | `grow-0` | v3 |
| `flex-grow` | `grow` | v3 |
| `overflow-ellipsis` | `text-ellipsis` | v3 |
| `overflow-clip-text` | `text-clip` | v3 |
| `font-hairline` | `font-thin` | v3 |
| `whitespace-no-wrap` | `whitespace-nowrap` | v3 |
| `decoration-slice` | `box-decoration-slice` | v3 |
| `decoration-clone` | `box-decoration-clone` | v3 |

### Values that stay amber (no canonical match)

Some values are intentionally arbitrary and have no named Tailwind equivalent:

- **Off-scale font sizes** — `text-[13px]` sits between `text-xs` (12px) and `text-sm` (14px)
- **Custom colors** — `ring-[#ccff00]`, `bg-[#1a1a1a]` — brand colors can't be canonicalized
- **Custom tracking** — `tracking-[0.18em]` is not on Tailwind's letter-spacing scale
- **Sub-12px text in v4** — v4 has no named utility below `text-xs` (12px)
- **Non-standard viewport units** — `h-[50vh]`, `w-[80vw]` (only `100vh`/`100vw` map to `h-screen`/`w-screen`)

---

## Tailwind v3 vs v4 differences

Switch between versions using the toggle in the UI. Key differences:

| | v3 | v4 |
|---|---|---|
| `text-xs` | 12px | 12px |
| `rounded-sm` | 2px | 4px |
| `rounded` (default) | 4px | — |
| `rounded-xs` | — | 2px |
| `size-*` | — | Sets both `width` and `height` |
| Sub-12px text | Maps to `text-xs` | No canonical name |

---

## Output format

`normalize()` returns a `NormalizeResult` object:

```ts
interface NormalizeResult {
  tokens: NormalizedToken[]   // Each class/declaration with its state
  output: string              // Space-joined result string
  stats: {
    total: number             // Total input tokens
    fixed: number             // Converted from arbitrary
    deprecated: number        // Renamed deprecated aliases
    arbitrary: number         // Still arbitrary (no match)
    ok: number                // Already canonical, passed through
  }
  mode: "tailwind" | "css"   // Detected input type
}

interface NormalizedToken {
  original: string            // Input value
  result: string              // Output value
  state: "changed" | "deprecated" | "unknown" | "ok"
}
```

---

## Contributing

PRs welcome. The most useful contributions are:

- **Missing CSS properties** — add to `CSS_KEYWORDS` or `CSS_NUMERIC` in `tw-normalizer.ts`
- **Missing deprecated aliases** — add to the `DEPRECATED` map
- **Edge cases in unit conversion** — add a test case and fix `convertArbitrary` or `convertOpacityMod`
- **v4 scale corrections** — the v4 spec is still evolving

The core logic is entirely in `src/lib/tw-normalizer.ts`. It has no framework dependencies and is straightforward to test with plain Node.

---

## License

MIT