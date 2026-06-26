'use client'

/**
 * RevealSection — Viewport-triggered entrance animation.
 *
 * Wraps section-level blocks (headings, subtitles, text columns) with a
 * whileInView fade + slide-up. Use `delay` for manual stagger when
 * placing multiple RevealSections in a row.
 *
 * viewport={{ once: true }} ensures the animation only fires once,
 * not on every scroll-back.
 */

import { motion } from 'motion/react'
import type { ReactNode, CSSProperties } from 'react'

interface RevealSectionProps {
  children: ReactNode
  delay?: number
  /** How much of the element must be visible before triggering. 0–1. */
  amount?: number
  className?: string
  style?: CSSProperties
  as?: 'div' | 'section' | 'article' | 'aside'
}

export default function RevealSection({
  children,
  delay = 0,
  amount = 0.15,
  className,
  style,
  as = 'div',
}: RevealSectionProps) {
  let MotionTag;
  switch (as) {
    case 'section': MotionTag = motion.section; break;
    case 'article': MotionTag = motion.article; break;
    case 'aside': MotionTag = motion.aside; break;
    default: MotionTag = motion.div; break;
  }

  return (
    <MotionTag
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
      style={{ willChange: 'opacity, transform', ...style }}
    >
      {children}
    </MotionTag>
  )
}
