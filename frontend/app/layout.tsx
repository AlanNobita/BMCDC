import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import GlobalMotionConfig from '@/components/MotionConfig'
import ScrollToTop from '@/components/ScrollToTop'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'BMSC Debate Club — Argue. Inspire. Lead.',
  description: 'BMSC Debate Club is a premier school debate society committed to developing critical thinkers, skilled orators, and future leaders through competitive debate.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ScrollToTop />
          <GlobalMotionConfig>
            <AuthProvider>
              {children}
            </AuthProvider>
          </GlobalMotionConfig>
        </ThemeProvider>
      </body>
    </html>
  )
}
