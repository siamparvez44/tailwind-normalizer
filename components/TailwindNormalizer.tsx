"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  type NormalizedToken,
  type NormalizeResult,
  type TailwindVersion,
  detectMode,
  normalize,
} from "@/lib/tw-normalizer"

// ─── Constants ────────────────────────────────────────────────────────────────

const SHOWCASE_V3: Array<[string, string]> = [
  ["text-[1rem]", "text-base"],
  ["text-[0.875rem]", "text-sm"],
  ["font-[700]", "font-bold"],
  ["p-[1rem]", "p-4"],
  ["gap-[0.5rem]", "gap-2"],
  ["w-[100%]", "w-full"],
  ["h-[100vh]", "h-screen"],
  ["min-h-[110px]", "min-h-27.5"],
  ["rounded-[0.5rem]", "rounded-lg"],
  ["border-white/[0.08]", "border-white/8"],
  ["bg-white/[0.04]", "bg-white/4"],
  ["display: flex", "flex"],
  ["font-size: 1rem", "text-base"],
  ["padding: 1rem 2rem", "py-4 px-8"],
  ["flex-shrink-0", "shrink-0"],
  ["overflow-ellipsis", "text-ellipsis"],
  ["sm:text-[0.875rem]", "sm:text-sm"],
  ["hover:opacity-[0.8]", "hover:opacity-80"],
]

const SHOWCASE_V4: Array<[string, string]> = [
  ["text-[1rem]", "text-base"],
  ["text-[0.875rem]", "text-sm"],
  ["font-[700]", "font-bold"],
  ["p-[1rem]", "p-4"],
  ["gap-[0.5rem]", "gap-2"],
  ["w-[100%]", "w-full"],
  ["size-[1.5rem]", "size-6"],
  ["rounded-[0.5rem]", "rounded-lg"],
  ["rounded-[0.25rem]", "rounded-sm"],
  ["rounded-[0.125rem]", "rounded-xs"],
  ["border-white/[0.08]", "border-white/8"],
  ["bg-white/[0.04]", "bg-white/4"],
  ["display: flex", "flex"],
  ["font-size: 1rem", "text-base"],
  ["padding: 1rem 2rem", "py-4 px-8"],
  ["flex-shrink-0", "shrink-0"],
  ["xl:text-[0.75rem]", "xl:text-xs"],
  ["hover:opacity-[0.8]", "hover:opacity-80"],
]

// ─── Icons ────────────────────────────────────────────────────────────────────

const ArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2 8V2a1 1 0 0 1 1-1h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
    <path d="M7 4.5v4M7 10v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

// ─── Token chip ───────────────────────────────────────────────────────────────

function TokenChip({ token }: { token: NormalizedToken }) {
  const base = "inline-block rounded px-1.5 py-0.5 font-mono text-[13px] leading-snug transition-colors duration-100"

  if (token.state === "changed") {
    return (
      <span
        title={`was: ${token.original}`}
        className={cn(base, "cursor-help bg-[#ccff00]/10 text-[#ccff00] hover:bg-[#ccff00]/15")}
      >
        {token.result}
      </span>
    )
  }
  if (token.state === "deprecated") {
    return (
      <span
        title={`deprecated alias — was: ${token.original}`}
        className={cn(base, "cursor-help bg-violet-500/10 text-violet-400 hover:bg-violet-500/15")}
      >
        {token.result}
      </span>
    )
  }
  if (token.state === "unknown") {
    return (
      <span
        title="No canonical Tailwind equivalent found"
        className={cn(base, "cursor-help bg-amber-500/10 text-amber-400 hover:bg-amber-500/15")}
      >
        {token.result}
      </span>
    )
  }
  return (
    <span className="font-mono text-[13px] leading-snug text-zinc-500">
      {token.result}
    </span>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: "css" | "tailwind" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide ring-1",
        mode === "css"
          ? "bg-sky-500/10 text-sky-400 ring-sky-500/20"
          : "bg-[#ccff00]/10 text-[#ccff00] ring-[#ccff00]/20",
      )}
    >
      <span className={cn("size-1.5 rounded-full", mode === "css" ? "bg-sky-400" : "bg-[#ccff00]")} />
      {mode === "css" ? "CSS" : "Tailwind"}
    </span>
  )
}

function CopyButton({
  onCopy,
  copied,
  disabled,
  variant = "default",
}: {
  onCopy: () => void
  copied: boolean
  disabled?: boolean
  variant?: "default" | "ghost"
}) {
  return (
    <button
      onClick={onCopy}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-mono text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-30",
        variant === "default"
          ? "border border-white/10 bg-white/4 px-3 py-1.5 text-zinc-400 hover:border-white/20 hover:bg-white/8 hover:text-zinc-200"
          : "px-2 py-1 text-zinc-600 hover:bg-white/6 hover:text-zinc-400",
        copied && "border-[#ccff00]/20 bg-[#ccff00]/8 text-[#ccff00]",
      )}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

