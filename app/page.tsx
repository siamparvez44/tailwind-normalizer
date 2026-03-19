import type { Metadata } from "next"
import { TailwindNormalizer } from "@/components/TailwindNormalizer"

export const metadata: Metadata = {
  title: "Tailwind Class Normalizer",
  description:
    "Convert arbitrary Tailwind values, CSS declarations, and deprecated class names into canonical Tailwind utilities.",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="border-b border-white/8">
        <div className="mx-auto flex max-w-4xl items-center gap-3.5 px-8 py-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#ccff00]">
           <svg width="20" height="20" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 140H280V280H0L280 0H140.23L0 140Z" fill="black"/>
          </svg>

          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-zinc-100">
              Tailwind Class Normalizer
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Arbitrary values, CSS declarations, deprecated aliases. All units supported.
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-8 py-10">
        <TailwindNormalizer defaultVersion={3} />
      </main>
    </div>
  )
}