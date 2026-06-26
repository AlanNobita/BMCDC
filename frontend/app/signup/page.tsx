'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import PageTransition from '@/components/PageTransition'
import styles from '../login/auth.module.css'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push('/profile')
  }, [user, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className={styles.authPage}>
        <div className={styles.rightPanel} style={{ flex: 1 }}>
          <div className={styles.formWrap}>
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✓</div>
              <h2 className={styles.formTitle}>Check your inbox!</h2>
              <p className={styles.formSub}>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
              <Link href="/login" className={`${styles.submitBtn} ${styles.submitBtnLink}`}>Back to Login</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className={styles.authPage}>
      <div className={styles.leftPanel}>
        <div className={styles.leftDecor} />
        <div className={styles.leftInner}>
          <Link href="/" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to site
          </Link>
          <div className={styles.heroQuote}>
            <span className={styles.quoteIcon}>&quot;</span>
            <p>It takes one step to begin a journey of a thousand miles.</p>
            <span>— Ancient Proverb</span>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formWrap}>
          <div className={styles.formHeader}>
            <Link href="/" className={styles.logoLink}>
              <Image src="/logo.png" alt="BMSC" width={52} height={52} />
            </Link>
            <h1 className={styles.formTitle}>Create an account</h1>
            <p className={styles.formSub}>Join the BMSC Debate Club community today</p>
          </div>

          <form onSubmit={handleSignup} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="fullName" className={styles.label}>Full Name</label>
              <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your full name" className={styles.input} required autoComplete="name" />
            </div>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email address</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className={styles.input} required autoComplete="email" />
            </div>
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters" className={styles.input} required autoComplete="new-password" />
            </div>
            <div className={styles.field}>
              <label htmlFor="confirm" className={styles.label}>Confirm Password</label>
              <input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password" className={styles.input} required autoComplete="new-password" />
            </div>

            {error && (
              <div className={styles.errorBox} role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : <>Create Account <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
              </button>
            </motion.div>
          </form>

          <p className={styles.switchText}>
            Already have an account?{' '}
            <Link href="/login" className={styles.switchLink}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
    </PageTransition>
  )
}