function VersionToggle({
  ver,
  onChange,
}: {
  ver: TailwindVersion
  onChange: (v: TailwindVersion) => void
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-white/8 bg-white/[0.03] p-0.5">
      {([3, 4] as TailwindVersion[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-md px-3.5 py-1.5 font-mono text-xs font-medium transition-all duration-150",
            ver === v
              ? "bg-[#ccff00] text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          v{v}{v === 4 ? ".2" : ""}
        </button>
      ))}
    </div>
  )
}

function StatBadge({
  value,
  label,
  color,
}: {
  value: number
  label: string
  color: "lime" | "violet" | "amber" | "zinc"
}) {
  const colors = {
    lime: "text-[#ccff00]",
    violet: "text-violet-400",
    amber: "text-amber-400",
    zinc: "text-zinc-500",
  }
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={cn("font-mono text-lg font-semibold tabular-nums leading-none", colors[color])}>
        {value}
      </span>
      <span className="text-[11px] text-zinc-600">{label}</span>
    </span>
  )
}

function LegendDot({ color }: { color: "lime" | "violet" | "amber" }) {
  const colors = {
    lime: "bg-[#ccff00]/40",
    violet: "bg-violet-400/40",
    amber: "bg-amber-400/40",
  }
  return <span className={cn("inline-block size-2 shrink-0 rounded-sm", colors[color])} />
}

