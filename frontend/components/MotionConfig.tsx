'use client'

/**
 * MotionConfig — Global animation configuration.
 *
 * - Sets `reducedMotion: "user"` so the entire site automatically
 *   respects the OS-level "reduce motion" accessibility preference.
 * - Sets sensible default transitions so individual components don't
 *   need to repeat themselves.
 *
 * Import this in layout.tsx to apply it globally.
 */

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

export default function GlobalMotionConfig({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        duration: 0.32,
        ease: [0.25, 0.1, 0.25, 1], // Apple's standard cubic-bezier
      }}
    >
      {children}
    </MotionConfig>
  )
}
