'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const isSolid = scrolled || pathname !== '/'

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (user) {
      const supabase = createClient()
      supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setAvatarUrl(data.avatar_url)
            setDisplayName(data.full_name || user.email?.split('@')[0] || 'User')
          } else {
            setDisplayName(user.email?.split('@')[0] || 'User')
          }
        })
    }
  }, [user])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await signOut()
    router.push('/')
  }

  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'U'

  return (
    <nav className={`${styles.navbar} ${isSolid ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.png" alt="BMSC Debate Club" width={44} height={44} className={styles.logoImg} loading="eager" priority />
          <span className={styles.logoText}>BMSC <span className={styles.logoAccent}>Debate</span></span>
        </Link>

        <ul className={`${styles.links} ${mobileOpen ? styles.open : ''}`}>
          {['About', 'Events', 'Team', 'Achievements', 'Contact'].map(item => (
            <li key={item}>
              <Link href={`/#${item.toLowerCase()}`} className={styles.link} onClick={() => setMobileOpen(false)}>
                {item}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          {!loading && (
            <>
              {user ? (
                <div className={styles.userArea} ref={dropdownRef}>
                  <button
                    className={styles.avatarBtn}
                    onClick={() => setDropdownOpen(p => !p)}
                    aria-label="Account menu"
                  >
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" width={38} height={38} className={styles.avatarImg} />
                    ) : (
                      <span className={styles.avatarInitials}>{initials}</span>
                    )}
                  </button>

                  {dropdownOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>
                        <div className={styles.dropdownAvatar}>
                          {avatarUrl ? (
                            <Image src={avatarUrl} alt="Avatar" width={48} height={48} className={styles.avatarImg} />
                          ) : (
                            <span className={styles.dropdownInitials}>{initials}</span>
                          )}
                        </div>
                        <div>
                          <p className={styles.dropdownName}>{displayName}</p>
                          <p className={styles.dropdownEmail}>{user.email}</p>
                        </div>
                      </div>
                      <div className={styles.dropdownDivider} />
                      <Link href="/profile" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        View Profile
                      </Link>
                      <Link href="/meet" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                        Virtual Meet
                      </Link>
                      {mounted && (
                        <div className={styles.themeToggleWrapper}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--grey-800)" strokeWidth="2" style={{ opacity: 0.6 }}>
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            </svg>
                            <span className={styles.themeToggleLabel}>Dark Mode</span>
                          </div>
                          <button 
                            className={`${styles.toggleSwitch} ${theme === 'dark' ? styles.toggleActive : ''}`} 
                            onClick={(e) => {
                              e.stopPropagation();
                              setTheme(theme === 'dark' ? 'light' : 'dark');
                            }}
                            aria-label="Toggle Dark Mode"
                          >
                            <span className={styles.toggleKnob} />
                          </button>
                        </div>
                      )}
                      <div className={styles.dropdownDivider} />
                      <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={handleSignOut}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className={`${styles.joinBtn} btn btn-nav`}>Join Now</Link>
              )}
            </>
          )}
        </div>

        <button
          className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMobileOpen(p => !p)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
