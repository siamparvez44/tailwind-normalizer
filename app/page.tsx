
import { TailwindNormalizer } from "@/components/TailwindNormalizer"
import type { Metadata } from "next"


export const metadata: Metadata = {
  title: "Tailwind Class Normalizer",
  description:
    "Convert arbitrary Tailwind values, CSS declarations, and deprecated class names into canonical Tailwind utilities. Supports px, rem, em, %, vw/vh, and opacity modifiers.",
}

export default function NormalizerPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100">

      {/* Header */}
      <header className="border-b border-white/6">
        <div className="mx-auto flex max-w-5xl items-center gap-3.5 px-6 py-4 sm:px-8">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-[#ccff00]">
          <svg width="20" height="20" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 140H280V280H0L280 0H140.23L0 140Z" fill="black"/>
          </svg>
          </div>
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
              Tailwind Normalizer
            </h1>
            <span className="hidden text-xs text-zinc-600 sm:block">
              Arbitrary → canonical. CSS → utilities. Deprecated → correct.
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <TailwindNormalizer defaultVersion={3} />
      </main>
    </div>
  )
}