
import { TailwindNormalizer } from "@/components/TailwindNormalizer"
import type { Metadata } from "next"


export const metadata: Metadata = {
  title: "Tailwind Class Normalizer",
  description:
    "Convert arbitrary Tailwind values, CSS declarations, and deprecated class names into canonical Tailwind utilities. Supports px, rem, em, %, vw/vh, and opacity modifiers.",
}

export default function NormalizerPage() {
  return (
    <div className="min-h-svh flex flex-col justify-between bg-[#0f0f0f] text-zinc-100">

      {/* Header */}
      <header className="border-b border-white/6 bg-white/1.5">
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
        <TailwindNormalizer defaultVersion={4} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/6 bg-white/1.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-6 sm:px-8">
          <p className="text-xs text-zinc-600">
            Created by{" "}
            <a
              href="https://github.com/siamparvez44"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ccff00] transition-colors hover:text-[#d9ff33]"
            >
              @siamparvez44
            </a>
          </p>
          <a
            href="https://github.com/siamparvez44/tailwind-normalizer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-150 hover:border-[#ccff00]/25 hover:bg-[#ccff00]/8 hover:text-[#ccff00]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}