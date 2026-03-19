// ─────────────────────────────────────────────────────────────────────────────
// tw-normalizer.ts
// Pure TypeScript logic — no React dependencies.
// Import this anywhere: components, API routes, scripts.
// ─────────────────────────────────────────────────────────────────────────────

export type TailwindVersion = 3 | 4

export type TokenState = "changed" | "deprecated" | "unknown" | "ok"

export interface NormalizedToken {
  original: string
  result: string
  state: TokenState
}

export interface NormalizeResult {
  tokens: NormalizedToken[]
  output: string
  stats: {
    total: number
    fixed: number
    deprecated: number
    arbitrary: number
    ok: number
  }
  mode: "tailwind" | "css"
}

// ─── Scales ──────────────────────────────────────────────────────────────────

/**
 * Convert a pixel value to its Tailwind spacing scale number.
 * Tailwind JIT accepts any value that maps to a whole number of pixels,
 * i.e. any multiple of 0.25 (since 1 spacing unit = 0.25rem = 4px).
 * Examples: 110px → 27.5, 112px → 28, 6px → 1.5, 3px → 0.75
 */
function pxToSpacingScale(absPx: number): string | null {
  if (absPx === 0) return "0"
  if (absPx === 1) return "px"
  const scale = absPx / 4
  // Round to nearest 0.25 (nearest whole pixel)
  const rounded = Math.round(scale * 4) / 4
  // Reject if the px value isn't a whole number of pixels
  if (Math.abs(rounded - scale) > 0.001) return null
  // Format cleanly — avoid float noise like 27.500000000000004
  return parseFloat(rounded.toFixed(4)).toString()
}

const FONT_V3: Record<number, string> = {
  10: "xs", 12: "xs", 14: "sm", 16: "base", 18: "lg", 20: "xl",
  24: "2xl", 30: "3xl", 36: "4xl", 48: "5xl", 60: "6xl",
  72: "7xl", 96: "8xl", 128: "9xl",
}
const FONT_V4: Record<number, string> = {
  12: "xs", 14: "sm", 16: "base", 18: "lg", 20: "xl",
  24: "2xl", 30: "3xl", 36: "4xl", 48: "5xl", 60: "6xl",
  72: "7xl", 96: "8xl", 128: "9xl",
}

const ROUNDED_V3: Record<number, string> = {
  0: "rounded-none", 2: "rounded-sm", 4: "rounded", 6: "rounded-md",
  8: "rounded-lg", 12: "rounded-xl", 16: "rounded-2xl", 24: "rounded-3xl", 9999: "rounded-full",
}
const ROUNDED_V4: Record<number, string> = {
  0: "rounded-none", 2: "rounded-xs", 4: "rounded-sm", 6: "rounded-md",
  8: "rounded-lg", 12: "rounded-xl", 16: "rounded-2xl", 24: "rounded-3xl", 9999: "rounded-full",
}

const BORDER_W: Record<number, string> = { 0: "border-0", 1: "border", 2: "border-2", 4: "border-4", 8: "border-8" }
const OPACITY_SCALE: Record<number, string> = { 0: "opacity-0", 5: "opacity-5", 10: "opacity-10", 20: "opacity-20", 25: "opacity-25", 30: "opacity-30", 40: "opacity-40", 50: "opacity-50", 60: "opacity-60", 70: "opacity-70", 75: "opacity-75", 80: "opacity-80", 90: "opacity-90", 95: "opacity-95", 100: "opacity-100" }
const Z_SCALE: Record<number, string> = { 0: "z-0", 10: "z-10", 20: "z-20", 30: "z-30", 40: "z-40", 50: "z-50" }
const DURATION_SCALE: Record<number, string> = { 75: "duration-75", 100: "duration-100", 150: "duration-150", 200: "duration-200", 300: "duration-300", 500: "duration-500", 700: "duration-700", 1000: "duration-1000" }
const DELAY_SCALE: Record<number, string> = { 75: "delay-75", 100: "delay-100", 150: "delay-150", 200: "delay-200", 300: "delay-300", 500: "delay-500", 700: "delay-700", 1000: "delay-1000" }
const FONT_WEIGHT: Record<number, string> = { 100: "font-thin", 200: "font-extralight", 300: "font-light", 400: "font-normal", 500: "font-medium", 600: "font-semibold", 700: "font-bold", 800: "font-extrabold", 900: "font-black" }
const LEADING_PX: Record<number, string> = { 16: "leading-4", 20: "leading-5", 24: "leading-6", 28: "leading-7", 32: "leading-8", 36: "leading-9", 40: "leading-10" }
const LEADING_UNIT: Record<string, string> = { "1": "leading-none", "1.25": "leading-tight", "1.375": "leading-snug", "1.5": "leading-normal", "1.625": "leading-relaxed", "2": "leading-loose" }
const TRACKING: Record<string, string> = { "-0.05": "tracking-tighter", "-0.025": "tracking-tight", "0": "tracking-normal", "0.025": "tracking-wide", "0.05": "tracking-wider", "0.1": "tracking-widest" }
const PCT_TO_FRAC: Record<string, string> = { "50": "1/2", "33.333333": "1/3", "66.666667": "2/3", "25": "1/4", "75": "3/4", "20": "1/5", "40": "2/5", "60": "3/5", "80": "4/5", "16.666667": "1/6", "83.333333": "5/6" }
const MAX_W_SCALE: Record<number, string> = { 320: "max-w-xs", 384: "max-w-sm", 448: "max-w-md", 512: "max-w-lg", 576: "max-w-xl", 672: "max-w-2xl", 768: "max-w-3xl", 896: "max-w-4xl", 1024: "max-w-5xl", 1152: "max-w-6xl", 1280: "max-w-7xl" }

