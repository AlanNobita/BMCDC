'use client'

/**
 * PageTransition — Per-page entrance animation.
 *
 * Wraps each page's content in a motion.div that fades + slides up
 * gently on mount. Using this pattern (rather than AnimatePresence at
 * the layout level) is the correct App Router approach and avoids
 * hydration mismatches.
 */

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

const variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
}

export default function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      transition={{
        duration: 0.38,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}
