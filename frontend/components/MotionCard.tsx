'use client'

/**
 * MotionCard — Hardware-accelerated lift + stagger entrance.
 *
 * Two animations in one:
 *  1. ENTRANCE: whileInView fade + slide-up, with optional delay for
 *     stagger effects across a grid (pass delay={index * 0.07}).
 *  2. HOVER LIFT: Spring-physics "lift" on hover (y: -5px + shadow
 *     is handled by the existing CSS :hover rule). The spring gives
 *     a physical, weighted feel — not a linear ease.
 *
 * Crucially, only `transform` and `opacity` are animated here,
 * so there is zero layout thrashing or reflow.
 *
 * Usage:
 *   <MotionCard delay={index * 0.07} className={styles.eventCard} onClick={...}>
 *     ...card content...
 *   </MotionCard>
 */

import { motion } from 'motion/react'
import type { ReactNode, CSSProperties, MouseEventHandler, KeyboardEventHandler } from 'react'

interface MotionCardProps {
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
  onClick?: MouseEventHandler<HTMLDivElement>
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>
  role?: string
  tabIndex?: number
  id?: string
  /** layoutId for shared element transitions (e.g. card → modal) */
  layoutId?: string
}

// Spring config: high stiffness + moderate damping = "weighted" physical feel
const LIFT_SPRING = { type: 'spring', stiffness: 280, damping: 22, mass: 0.8 } as const

export default function MotionCard({
  children,
  delay = 0,
  className,
  style,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  id,
  layoutId,
}: MotionCardProps) {
  return (
    <motion.div
      layoutId={layoutId}
      id={id}
      role={role}
      tabIndex={tabIndex}
      className={className}
      onClick={onClick}
      onKeyDown={onKeyDown}
      /* ── Entrance animation ── */
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      /* ── Hover lift ── */
      whileHover={{ y: -5, transition: LIFT_SPRING }}
      /* ── Tap feedback ── */
      whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
      style={{
        willChange: 'transform',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}