const SPACING_PROPS = new Set([
  "p","px","py","pt","pb","pl","pr",
  "m","mx","my","mt","mb","ml","mr",
  "gap","gap-x","gap-y","space-x","space-y",
  "w","h","size","min-w","max-w","min-h","max-h",
  "basis","inset","inset-x","inset-y",
  "top","bottom","left","right",
  "translate-x","translate-y",
  "scroll-m","scroll-mx","scroll-my","scroll-mt","scroll-mb","scroll-ml","scroll-mr",
  "scroll-p","scroll-px","scroll-py","scroll-pt","scroll-pb","scroll-pl","scroll-pr",
])

// ─── Deprecated aliases ───────────────────────────────────────────────────────

export const DEPRECATED: Record<string, string> = {
  "flex-shrink-0": "shrink-0",
  "flex-shrink": "shrink",
  "flex-grow-0": "grow-0",
  "flex-grow": "grow",
  "overflow-ellipsis": "text-ellipsis",
  "overflow-clip-text": "text-clip",
  "font-hairline": "font-thin",
  "text-decoration-none": "no-underline",
  "whitespace-no-wrap": "whitespace-nowrap",
  "no-wrap": "whitespace-nowrap",
  "flex-column": "flex-col",
  "decoration-slice": "box-decoration-slice",
  "decoration-clone": "box-decoration-clone",
  "justify-middle": "justify-center",
  "items-middle": "items-center",
  "object-middle": "object-center",
}

// ─── Exact-match table ────────────────────────────────────────────────────────

const EXACT_SHARED: Record<string, string> = {
  "bg-[white]": "bg-white", "bg-[#fff]": "bg-white", "bg-[#ffffff]": "bg-white",
  "bg-[black]": "bg-black", "bg-[#000]": "bg-black", "bg-[#000000]": "bg-black", "bg-[transparent]": "bg-transparent",
  "text-[white]": "text-white", "text-[#fff]": "text-white", "text-[#ffffff]": "text-white",
  "text-[black]": "text-black", "text-[#000]": "text-black", "text-[#000000]": "text-black", "text-[transparent]": "text-transparent",
  "m-[auto]": "m-auto", "mx-[auto]": "mx-auto", "my-[auto]": "my-auto",
  "mt-[auto]": "mt-auto", "mb-[auto]": "mb-auto", "ml-[auto]": "ml-auto", "mr-[auto]": "mr-auto",
  "w-[auto]": "w-auto", "h-[auto]": "h-auto", "basis-[auto]": "basis-auto",
  "w-[100vw]": "w-screen", "h-[100vh]": "h-screen", "w-[100%]": "w-full", "h-[100%]": "h-full",
  "min-h-[0px]": "min-h-0", "min-h-[100%]": "min-h-full", "min-h-[100vh]": "min-h-screen",
  "max-h-[100%]": "max-h-full", "max-h-[100vh]": "max-h-screen", "max-h-[none]": "max-h-none",
  "min-w-[0px]": "min-w-0", "min-w-[100%]": "min-w-full", "max-w-[none]": "max-w-none", "max-w-[100%]": "max-w-full",
  "aspect-[1/1]": "aspect-square", "aspect-[16/9]": "aspect-video", "aspect-[auto]": "aspect-auto",
  "flex-[1]": "flex-1", "flex-[auto]": "flex-auto", "flex-[none]": "flex-none",
  "grow-[0]": "grow-0", "shrink-[0]": "shrink-0",
  "inset-[0]": "inset-0", "top-[0]": "top-0", "bottom-[0]": "bottom-0", "left-[0]": "left-0", "right-[0]": "right-0",
  "rounded-[50%]": "rounded-full", "rounded-[9999px]": "rounded-full", "border-[0]": "border-0",
  "opacity-[0]": "opacity-0", "opacity-[1]": "opacity-100", "z-[0]": "z-0",
  "rotate-[0deg]": "rotate-0", "rotate-[45deg]": "rotate-45", "rotate-[90deg]": "rotate-90", "rotate-[180deg]": "rotate-180",
  "rotate-[-45deg]": "-rotate-45", "rotate-[-90deg]": "-rotate-90", "rotate-[-180deg]": "-rotate-180",
  "scale-[0]": "scale-0", "scale-[0.5]": "scale-50", "scale-[0.75]": "scale-75", "scale-[0.9]": "scale-90",
  "scale-[0.95]": "scale-95", "scale-[1]": "scale-100", "scale-[1.05]": "scale-105", "scale-[1.1]": "scale-110",
  "scale-[1.25]": "scale-125", "scale-[1.5]": "scale-150",
  "translate-x-[0]": "translate-x-0", "translate-y-[0]": "translate-y-0",
  "translate-x-[50%]": "translate-x-1/2", "translate-x-[100%]": "translate-x-full",
  "translate-x-[-50%]": "-translate-x-1/2", "translate-x-[-100%]": "-translate-x-full",
  "translate-y-[50%]": "translate-y-1/2", "translate-y-[100%]": "translate-y-full",
  "translate-y-[-50%]": "-translate-y-1/2", "translate-y-[-100%]": "-translate-y-full",
  "top-[50%]": "top-1/2", "top-[100%]": "top-full",
  "bottom-[50%]": "bottom-1/2", "bottom-[100%]": "bottom-full",
  "left-[50%]": "left-1/2", "left-[100%]": "left-full",
  "right-[50%]": "right-1/2", "right-[100%]": "right-full",
  "basis-[0]": "basis-0", "basis-[100%]": "basis-full", "basis-[50%]": "basis-1/2",
  "basis-[33.333333%]": "basis-1/3", "basis-[66.666667%]": "basis-2/3", "basis-[25%]": "basis-1/4", "basis-[75%]": "basis-3/4",
  "w-[50%]": "w-1/2", "w-[33.333333%]": "w-1/3", "w-[66.666667%]": "w-2/3", "w-[25%]": "w-1/4", "w-[75%]": "w-3/4", "w-[20%]": "w-1/5",
  "h-[50%]": "h-1/2", "h-[33.333333%]": "h-1/3", "h-[66.666667%]": "h-2/3", "h-[25%]": "h-1/4", "h-[75%]": "h-3/4",
  "duration-[1s]": "duration-1000", "delay-[1s]": "delay-1000",
}