function EmptyOutput() {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
      <div className="flex size-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-700">
          <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M9 11.75h5.5M11.75 9v5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-sm text-zinc-600">Output will appear here</p>
        <p className="mt-0.5 text-xs text-zinc-700">Hover tokens to see what changed</p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TailwindNormalizerProps {
  defaultVersion?: TailwindVersion
  className?: string
}

export function TailwindNormalizer({
  defaultVersion = 3,
  className,
}: TailwindNormalizerProps) {
  const [ver, setVer] = useState<TailwindVersion>(defaultVersion)
  const [input, setInput] = useState("")
  const [result, setResult] = useState<NormalizeResult | null>(null)
  const [liveMode, setLiveMode] = useState<"css" | "tailwind" | null>(null)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  const showcase = ver === 4 ? SHOWCASE_V4 : SHOWCASE_V3

  const handleInput = useCallback((value: string) => {
    setInput(value)
    setLiveMode(value.trim() ? detectMode(value) : null)
  }, [])

  const handleNormalize = useCallback(() => {
    if (!input.trim()) return
    setResult(normalize(input, ver))
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 50)
  }, [input, ver])

  const handleVersionChange = useCallback((v: TailwindVersion) => {
    setVer(v)
  }, [])

  useEffect(() => {
    if (result && input.trim()) setResult(normalize(input, ver))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ver])

  const handleCopy = useCallback(() => {
    if (!result?.output) return
    const fallback = () => {
      const ta = document.createElement("textarea")
      ta.value = result.output
      ta.style.cssText = "position:fixed;opacity:0;height:1px"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    navigator.clipboard?.writeText(result.output).catch(fallback) ?? fallback()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result])

  const handleClear = useCallback(() => {
    setInput("")
    setResult(null)
    setLiveMode(null)
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        handleNormalize()
      }
    },
    [handleNormalize],
  )

  const totalReplaced = (result?.stats.fixed ?? 0) + (result?.stats.deprecated ?? 0)
  const hasResult = result !== null
  const hasDeprecated = (result?.stats.deprecated ?? 0) > 0
  const hasArbitrary = (result?.stats.arbitrary ?? 0) > 0

  return (
    <div className={cn("flex flex-col gap-6", className)}>

      {/* ── Header row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VersionToggle ver={ver} onChange={handleVersionChange} />
        <kbd className="hidden items-center gap-1 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-zinc-600 sm:inline-flex">
          <span className="text-[10px]">⌘</span> Enter to normalize
        </kbd>
      </div>

      {/* ── v4 info banner ── */}
      {ver === 4 && (
        <div className="flex items-start gap-3 rounded-xl border border-[#ccff00]/10 bg-[#ccff00]/[0.03] px-4 py-3">
          <span className="mt-px shrink-0 text-[#ccff00]/60">
            <InfoIcon />
          </span>
          <p className="text-[12px] leading-relaxed text-zinc-500">
            v4 font sizes:{" "}
            <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#ccff00]">text-xs</code>=12px{" "}
            <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#ccff00]">text-sm</code>=14px{" "}
            <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#ccff00]">text-base</code>=16px.{" "}
            Radius:{" "}
            <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#ccff00]">rounded-xs</code>=2px{" "}
            <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#ccff00]">rounded-sm</code>=4px.{" "}
            Assumes <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#ccff00]">1rem=16px</code>.
          </p>
        </div>
      )}

      {/* ── Editor + Output (side-by-side on lg) ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="flex h-6 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Input</span>
              {liveMode && <ModeBadge mode={liveMode} />}
            </div>
            {input && (
              <button
                onClick={handleClear}
                className="text-[11px] text-zinc-700 transition-colors hover:text-zinc-400"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Paste Tailwind classes or CSS\n\ntext-[1rem] font-[700] p-[16px]\ndisplay: flex; gap: 0.5rem;\nflex-shrink-0 overflow-ellipsis`}
              spellCheck={false}
              rows={10}
              className={cn(
                "w-full rounded-xl border bg-white/[0.025] px-4 py-3.5",
                "font-mono text-[13px] leading-relaxed text-zinc-200",
                "placeholder:text-zinc-700/60",
                "outline-none transition-all duration-150 resize-y",
                "border-white/8 hover:border-white/[0.12]",
                "focus:border-[#ccff00]/25 focus:bg-[#ccff00]/[0.015] focus:shadow-[0_0_0_3px_rgba(204,255,0,0.04)]",
              )}
            />
          </div>

          <button
            onClick={handleNormalize}
            disabled={!input.trim()}
            className={cn(
              "flex h-10 w-full items-center justify-center gap-2 rounded-lg",
              "font-mono text-sm font-semibold tracking-wide",
              "transition-all duration-150 active:scale-[0.985]",
              "bg-[#ccff00] text-zinc-900",
              "hover:bg-[#d9ff33] hover:shadow-[0_0_24px_rgba(204,255,0,0.2)]",
              "disabled:cursor-not-allowed disabled:opacity-20 disabled:shadow-none",
            )}
          >
            <ArrowRight />
            Normalize
          </button>
        </div>

        {/* Output */}
        <div ref={outputRef} className="flex flex-col gap-2">
          <div className="flex h-6 items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Output</span>
            {hasResult && (
              <CopyButton onCopy={handleCopy} copied={copied} disabled={!result?.output} variant="ghost" />
            )}
          </div>

          <div
            className={cn(
              "flex min-h-[258px] flex-1 flex-col rounded-xl border transition-colors duration-150",
              hasResult
                ? "border-white/10 bg-white/[0.025]"
                : "border-white/6 bg-white/[0.015]",
            )}
          >
            {!hasResult ? (
              <EmptyOutput />
            ) : (
              <div className="flex flex-col gap-0 divide-y divide-white/6">

                {/* Token area */}
                <div className="flex flex-wrap gap-1 px-4 py-3.5 leading-loose">
                  {result.tokens.map((token, i) => (
                    <TokenChip key={i} token={token} />
                  ))}
                </div>

                {/* Stats + copy */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {totalReplaced > 0 && (
                      <StatBadge value={totalReplaced} label="normalized" color="lime" />
                    )}
                    {hasDeprecated && (
                      <StatBadge value={result.stats.deprecated} label="deprecated" color="violet" />
                    )}
                    {hasArbitrary && (
                      <StatBadge value={result.stats.arbitrary} label="no match" color="amber" />
                    )}
                    <StatBadge value={result.stats.ok} label="unchanged" color="zinc" />
                  </div>
                  <CopyButton onCopy={handleCopy} copied={copied} disabled={!result?.output} />
                </div>

                {/* Legend */}
                {(totalReplaced > 0 || hasDeprecated || hasArbitrary) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5">
                    {totalReplaced > 0 && (
                      <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                        <LegendDot color="lime" /> Replaced
                      </span>
                    )}
                    {hasDeprecated && (
                      <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                        <LegendDot color="violet" /> Deprecated alias
                      </span>
                    )}
                    {hasArbitrary && (
                      <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                        <LegendDot color="amber" /> No canonical match
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Showcase ── */}
      <div className="mt-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/6" />
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-widest text-zinc-700">
            Common replacements · v{ver}
          </span>
          <div className="h-px flex-1 bg-white/6" />
        </div>

        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
          {showcase.map(([from, to]) => (
            <div
              key={from}
              className="group flex items-center gap-2 rounded-md px-3 py-2 transition-colors duration-100 hover:bg-white/4"
            >
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-600 line-through decoration-zinc-700/60">
                {from}
              </code>
              <span className="shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-500">
                <ArrowRight />
              </span>
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#ccff00]">{to}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}