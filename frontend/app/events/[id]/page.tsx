'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import styles from './event.module.css'

interface Event {
  id: string
  title: string
  description: string
  date: string
  time_start: string
  time_end: string
  location: string
  tag: string
  is_featured: boolean
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatTime(t?: string) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

export default function EventDetailPage() {
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params?.id as string
    if (!id) return
    const supabase = createClient()
    supabase.from('events').select('*').eq('id', id).single().then(({ data }) => {
      setEvent(data)
      setLoading(false)
    })
  }, [params])

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <Navbar />
        <div className={styles.spinner} />
      </div>
    )
  }

  if (!event) {
    return (
      <div className={styles.loadingPage}>
        <Navbar />
        <div className={styles.notFound}>
          <h1>Event not found</h1>
          <Link href="/#events" className={styles.backBtn}>← Back to Events</Link>
        </div>
      </div>
    )
  }

  const { day, month } = (() => {
    const d = new Date(event.date + 'T00:00:00')
    return { day: d.getDate().toString().padStart(2,'0'), month: d.toLocaleString('en',{month:'short'}).toUpperCase() }
  })()

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        {/* Hero Banner */}
        <div className={`${styles.heroBanner} ${event.is_featured ? styles.heroBannerFeatured : ''}`}>
          <div className="container">
            <Link href="/#events" className={styles.breadcrumb}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              All Events
            </Link>
            <div className={styles.heroMeta}>
              <div className={styles.datePill}>
                <span className={styles.day}>{day}</span>
                <span className={styles.month}>{month}</span>
              </div>
              <span className={`${styles.tag} ${styles[`tag${event.tag.replace(/\s/g,'')}`]}`}>{event.tag}</span>
            </div>
            <h1 className={styles.heroTitle}>{event.title}</h1>
            <div className={styles.heroInfo}>
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {event.location}
              </span>
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {formatTime(event.time_start)} — {formatTime(event.time_end)}
              </span>
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {formatFullDate(event.date)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container">
          <div className={styles.content}>
            <div className={styles.main}>
              <div className={styles.descSection}>
                <h2 className={styles.descTitle}>About This Event</h2>
                <div className={styles.descBody}>
                  {event.description.split('\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.sidebar}>
              <div className={styles.sideCard}>
                <h3 className={styles.sideTitle}>Event Details</h3>
                <ul className={styles.detailList}>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <div><span>Date</span><strong>{formatFullDate(event.date)}</strong></div>
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div><span>Time</span><strong>{formatTime(event.time_start)} — {formatTime(event.time_end)}</strong></div>
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div><span>Venue</span><strong>{event.location}</strong></div>
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    <div><span>Category</span><strong>{event.tag}</strong></div>
                  </li>
                </ul>
                <button className={styles.registerBtn}>
                  Register Now
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