const EXACT_V4: Record<string, string> = {
  ...EXACT_SHARED,
  "size-[100%]": "size-full",
  "size-[100vw]": "size-screen",
}

function getExact(ver: TailwindVersion): Record<string, string> {
  return ver === 4 ? EXACT_V4 : EXACT_SHARED
}

// ─── Unit parser ──────────────────────────────────────────────────────────────

function parseToPixels(val: string): number | null {
  const px = val.match(/^(-?[\d.]+)px$/)
  if (px) return parseFloat(px[1])
  const rem = val.match(/^(-?[\d.]+)rem$/)
  if (rem) return parseFloat(rem[1]) * 16
  const em = val.match(/^(-?[\d.]+)em$/)
  if (em) return parseFloat(em[1]) * 16
  if (val === "0") return 0
  return null
}

// ─── Arbitrary converter ──────────────────────────────────────────────────────

export function convertArbitrary(base: string, ver: TailwindVersion): string | null {
  const fontScale = ver === 4 ? FONT_V4 : FONT_V3
  const roundedScale = ver === 4 ? ROUNDED_V4 : ROUNDED_V3

  const m = base.match(/^(-?)([\w-]+)-\[([^\]]+)\]$/)
  if (!m) return null
  const [, negSign, prop, val] = m

  if (prop === "font") {
    return FONT_WEIGHT[parseInt(val, 10)] ?? null
  }

  if (prop === "leading") {
    if (LEADING_UNIT[val]) return LEADING_UNIT[val]
    const lPx = parseToPixels(val)
    if (lPx !== null) return LEADING_PX[Math.round(lPx)] ?? null
    return null
  }

  if (prop === "tracking") {
    const em = val.match(/^(-?[\d.]+)em$/)
    if (em) return TRACKING[String(parseFloat(em[1]))] ?? null
    return null
  }

  if (prop === "opacity") {
    const ov = parseFloat(val)
    if (!isNaN(ov)) return OPACITY_SCALE[Math.round(ov <= 1 ? ov * 100 : ov)] ?? null
    return null
  }

  if (prop === "z") {
    const zv = parseInt(val, 10)
    return isNaN(zv) ? null : Z_SCALE[zv] ?? null
  }

  if (prop === "duration" || prop === "delay") {
    const msm = val.match(/^([\d.]+)(ms|s)$/)
    if (!msm) return null
    const ms = msm[2] === "s" ? parseFloat(msm[1]) * 1000 : parseFloat(msm[1])
    const scale = prop === "duration" ? DURATION_SCALE : DELAY_SCALE
    return scale[Math.round(ms)] ?? null
  }

  if (prop === "text") {
    const tpx = parseToPixels(val)
    if (tpx === null) return null
    const name = fontScale[Math.round(Math.abs(tpx))]
    return name ? `text-${name}` : null
  }

  if (prop === "rounded" || prop.startsWith("rounded-")) {
    const rpx = parseToPixels(val)
    if (rpx === null) return null
    const rval = roundedScale[Math.round(rpx)]
    if (!rval) return null
    if (prop === "rounded") return rval
    return "rounded" + prop.slice("rounded".length) + rval.replace("rounded", "")
  }

  if (prop === "border" || ["border-x","border-y","border-t","border-b","border-l","border-r"].includes(prop)) {
    const bpx = parseToPixels(val)
    if (bpx === null) return null
    const bw = BORDER_W[Math.round(bpx)]
    if (!bw) return null
    return prop === "border" ? bw : prop + bw.replace("border", "")
  }

  if (prop === "max-w") {
    const mwpx = parseToPixels(val)
    if (mwpx !== null) return MAX_W_SCALE[Math.round(mwpx)] ?? null
    return null
  }

  if (SPACING_PROPS.has(prop)) {
    const pctM = val.match(/^(-?)([\d.]+)%$/)
    if (pctM) {
      const pctNeg = pctM[1]
      const pctKey = String(Math.round(parseFloat(pctM[2]) * 1000000) / 1000000)
      const frac = PCT_TO_FRAC[pctKey]
      if (frac) return `${pctNeg ? "-" : ""}${prop}-${frac}`
      if (parseFloat(pctM[2]) === 100) return `${pctNeg ? "-" : ""}${prop}-full`
      if (parseFloat(pctM[2]) === 0) return `${prop}-0`
      return null
    }
    if (val === "100vw" || val === "100vh") return `${prop}-screen`
    if (/^[\d.]+v[wh]$/.test(val)) return null
    const spx = parseToPixels(val)
    if (spx !== null) {
      const step = pxToSpacingScale(Math.abs(spx))
      if (step) return `${spx < 0 || negSign === "-" ? "-" : ""}${prop}-${step}`
    }
    return null
  }

  return null
}

