'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToTop() {
  const pathname = usePathname()

  // Disable automatic browser scroll restoration so it always starts at the top on reload
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  // Scroll to top every time the route changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
