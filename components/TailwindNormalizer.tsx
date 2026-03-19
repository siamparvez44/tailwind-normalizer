"use client"

import { useCallback, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  type NormalizedToken,
  type NormalizeResult,
  type TailwindVersion,
  DEPRECATED,
  detectMode,
  normalize,
} from "@/lib/tw-normalizer"

// ─── Showcase data ────────────────────────────────────────────────────────────

const SHOWCASE_V3: Array<[string, string]> = [
  ["text-[1rem]", "text-base"],
  ["text-[0.875rem]", "text-sm"],
  ["text-[1.5rem]", "text-2xl"],
  ["font-[700]", "font-bold"],
  ["p-[1rem]", "p-4"],
  ["gap-[0.5rem]", "gap-2"],
  ["mt-[2rem]", "mt-8"],
  ["w-[100%]", "w-full"],
  ["h-[100vh]", "h-screen"],
  ["rounded-[0.5rem]", "rounded-lg"],
  ["display: flex", "flex"],
  ["font-size: 1rem", "text-base"],
  ["padding: 1rem 2rem", "py-4 px-8"],
  ["align-items: center", "items-center"],
  ["flex-shrink-0", "shrink-0"],
  ["overflow-ellipsis", "text-ellipsis"],
  ["flex-grow", "grow"],
  ["font-hairline", "font-thin"],
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
  ["display: flex", "flex"],
  ["font-size: 1rem", "text-base"],
  ["padding: 1rem 2rem", "py-4 px-8"],
  ["justify-content: space-between", "justify-between"],
  ["flex-shrink-0", "shrink-0"],
  ["overflow-ellipsis", "text-ellipsis"],
  ["flex-grow", "grow"],
  ["xl:text-[0.75rem]", "xl:text-xs"],
  ["sm:p-[1rem]", "sm:p-4"],
  ["hover:opacity-[0.8]", "hover:opacity-80"],
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function TokenChip({ token }: { token: NormalizedToken }) {
  if (token.state === "changed") {
    return (
      <span
        title={`was: ${token.original}`}
        className="inline-block rounded px-1 py-px font-medium text-[#ccff00] bg-[#ccff00]/10 cursor-help"
      >
        {token.result}
      </span>
    )
  }
  if (token.state === "deprecated") {
    return (
      <span
        title={`deprecated: ${token.original}`}
        className="inline-block rounded px-1 py-px font-medium text-purple-400 bg-purple-400/10 cursor-help"
      >
        {token.result}
      </span>
    )
  }
  if (token.state === "unknown") {
    return (
      <span className="inline-block rounded px-1 py-px text-amber-400 bg-amber-400/10">
        {token.result}
      </span>
    )
  }
  return <span>{token.result}</span>
}

function StatCard({
  value,
  label,
  accent,
}: {
  value: number
  label: string
  accent?: "green" | "amber"
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
      <p
        className={cn(
          "font-mono text-2xl font-bold leading-none",
          accent === "green" && "text-[#ccff00]",
          accent === "amber" && "text-amber-400",
          !accent && "text-zinc-100",
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-zinc-500">{label}</p>
    </div>
  )
}

function ShowcaseCard({ from, to }: { from: string; to: string }) {
  return (
    <div className="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-xs">
      <span className="text-zinc-500 line-through">{from}</span>
      <span className="mx-1.5 text-zinc-600">→</span>
      <span className="text-[#ccff00]">{to}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TailwindNormalizerProps {
  /** Initial version to use */
  defaultVersion?: TailwindVersion
  /** Override container className */
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

  const showcase = ver === 4 ? SHOWCASE_V4 : SHOWCASE_V3

  const handleInput = useCallback(
    (value: string) => {
      setInput(value)
      setLiveMode(value.trim() ? detectMode(value) : null)
    },
    [],
  )

  const handleNormalize = useCallback(() => {
    if (!input.trim()) return
    setResult(normalize(input, ver))
  }, [input, ver])

  const handleVersionChange = useCallback(
    (v: TailwindVersion) => {
      setVer(v)
      if (result) setResult(normalize(input, v))
    },
    [input, result],
  )

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
    setTimeout(() => setCopied(false), 1500)
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

  const hasDeprecated = result?.stats.deprecated ?? 0 > 0

  return (
    <div className={cn("space-y-6", className)}>
      {/* Version toggle */}
      <div className="flex gap-2">
        {([3, 4] as TailwindVersion[]).map((v) => (
          <button
            key={v}
            onClick={() => handleVersionChange(v)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 font-mono text-xs font-medium transition-all",
              ver === v
                ? "border-[#ccff00] bg-[#ccff00] text-zinc-900 font-bold"
                : "border-white/15 text-zinc-500 hover:bg-white/6 hover:text-zinc-300",
            )}
          >
            Tailwind v{v}
            {v === 4 && " / v4.2"}
          </button>
        ))}
      </div>

      {/* v4 info banner */}
      {ver === 4 && (
        <div className="rounded-md border border-white/8 border-l-[3px] border-l-[#ccff00] bg-white/3 px-3.5 py-2.5 text-xs text-zinc-500 leading-relaxed">
          v4 font-size:{" "}
          <code className="text-[#ccff00] font-mono">text-xs</code>=12px,{" "}
          <code className="text-[#ccff00] font-mono">text-sm</code>=14px,{" "}
          <code className="text-[#ccff00] font-mono">text-base</code>=16px.
          Values below 12px stay amber. Border-radius:{" "}
          <code className="text-[#ccff00] font-mono">rounded-xs</code>=2px,{" "}
          <code className="text-[#ccff00] font-mono">rounded-sm</code>=4px.
          Unit conversion assumes{" "}
          <code className="text-[#ccff00] font-mono">1rem = 16px</code>.
        </div>
      )}

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
            Input
          </label>
          {liveMode && (
            <Badge
              variant="outline"
              className={cn(
                "rounded-full border px-2 py-0 text-[11px] font-mono h-auto",
                liveMode === "css"
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                  : "border-[#ccff00]/20 bg-[#ccff00]/10 text-[#ccff00]",
              )}
            >
              {liveMode === "css" ? "CSS" : "Tailwind"}
            </Badge>
          )}
        </div>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste Tailwind classes, CSS declarations, or a CSS block..."
          className="min-h-[110px] resize-y border-white/[0.08] bg-white/[0.04] font-mono text-[13px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#ccff00]/30 focus-visible:border-white/20"
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleNormalize}
            disabled={!input.trim()}
            className="bg-[#ccff00] text-zinc-900 font-semibold hover:bg-[#d4ff1a] disabled:opacity-40"
          >
            Normalize
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!result?.output}
            className="border-white/15 bg-transparent text-zinc-300 hover:bg-white/[0.06]"
          >
            {copied ? "Copied!" : "Copy output"}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClear}
            className="text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
          >
            Clear
          </Button>
          <span className="ml-auto text-[11px] text-zinc-600">
            ⌘ + Enter to normalize
          </span>
        </div>
      </div>

      {/* Output */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Output
            </label>
            <div className="flex items-center gap-3 text-[11px] text-zinc-600">
              {result.stats.fixed + result.stats.deprecated > 0 && (
                <span>{result.stats.fixed + result.stats.deprecated} replacement{result.stats.fixed + result.stats.deprecated !== 1 ? "s" : ""}</span>
              )}
              <button
                onClick={handleCopy}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="min-h-[52px] rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 font-mono text-[13px] leading-loose break-all">
            {result.tokens.map((token, i) => (
              <span key={i}>
                <TokenChip token={token} />
                {i < result.tokens.length - 1 ? " " : ""}
              </span>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-[12px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#ccff00]/40" />
              Replaced
            </span>
            {hasDeprecated && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-sm bg-purple-400/50" />
                Deprecated alias
              </span>
            )}
            {result.stats.arbitrary > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-sm bg-amber-400/40" />
                No canonical match
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatCard value={result.stats.total} label="total" />
            <StatCard value={result.stats.fixed + result.stats.deprecated} label="normalized" accent="green" />
            <StatCard value={result.stats.arbitrary} label="still arbitrary" accent="amber" />
            <StatCard value={result.stats.ok} label="already canonical" />
          </div>
        </div>
      )}

      {/* Showcase */}
      <div className="space-y-3 pt-2">
        <div className="h-px bg-white/[0.06]" />
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
          Common replacements — v{ver}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {showcase.map(([from, to]) => (
            <ShowcaseCard key={from} from={from} to={to} />
          ))}
        </div>
      </div>
    </div>
  )
}