// ─── CSS converter ────────────────────────────────────────────────────────────

const CSS_KEYWORDS: Record<string, Record<string, string>> = {
  display: { flex:"flex","inline-flex":"inline-flex",grid:"grid","inline-grid":"inline-grid",block:"block","inline-block":"inline-block",inline:"inline",none:"hidden",table:"table","table-cell":"table-cell","table-row":"table-row",contents:"contents","list-item":"list-item","flow-root":"flow-root" },
  position: { static:"static",relative:"relative",absolute:"absolute",fixed:"fixed",sticky:"sticky" },
  "flex-direction": { row:"flex-row",column:"flex-col","row-reverse":"flex-row-reverse","column-reverse":"flex-col-reverse" },
  "flex-wrap": { wrap:"flex-wrap",nowrap:"flex-nowrap","wrap-reverse":"flex-wrap-reverse" },
  "justify-content": { "flex-start":"justify-start","flex-end":"justify-end",center:"justify-center","space-between":"justify-between","space-around":"justify-around","space-evenly":"justify-evenly",stretch:"justify-stretch",normal:"justify-normal",start:"justify-start",end:"justify-end" },
  "justify-items": { start:"justify-items-start",end:"justify-items-end",center:"justify-items-center",stretch:"justify-items-stretch" },
  "justify-self": { auto:"justify-self-auto",start:"justify-self-start",end:"justify-self-end",center:"justify-self-center",stretch:"justify-self-stretch" },
  "align-items": { "flex-start":"items-start","flex-end":"items-end",center:"items-center",baseline:"items-baseline",stretch:"items-stretch",start:"items-start",end:"items-end" },
  "align-content": { "flex-start":"content-start","flex-end":"content-end",center:"content-center","space-between":"content-between","space-around":"content-around","space-evenly":"content-evenly",stretch:"content-stretch",baseline:"content-baseline",normal:"content-normal" },
  "align-self": { auto:"self-auto","flex-start":"self-start","flex-end":"self-end",center:"self-center",baseline:"self-baseline",stretch:"self-stretch",start:"self-start",end:"self-end" },
  "place-items": { center:"place-items-center",start:"place-items-start",end:"place-items-end",baseline:"place-items-baseline",stretch:"place-items-stretch" },
  "text-align": { left:"text-left",center:"text-center",right:"text-right",justify:"text-justify",start:"text-start",end:"text-end" },
  "text-transform": { uppercase:"uppercase",lowercase:"lowercase",capitalize:"capitalize",none:"normal-case" },
  "text-decoration": { underline:"underline","line-through":"line-through",overline:"overline",none:"no-underline" },
  "text-decoration-line": { underline:"underline","line-through":"line-through",overline:"overline",none:"no-underline" },
  "text-overflow": { ellipsis:"text-ellipsis",clip:"text-clip" },
  "font-style": { italic:"italic",normal:"not-italic",oblique:"italic" },
  "vertical-align": { baseline:"align-baseline",top:"align-top",middle:"align-middle",bottom:"align-bottom","text-top":"align-text-top","text-bottom":"align-text-bottom",sub:"align-sub",super:"align-super" },
  overflow: { auto:"overflow-auto",hidden:"overflow-hidden",visible:"overflow-visible",scroll:"overflow-scroll",clip:"overflow-clip" },
  "overflow-x": { auto:"overflow-x-auto",hidden:"overflow-x-hidden",visible:"overflow-x-visible",scroll:"overflow-x-scroll",clip:"overflow-x-clip" },
  "overflow-y": { auto:"overflow-y-auto",hidden:"overflow-y-hidden",visible:"overflow-y-visible",scroll:"overflow-y-scroll",clip:"overflow-y-clip" },
  "white-space": { nowrap:"whitespace-nowrap",normal:"whitespace-normal",pre:"whitespace-pre","pre-wrap":"whitespace-pre-wrap","pre-line":"whitespace-pre-line","break-spaces":"whitespace-break-spaces" },
  "word-break": { "break-all":"break-all","keep-all":"break-keep",normal:"break-normal" },
  "overflow-wrap": { "break-word":"break-words",normal:"break-normal",anywhere:"break-anywhere" },
  cursor: { pointer:"cursor-pointer",default:"cursor-default","not-allowed":"cursor-not-allowed",wait:"cursor-wait",text:"cursor-text",move:"cursor-move",grab:"cursor-grab",grabbing:"cursor-grabbing",none:"cursor-none",auto:"cursor-auto",crosshair:"cursor-crosshair",help:"cursor-help","zoom-in":"cursor-zoom-in","zoom-out":"cursor-zoom-out" },
  "pointer-events": { none:"pointer-events-none",auto:"pointer-events-auto" },
  "user-select": { none:"select-none",text:"select-text",all:"select-all",auto:"select-auto" },
  visibility: { visible:"visible",hidden:"invisible",collapse:"collapse" },
  float: { left:"float-left",right:"float-right",none:"float-none",start:"float-start",end:"float-end" },
  clear: { left:"clear-left",right:"clear-right",both:"clear-both",none:"clear-none" },
  "box-sizing": { "border-box":"box-border","content-box":"box-content" },
  resize: { none:"resize-none",both:"resize",horizontal:"resize-x",vertical:"resize-y" },
  appearance: { none:"appearance-none",auto:"appearance-auto" },
  outline: { none:"outline-none","0":"outline-0" },
  "border-style": { solid:"border-solid",dashed:"border-dashed",dotted:"border-dotted",double:"border-double",none:"border-none",hidden:"border-hidden" },
  "background-attachment": { fixed:"bg-fixed",local:"bg-local",scroll:"bg-scroll" },
  "background-repeat": { repeat:"bg-repeat","no-repeat":"bg-no-repeat","repeat-x":"bg-repeat-x","repeat-y":"bg-repeat-y",round:"bg-repeat-round",space:"bg-repeat-space" },
  "background-size": { cover:"bg-cover",contain:"bg-contain",auto:"bg-auto" },
  "background-position": { center:"bg-center",top:"bg-top",bottom:"bg-bottom",left:"bg-left",right:"bg-right","left top":"bg-left-top","left bottom":"bg-left-bottom","right top":"bg-right-top","right bottom":"bg-right-bottom" },
  "background-clip": { "border-box":"bg-clip-border","padding-box":"bg-clip-padding","content-box":"bg-clip-content",text:"bg-clip-text" },
  "object-fit": { contain:"object-contain",cover:"object-cover",fill:"object-fill",none:"object-none","scale-down":"object-scale-down" },
  "object-position": { center:"object-center",top:"object-top",bottom:"object-bottom",left:"object-left",right:"object-right" },
  "table-layout": { auto:"table-auto",fixed:"table-fixed" },
  "border-collapse": { collapse:"border-collapse",separate:"border-separate" },
  "list-style-type": { none:"list-none",disc:"list-disc",decimal:"list-decimal" },
  "list-style-position": { inside:"list-inside",outside:"list-outside" },
  "-webkit-font-smoothing": { antialiased:"antialiased",auto:"subpixel-antialiased" },
  "will-change": { auto:"will-change-auto","scroll-position":"will-change-scroll",contents:"will-change-contents",transform:"will-change-transform" },
  "touch-action": { auto:"touch-auto",none:"touch-none","pan-x":"touch-pan-x","pan-y":"touch-pan-y",manipulation:"touch-manipulation" },
  isolation: { isolate:"isolate",auto:"isolation-auto" },
  "mix-blend-mode": { normal:"mix-blend-normal",multiply:"mix-blend-multiply",screen:"mix-blend-screen",overlay:"mix-blend-overlay",darken:"mix-blend-darken",lighten:"mix-blend-lighten","color-dodge":"mix-blend-color-dodge","color-burn":"mix-blend-color-burn","hard-light":"mix-blend-hard-light","soft-light":"mix-blend-soft-light",difference:"mix-blend-difference",exclusion:"mix-blend-exclusion",hue:"mix-blend-hue",saturation:"mix-blend-saturation",color:"mix-blend-color",luminosity:"mix-blend-luminosity","plus-lighter":"mix-blend-plus-lighter" },
  "grid-auto-flow": { row:"grid-flow-row",column:"grid-flow-col",dense:"grid-flow-dense","row dense":"grid-flow-row-dense","column dense":"grid-flow-col-dense" },
  "transition-timing-function": { linear:"ease-linear",ease:"ease-in-out","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out" },
  "flex-shrink": { "0":"shrink-0","1":"shrink" },
  "flex-grow": { "0":"grow-0","1":"grow" },
  "break-before": { auto:"break-before-auto",avoid:"break-before-avoid",all:"break-before-all",page:"break-before-page",column:"break-before-column" },
  "break-after": { auto:"break-after-auto",avoid:"break-after-avoid",all:"break-after-all",page:"break-after-page",column:"break-after-column" },
  "break-inside": { auto:"break-inside-auto",avoid:"break-inside-avoid","avoid-page":"break-inside-avoid-page","avoid-column":"break-inside-avoid-column" },
  "-webkit-line-clamp": { "1":"line-clamp-1","2":"line-clamp-2","3":"line-clamp-3","4":"line-clamp-4","5":"line-clamp-5","6":"line-clamp-6",none:"line-clamp-none" },
  "line-clamp": { "1":"line-clamp-1","2":"line-clamp-2","3":"line-clamp-3","4":"line-clamp-4","5":"line-clamp-5","6":"line-clamp-6",none:"line-clamp-none" },
}

