
"use client"

import { TailwindNormalizer } from "@/components/TailwindNormalizer"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"
import { motion } from "motion/react"

export default function NormalizerPage() {
  return (
    <div className="min-h-svh flex flex-col bg-linear-to-br from-white via-blue-50/30 to-cyan-50/20 text-zinc-900 dark:from-[#0f0f0f] dark:via-[#0f0f0f] dark:to-cyan-950/10 dark:text-zinc-100">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="border-b border-zinc-200/40 bg-white/30 backdrop-blur-md dark:border-white/5 dark:bg-white/2 sticky top-0 z-40"
      >
        <div className="mx-auto flex max-w-6xl h-16 items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#00c6e7] to-[#00b5d4] text-white shadow-lg dark:from-[#ccff00] dark:to-[#b8e600] dark:text-zinc-900">
              <svg width="20" height="20" viewBox="0 0 280 280" fill="black" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 140H280V280H0L280 0H140.23L0 140Z"/>
              </svg>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="text-base font-semibold tracking-tight leading-none">
                Tailwind Normalizer
              </h1>
              <p className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:block truncate">
                Normalize Tailwind classes instantly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <motion.a
              href="https://github.com/siamparvez44/tailwind-normalizer"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200/50 bg-white text-zinc-700 dark:border-[#ccff00]/20 dark:bg-white/5 dark:text-zinc-300 hover:bg-zinc-50 hover:border-[#00c6e7]/50 dark:hover:bg-white/10 dark:hover:border-[#ccff00]/30 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="hidden sm:inline">Star</span>
            </motion.a>
            <ThemeSwitcher />
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mx-auto w-full max-w-6xl px-6 sm:px-8 py-12 sm:py-16 flex-1"
      >
        <TailwindNormalizer defaultVersion={4} />
      </motion.main>

      {/* Footer credit */}
      <div className="border-t border-zinc-200/40 bg-white/30 backdrop-blur-md dark:border-white/5 dark:bg-white/2 py-4">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 text-center text-xs text-zinc-600 dark:text-zinc-400">
          Created by{" "}
          <motion.a
            href="https://github.com/siamparvez44"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="font-medium text-[#00c6e7] dark:text-[#ccff00] hover:text-[#00b5d4] dark:hover:text-[#d6ff66] transition-colors"
          >
            @siamparvez44
          </motion.a>
        </div>
      </div>
    </div>
  )
}