"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"
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

const VERSION_STORAGE_KEY = "tailwind-normalizer.version"

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
        className={cn(base, "cursor-help bg-[#00c6e7]/10 text-[#00c6e7] hover:bg-[#00c6e7]/15 dark:bg-[#ccff00]/10 dark:text-[#ccff00] dark:hover:bg-[#ccff00]/15")}
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
          : "bg-[#00c6e7]/10 text-[#00c6e7] ring-[#00c6e7]/20 dark:bg-[#ccff00]/10 dark:text-[#ccff00] dark:ring-[#ccff00]/20",
      )}
    >
      <span className={cn("size-1.5 rounded-full", mode === "css" ? "bg-sky-400" : "bg-[#00c6e7] dark:bg-[#ccff00]")} />
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
        copied && "border-[#00c6e7]/20 bg-[#00c6e7]/8 text-[#00c6e7] dark:border-[#ccff00]/20 dark:bg-[#ccff00]/8 dark:text-[#ccff00]",
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
    <div className="inline-flex items-center rounded-lg border border-white/8 bg-white/3 p-0.5">
      {([3, 4] as TailwindVersion[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-md px-3.5 py-1.5 font-mono text-xs font-medium transition-all duration-150",
            ver === v
              ? "bg-[#00c6e7] text-white shadow-sm dark:bg-[#ccff00] dark:text-zinc-900"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          v{v}
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
  color: "cyan" | "violet" | "amber" | "zinc"
}) {
  const colors = {
    cyan: "text-[#00c6e7] dark:text-[#ccff00]",
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

function LegendDot({ color }: { color: "cyan" | "violet" | "amber" }) {
  const colors = {
    cyan: "bg-[#00c6e7]/40 dark:bg-[#ccff00]/40",
    violet: "bg-violet-400/40",
    amber: "bg-amber-400/40",
  }
  return <span className={cn("inline-block size-2 shrink-0 rounded-sm", colors[color])} />
}

function EmptyOutput() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-2 text-center py-8">
      <div className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700/50 bg-zinc-50 dark:bg-white/5">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-zinc-400 dark:text-zinc-600">
          <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M9 11.75h5.5M11.75 9v5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Output will appear here</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Hover tokens to see what changed</p>
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
  defaultVersion = 4,
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
    try {
      const saved = window.localStorage.getItem(VERSION_STORAGE_KEY)
      if (saved === "3" || saved === "4") {
        setVer(Number(saved) as TailwindVersion)
      }
    } catch {
      // Ignore storage errors in restricted browser contexts.
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(VERSION_STORAGE_KEY, String(ver))
    } catch {
      // Ignore storage errors in restricted browser contexts.
    }
  }, [ver])

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
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(result.output).catch(fallback)
    } else {
      fallback()
    }
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("flex flex-col gap-6", className)}
    >

      {/* ── Header row ── */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <VersionToggle ver={ver} onChange={handleVersionChange} />
        <kbd className="hidden items-center gap-1 rounded-md border border-white/8 bg-white/3 px-2 py-1 font-mono text-[11px] text-zinc-600 sm:inline-flex">
          <span className="text-[10px]">⌘</span> Enter to normalize
        </kbd>
      </motion.div>

      {/* ── v4 info banner ── */}
      <AnimatePresence>
        {ver === 4 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 rounded-xl border border-[#00c6e7]/20 bg-[#00c6e7]/5 px-4 py-3 dark:border-[#ccff00]/20 dark:bg-[#ccff00]/5"
          >
            <span className="mt-px shrink-0 text-[#00c6e7]/60 dark:text-[#ccff00]/60">
              <InfoIcon />
            </span>
            <p className="text-[12px] leading-relaxed text-zinc-500">
              v4 font sizes:{" "}
              <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#00c6e7] dark:text-[#ccff00]">text-xs</code>=12px{" "}
              <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#00c6e7] dark:text-[#ccff00]">text-sm</code>=14px{" "}
              <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#00c6e7] dark:text-[#ccff00]">text-base</code>=16px.{" "}
              Radius:{" "}
              <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#00c6e7] dark:text-[#ccff00]">rounded-xs</code>=2px{" "}
              <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#00c6e7] dark:text-[#ccff00]">rounded-sm</code>=4px.{" "}
              Assumes <code className="rounded bg-white/6 px-1 font-mono text-[11px] text-[#00c6e7] dark:text-[#ccff00]">1rem=16px</code>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Editor + Output (side-by-side on lg) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid gap-4 lg:grid-cols-2"
      >

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
                "w-full rounded-lg border bg-white px-4 py-3 dark:bg-zinc-900/30",
                "font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-100",
                "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                "outline-none transition-colors duration-150 resize-y",
                "border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600/50",
                "focus:border-[#00c6e7] dark:focus:border-[#ccff00]/50 focus:ring-1 focus:ring-[#00c6e7]/20 dark:focus:ring-[#ccff00]/20",
              )}
            />
          </div>

          <button
            onClick={handleNormalize}
            disabled={!input.trim()}
            className={cn(
              "flex h-10 w-full items-center justify-center gap-2 rounded-lg",
              "font-semibold text-sm",
              "transition-all duration-200 active:scale-95",
              "bg-[#00c6e7] text-white hover:bg-[#00b5d4] shadow-sm dark:bg-[#ccff00] dark:text-zinc-900 dark:hover:bg-[#b8e600] dark:shadow-lg/10",
              "hover:shadow-md hover:shadow-[#00c6e7]/20 dark:hover:shadow-[#ccff00]/20",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:bg-zinc-300 dark:disabled:bg-zinc-700",
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
              "flex min-h-64.5 flex-1 flex-col items-center justify-center rounded-xl border transition-colors duration-150",
              hasResult
                ? "dark:border-white/10 bg-white/2.5 "
                : "dark:border-white/6 bg-white/1.5",
            )}
          >
            <AnimatePresence mode="wait">
              {!hasResult ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <EmptyOutput />
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-0 divide-y divide-white/6"
                >

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
                      <StatBadge value={totalReplaced} label="normalized" color="cyan" />
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
                        <LegendDot color="cyan" /> Replaced
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Showcase ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-12"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Common Replacements</h3>
          <div className="inline-flex items-center gap-2">
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-700/60 dark:bg-zinc-900/50 dark:text-zinc-400">
              v{ver}
            </span>
            <span className="rounded-md border border-[#00c6e7]/20 bg-[#00c6e7]/8 px-2 py-1 text-[11px] font-medium text-[#00c6e7] dark:border-[#ccff00]/20 dark:bg-[#ccff00]/8 dark:text-[#ccff00]">
              {showcase.length} examples
            </span>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-3 lg:grid-cols-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.04,
              },
            },
          }}
        >
          {showcase.map(([from, to]) => (
            <motion.div
              key={from}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.3 }}
              className="group grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700/50 dark:bg-zinc-900/30"
            >
              <code className="min-w-0 truncate rounded-md bg-zinc-50 px-2 py-1.5 font-mono text-xs text-zinc-500 line-through decoration-zinc-300 dark:bg-zinc-800/70 dark:text-zinc-500 dark:decoration-zinc-700">
                {from}
              </code>
              <span className="shrink-0 rounded-md bg-zinc-100 p-1 text-zinc-400 transition-colors group-hover:text-[#00c6e7] dark:bg-zinc-800 dark:text-zinc-600 dark:group-hover:text-[#ccff00]">
                <ArrowRight />
              </span>
              <code className="min-w-0 truncate rounded-md bg-[#00c6e7]/8 px-2 py-1.5 font-mono text-xs font-semibold text-[#00c6e7] dark:bg-[#ccff00]/12 dark:text-[#ccff00]">
                {to}
              </code>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}