const CSS_NUMERIC: Record<string, string> = {
  "font-size": "text", "font-weight": "font", "line-height": "leading", "letter-spacing": "tracking",
  padding: "p", "padding-top": "pt", "padding-bottom": "pb", "padding-left": "pl", "padding-right": "pr",
  "padding-inline": "px", "padding-block": "py", "padding-inline-start": "pl", "padding-inline-end": "pr",
  "padding-block-start": "pt", "padding-block-end": "pb",
  margin: "m", "margin-top": "mt", "margin-bottom": "mb", "margin-left": "ml", "margin-right": "mr",
  "margin-inline": "mx", "margin-block": "my", "margin-inline-start": "ml", "margin-inline-end": "mr",
  "margin-block-start": "mt", "margin-block-end": "mb",
  gap: "gap", "column-gap": "gap-x", "row-gap": "gap-y",
  width: "w", height: "h", "min-width": "min-w", "max-width": "max-w", "min-height": "min-h", "max-height": "max-h",
  "border-radius": "rounded",
  "border-top-left-radius": "rounded-tl", "border-top-right-radius": "rounded-tr",
  "border-bottom-left-radius": "rounded-bl", "border-bottom-right-radius": "rounded-br",
  "border-width": "border", "border-top-width": "border-t", "border-bottom-width": "border-b",
  "border-left-width": "border-l", "border-right-width": "border-r",
  opacity: "opacity", "z-index": "z",
  "transition-duration": "duration", "transition-delay": "delay",
  top: "top", bottom: "bottom", left: "left", right: "right", inset: "inset",
  "flex-basis": "basis",
}

