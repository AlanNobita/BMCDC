'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import PageTransition from '@/components/PageTransition'
import styles from './auth.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push('/')
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <PageTransition>
      <div className={styles.authPage}>

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className={styles.leftPanel}>
        {/* Geometric decorative rings */}
        <div className={styles.leftDecor} />

        <div className={styles.leftInner}>
          <Link href="/" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to site
          </Link>

          {/* Glassmorphic quote card — pushed to bottom via margin-top: auto */}
          <div className={styles.heroQuote}>
            <span className={styles.quoteIcon}>&quot;</span>
            <p>The best argument is that which seems merely an explanation.</p>
            <span>— Dale Carnegie</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrap}>

          <div className={styles.formHeader}>
            <Link href="/" className={styles.logoLink}>
              <Image src="/logo.png" alt="BMSC Debate Club" width={56} height={56} />
            </Link>
            <h1 className={styles.formTitle}>Welcome back</h1>
            <p className={styles.formSub}>Sign in to your BMSC Debate Club account</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form} noValidate>

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={styles.input}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <a href="#" className={styles.forgotLink}>Forgot password?</a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className={styles.errorBox} role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <button type="submit" className={styles.submitBtn} disabled={loading} id="btn-login-submit">
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  <>
                    Sign In
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </motion.div>

          </form>

          <p className={styles.switchText}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className={styles.switchLink}>Create one →</Link>
          </p>

        </div>
      </div>
    </div>
    </PageTransition>
  )
}
