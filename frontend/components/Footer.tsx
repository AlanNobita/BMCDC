'use client'
import Image from 'next/image'
import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer} id="contact">
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logoWrap}>
              <Image src="/logo.png" alt="BMSC" width={40} height={40} className={styles.logoImg} />
              <span className={styles.logoText}>BMSC <span className={styles.accent}>Debate</span></span>
            </Link>
            <p className={styles.tagline}>Argue. Inspire. Lead.</p>
            <div className={styles.socials}>
              {[
                { id: 'fb', label: 'Facebook', letter: 'f', href: '#' },
                { id: 'ig', label: 'Instagram', letter: 'ig', href: '#' },
                { id: 'tw', label: 'Twitter/X', letter: '𝕏', href: '#' },
                { id: 'yt', label: 'YouTube', letter: 'yt', href: '#' },
              ].map(s => (
                <a key={s.id} href={s.href} className={styles.socialPill} aria-label={s.label}>{s.letter}</a>
              ))}
            </div>
          </div>

          <div className={styles.col}>
            <h4 className={styles.heading}>Quick Links</h4>
            <ul className={styles.list}>
              {[['About Us','/#about'],['Events','/#events'],['Our Team','/#team'],['Achievements','/#achievements'],['Join Us','/#join']].map(([label,href]) => (
                <li key={label}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.heading}>Formats We Debate</h4>
            <ul className={styles.list}>
              {['British Parliamentary','Asian Parliamentary','Oxford Style','Lincoln–Douglas','Model United Nations'].map(f => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.heading}>Get in Touch</h4>
            <ul className={`${styles.list} ${styles.contactList}`}>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                debate@bmsc.edu
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Room 301, Student Union Building<br />BMSC School & College Campus
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Weekly sessions: Every Tuesday, 5 PM
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>© {year} BMSC Debate Club. All rights reserved.</span>
          <span>Designed with precision &amp; passion.</span>
        </div>
      </div>
    </footer>
  )
}