const CSS_COLORS: Record<string, string> = {
  white: "white", black: "black", transparent: "transparent", currentcolor: "current",
  "#fff": "white", "#ffffff": "white", "#000": "black", "#000000": "black",
  red: "red-500", blue: "blue-500", green: "green-500", yellow: "yellow-500",
  gray: "gray-500", grey: "gray-500", orange: "orange-500", purple: "purple-500",
  pink: "pink-500", indigo: "indigo-500", cyan: "cyan-500", teal: "teal-500",
  slate: "slate-500", zinc: "zinc-500", neutral: "neutral-500", stone: "stone-500",
  rose: "rose-500", fuchsia: "fuchsia-500", violet: "violet-500", sky: "sky-500",
  lime: "lime-500", emerald: "emerald-500", amber: "amber-500",
}

const FONT_WEIGHT_KEYWORDS: Record<string, string> = {
  thin: "font-thin", extralight: "font-extralight", light: "font-light",
  normal: "font-normal", medium: "font-medium", semibold: "font-semibold",
  bold: "font-bold", extrabold: "font-extrabold", black: "font-black",
}

interface CSSDecl { prop: string; val: string }

function expandShorthand(cssProp: string, val: string): Array<[string, string]> | null {
  const parts = val.trim().split(/\s+/).filter(Boolean)
  const prefixMap: Record<string, string> = { padding: "p", margin: "m", inset: "inset" }
  const pre = prefixMap[cssProp]

  if (cssProp === "gap") {
    if (parts.length === 1) return [["gap", parts[0]]]
    if (parts.length === 2) return [["gap-y", parts[0]], ["gap-x", parts[1]]]
    return null
  }

  if (!pre) return null
  if (parts.length === 1) return [[pre, parts[0]]]
  if (parts.length === 2) return [[`${pre}y`, parts[0]], [`${pre}x`, parts[1]]]
  if (parts.length === 3) return [[`${pre}t`, parts[0]], [`${pre}x`, parts[1]], [`${pre}b`, parts[2]]]
  if (parts.length === 4) return [[`${pre}t`, parts[0]], [`${pre}r`, parts[1]], [`${pre}b`, parts[2]], [`${pre}l`, parts[3]]]
  return null
}

function cssToTailwind(prop: string, val: string, ver: TailwindVersion): string[] | null {
  prop = prop.toLowerCase().trim()
  val = val.replace(/\s*!important\s*$/, "").trim()

  if (prop === "color" || prop === "fill") {
    const c = CSS_COLORS[val.toLowerCase()]
    return c ? [`text-${c}`] : [`text-[${val}]`]
  }
  if (prop === "background-color" || prop === "background") {
    const bc = CSS_COLORS[val.toLowerCase()]
    if (bc) return [`bg-${bc}`]
    if (/^(#|rgb|hsl)/.test(val) || ["transparent", "white", "black"].includes(val)) return [`bg-[${val}]`]
    return null
  }
  if (prop === "border-color") {
    const bcc = CSS_COLORS[val.toLowerCase()]
    return [`border-${bcc ?? `[${val}]`}`]
  }
  if (prop === "stroke-width") {
    const sw: Record<string, string> = { "0": "stroke-0", "1": "stroke-1", "2": "stroke-2" }
    return sw[val] ? [sw[val]] : null
  }

  if (CSS_KEYWORDS[prop]) {
    const kw = CSS_KEYWORDS[prop][val] ?? CSS_KEYWORDS[prop][val.toLowerCase()]
    if (kw) return [kw]
  }

  if (prop === "font-weight") {
    if (FONT_WEIGHT_KEYWORDS[val.toLowerCase()]) return [FONT_WEIGHT_KEYWORDS[val.toLowerCase()]]
    const fwNum = parseInt(val, 10)
    if (!isNaN(fwNum) && FONT_WEIGHT[fwNum]) return [FONT_WEIGHT[fwNum]]
  }

  if (prop === "transition") {
    if (val === "none") return ["transition-none"]
    if (val === "all") return ["transition-all"]
    if (/color|background|border|fill|stroke/.test(val)) return ["transition-colors"]
    if (/opacity/.test(val)) return ["transition-opacity"]
    if (/transform/.test(val)) return ["transition-transform"]
    if (/shadow/.test(val)) return ["transition-shadow"]
    return ["transition"]
  }

  if (["padding", "margin", "inset", "gap"].includes(prop)) {
    const expanded = expandShorthand(prop, val)
    if (expanded) {
      return expanded.map(([twProp, twVal]) => {
        const arbitrary = `${twProp}-[${twVal}]`
        return convertArbitrary(arbitrary, ver) ?? arbitrary
      })
    }
  }

  if (CSS_NUMERIC[prop]) {
    const arbitrary = `${CSS_NUMERIC[prop]}-[${val}]`
    return [convertArbitrary(arbitrary, ver) ?? arbitrary]
  }

  return null
}

function parseCSS(input: string): CSSDecl[] {
  let str = input.trim()
  const blockMatch = str.match(/\{([^}]*)\}/)
  if (blockMatch) str = blockMatch[1]
  return str
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const idx = d.indexOf(":")
      if (idx === -1) return null
      return { prop: d.slice(0, idx).trim(), val: d.slice(idx + 1).trim() }
    })
    .filter((d): d is CSSDecl => d !== null && d.prop !== "" && d.val !== "")
}

// ─── Mode detection ───────────────────────────────────────────────────────────

const VARIANT_RE = /^(2xl|xl|lg|md|sm|dark|hover|focus-within|focus-visible|focus|active|visited|disabled|checked|required|invalid|first|last|odd|even|group-hover|group-focus|peer-hover|peer-focus|placeholder|before|after)$/

export function detectMode(input: string): "css" | "tailwind" {
  const trimmed = input.trim()
  if (/[{}]/.test(trimmed) || /;/.test(trimmed)) return "css"
  for (const line of trimmed.split("\n")) {
    const l = line.trim()
    if (!l) continue
    const colonIdx = l.indexOf(":")
    if (colonIdx === -1) continue
    const before = l.slice(0, colonIdx)
    if (VARIANT_RE.test(before)) continue
    if (/\s/.test(before)) return "css"
    if (/^-?[a-z][a-z-]{2,}$/.test(before) && !VARIANT_RE.test(before)) return "css"
  }
  return "tailwind"
}

// ─── Prefix splitter ──────────────────────────────────────────────────────────

const PREFIX_RE = /^((?:(?:2xl|xl|lg|md|sm|dark|hover|focus-within|focus-visible|focus|active|visited|disabled|checked|required|invalid|first|last|odd|even|group-hover|group-focus|peer-hover|peer-focus|placeholder|before|after|aria-[a-z-]+|data-[a-z-]+):)*)/

function splitPrefix(cls: string): { prefix: string; base: string } {
  const m = cls.match(PREFIX_RE)
  const prefix = m?.[1] ?? ""
  return { prefix, base: cls.slice(prefix.length) }
}

function isArbitrary(cls: string): boolean {
  return /\[.+?\]/.test(cls)
}

/**
 * Convert opacity modifier arbitrary values: bg-white/[0.08] -> bg-white/8
 * Handles any class with a /[decimal] suffix. Prefixes (sm:, hover:, etc.) are preserved.
 * Returns null if already canonical or not an opacity modifier pattern.
 */
export function convertOpacityMod(cls: string): string | null {
  const m = cls.match(/^(.+)\/\[([^\]]+)\]$/)
  if (!m) return null
  const [, base, val] = m
  const n = parseFloat(val)
  if (isNaN(n) || n < 0) return null
  // Reject non-integer values greater than 1 (e.g. /[1.5] is ambiguous)
  if (n > 1 && !Number.isInteger(n)) return null
  const pct = n <= 1 ? n * 100 : n
  if (pct > 100) return null
  // Round to 1 decimal to absorb float noise (0.3 * 100 = 30.000000000000004)
  const rounded = Math.round(pct * 10) / 10
  // Reject if value has more than 1 decimal place (e.g. 0.076 → 7.6 → reject)
  if (rounded !== Math.round(rounded * 10) / 10) return null
  // Format: drop trailing .0, keep .5 etc. (2.5 stays "2.5", 30.0 becomes "30")
  const formatted = rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(1)
  return `${base}/${formatted}`
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function normalize(input: string, ver: TailwindVersion): NormalizeResult {
  const mode = detectMode(input)
  return mode === "css" ? normalizeCSS(input, ver) : normalizeTailwind(input, ver)
}

function normalizeTailwind(raw: string, ver: TailwindVersion): NormalizeResult {
  const str = raw
    .replace(/className\s*=\s*"([^"]*)"/g, "$1")
    .replace(/className\s*=\s*'([^']*)'/g, "$1")
    .replace(/class\s*=\s*"([^"]*)"/g, "$1")
    .replace(/class\s*=\s*'([^']*)'/g, "$1")

  const tokens = str.trim().split(/\s+/).filter(Boolean)
  const exact = getExact(ver)
  const result: NormalizedToken[] = []

  for (const tok of tokens) {
    if (DEPRECATED[tok]) {
      result.push({ original: tok, result: DEPRECATED[tok], state: "deprecated" })
      continue
    }

    const { prefix, base } = splitPrefix(tok)

    if (DEPRECATED[base]) {
      result.push({ original: tok, result: prefix + DEPRECATED[base], state: "deprecated" })
      continue
    }

    // Opacity modifier: bg-white/[0.08] -> bg-white/8
    // Run before prefix-stripping since it operates on the full token
    const opacityMod = convertOpacityMod(tok)
    if (opacityMod) {
      result.push({ original: tok, result: opacityMod, state: "changed" })
      continue
    }

    const replacement =
      exact[base] ?? exact[base.toLowerCase()] ??
      (isArbitrary(base) ? (convertArbitrary(base, ver) ?? convertArbitrary(base.toLowerCase(), ver) ?? null) : null)

    if (replacement) {
      result.push({ original: tok, result: prefix + replacement, state: "changed" })
    } else if (isArbitrary(base)) {
      result.push({ original: tok, result: tok, state: "unknown" })
    } else {
      result.push({ original: tok, result: tok, state: "ok" })
    }
  }

  return buildResult(result, "tailwind")
}

function normalizeCSS(raw: string, ver: TailwindVersion): NormalizeResult {
  const decls = parseCSS(raw)
  const result: NormalizedToken[] = []

  for (const { prop, val } of decls) {
    const classes = cssToTailwind(prop, val, ver)
    const original = `${prop}: ${val}`

    if (!classes) {
      result.push({ original, result: `/* ${original} */`, state: "unknown" })
      continue
    }

    for (let cls of classes) {
      // Try opacity modifier first: bg-white/[0.08] -> bg-white/8
      const opacityMod = convertOpacityMod(cls)
      if (opacityMod) {
        cls = opacityMod
      } else if (isArbitrary(cls)) {
        const { prefix, base } = splitPrefix(cls)
        const better = convertArbitrary(base, ver)
        if (better) cls = prefix + better
      }
      result.push({
        original,
        result: cls,
        state: isArbitrary(cls) ? "unknown" : "changed",
      })
    }
  }

  return buildResult(result, "css")
}

function buildResult(tokens: NormalizedToken[], mode: "tailwind" | "css"): NormalizeResult {
  const stats = {
    total: tokens.length,
    fixed: tokens.filter((t) => t.state === "changed").length,
    deprecated: tokens.filter((t) => t.state === "deprecated").length,
    arbitrary: tokens.filter((t) => t.state === "unknown").length,
    ok: tokens.filter((t) => t.state === "ok").length,
  }
  return {
    tokens,
    output: tokens.map((t) => t.result).join(" "),
    stats,
    mode,
  }
}