'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'motion/react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageTransition from '@/components/PageTransition'
import RevealSection from '@/components/RevealSection'
import MotionCard from '@/components/MotionCard'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

// ── Types ─────────────────────────────────────────────────
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

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  img: string
  fullBio: string
  specialty: string
  social: string
}

const TEAM: TeamMember[] = [
  {
    id: 'president',
    name: 'Aryan Mehta',
    role: 'President',
    bio: '3× National Champion. Final-year LLB. Aryan has led BMSC to its most decorated era in club history.',
    fullBio: 'Aryan Mehta is a three-time National Debate Champion and final-year LLB student. He has represented BMSC at WUDC, winning the Best Speaker award at the Asian Parliamentary Circuit in 2024. As President, he has restructured the club\'s competitive program, introduced mentorship pipelines, and grown active membership by 40%. Off the podium, he mentors first-year students weekly.',
    specialty: 'British Parliamentary, Lincoln–Douglas',
    img: '/team_president.png',
    social: '#',
  },
  {
    id: 'vp',
    name: 'Amara Osei',
    role: 'Vice President',
    bio: 'WUDC quarterfinalist. International Relations student. Amara spearheads our global tournament strategy.',
    fullBio: 'Amara Osei is a WUDC quarterfinalist and second-year International Relations student. She coordinates BMSC\'s international tournament calendar, forging partnerships with debate clubs across Asia and Europe. Amara is also the lead trainer for the club\'s Model UN team, which has placed in every national simulation since 2023.',
    specialty: 'Asian Parliamentary, Model UN',
    img: '/team_vp.png',
    social: '#',
  },
  {
    id: 'secretary',
    name: 'Lin Wei',
    role: 'Secretary General',
    bio: 'Best Speaker 2024. Political Science & Philosophy. Lin manages club operations and internal coaching programs.',
    fullBio: 'Lin Wei was awarded Best Speaker at the 2024 Asian Parliamentary Circuit. A dual-degree student in Political Science and Philosophy, Lin brings rigorous analytical thinking to both the podium and club administration. As Secretary General, she oversees all internal coaching programs, member registration, and weekly session logistics, ensuring the club runs with operational excellence.',
    specialty: 'Oxford Style, Asian Parliamentary',
    img: '/team_secretary.png',
    social: '#',
  },
]

const ACHIEVEMENTS = [
  { icon: '🥇', title: 'National Champions', sub: '2022, 2023, 2024' },
  { icon: '🌍', title: 'WUDC Quarterfinalists', sub: 'World Universities Debating Championship' },
  { icon: '📜', title: 'Best Speaker Award', sub: 'Asian Parliamentary Circuit 2024' },
  { icon: '🎓', title: 'Alumni in 48 Countries', sub: 'Law · Politics · Business · Diplomacy' },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
  }
}

function formatTime(t?: string) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

// ── Modal animation variants ───────────────────────────────
const overlayVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
}
const modalVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1,    y: 0  },
  exit:    { opacity: 0, scale: 0.96, y: 10 },
}

// ── Modal Component ────────────────────────────────────────
function TeamModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <motion.div
      className={styles.modalOverlay}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
        onClick={e => e.stopPropagation()}
      >
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        <div className={styles.modalInner}>
          <div className={styles.modalLeft}>
            {/* layoutId connects the card image to the modal image */}
            <motion.div layoutId={`team-img-${member.id}`}>
              <Image src={member.img} alt={member.name} width={300} height={320} className={styles.modalImg} />
            </motion.div>
            <div className={styles.modalSocial}>
              <a href={member.social} target="_blank" rel="noopener noreferrer" className={styles.fbLink} aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                View on Facebook
              </a>
            </div>
          </div>
          <div className={styles.modalRight}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
              <span className={styles.modalRole}>{member.role}</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
              <h2 className={styles.modalName}>{member.name}</h2>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
              <div className={styles.modalSpecialty}>
                <span className={styles.modalTag}>{member.specialty}</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
              <p className={styles.modalBio}>{member.fullBio}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Reusable motion button wrapper ─────────────────────────
const MotionBtn = ({ children, href, className, id }: {
  children: React.ReactNode
  href: string
  className: string
  id?: string
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    style={{ display: 'inline-flex' }}
  >
    <Link href={href} className={className} id={id}>{children}</Link>
  </motion.div>
)

// ── Main Page ──────────────────────────────────────────────
export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const yearsOfExcellence = new Date().getFullYear() - 2022
  const [heroVisible, setHeroVisible] = useState(false)

  // Hero entrance
  useEffect(() => { setTimeout(() => setHeroVisible(true), 0) }, [])

  // Load events
  useEffect(() => {
    const supabase = createClient()
    supabase.from('events').select('*').order('date', { ascending: true }).then(({ data }) => {
      if (data) setEvents(data)
    })
  }, [])

  // Load member count
  useEffect(() => {
    fetch('/api/users/count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.count !== undefined) setMemberCount(d.count) })
      .catch(() => setMemberCount(null))
  }, [])

  return (
    <>
      <Navbar />
      <PageTransition>

      {/* ═══ HERO ════════════════════════════════════════ */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroBg}>
          <Image src="/debate_hero.png" alt="BMSC students debating" fill className={styles.heroImg} priority />
          <div className={styles.heroOverlay} />
        </div>

        <div className={`${styles.heroContent} ${heroVisible ? styles.heroVisible : ''}`}>
          <div className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            Est. 2022 · BMSC School &amp; College
          </div>

          <h1 className={styles.heroTitle}>
            Where Words<br />
            <em>Shape Worlds.</em>
          </h1>

          <p className={styles.heroSubtitle}>
            BMSC Debate Club cultivates brilliant minds, fearless voices, and<br className={styles.brDesktop} />
            the next generation of leaders through the art of argumentation.
          </p>

          <div className={styles.heroCta}>
            {!loading && (
              user ? null : (
                <MotionBtn href="/login" className={`btn ${styles.btnHero}`} id="btn-hero-join">
                  Join Now
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </MotionBtn>
              )
            )}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ display: 'inline-flex' }}
            >
              <a href="#about" className={`btn btn-ghost ${styles.btnLearn}`} id="btn-hero-learn">Learn More</a>
            </motion.div>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>
                {memberCount !== null ? `${memberCount}+` : '—'}
              </span>
              <span className={styles.statLabel}>Active Members</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>{yearsOfExcellence}</span>
              <span className={styles.statLabel}>Years of Excellence</span>
            </div>
          </div>
        </div>

        <a href="#about" className={styles.scrollCue} aria-label="Scroll down">
          <div className={styles.scrollLine} />
          <span>Scroll</span>
        </a>
      </section>

      {/* ═══ MARQUEE ══════════════════════════════════════ */}
      <div className={styles.marqueeRibbon} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {['Argumentation','Critical Thinking','Public Speaking','Leadership','British Parliamentary','Model UN','Oxford Style',
            'Argumentation','Critical Thinking','Public Speaking','Leadership','British Parliamentary','Model UN','Oxford Style'].flatMap((t, i) => [
            <span key={`t-${i}`}>{t}</span>,
            <span key={`d-${i}`} className={styles.dot}>·</span>,
          ])}
        </div>
      </div>

      {/* ═══ ABOUT ════════════════════════════════════════ */}
      <section className="section" id="about">
        <div className="container">
          <div className={styles.aboutGrid}>
            <RevealSection className={styles.aboutText}>
              <div className="section-label">Who We Are</div>
              <h2 className="section-title">Built on Rhetoric.<br />Driven by Truth.</h2>
              <p className={styles.aboutBody}>
                BMSC Debate Club is a prestigious student society dedicated to the art and science of formal debate.
                We train future advocates, policymakers, and intellectuals through weekly workshops, inter-university
                tournaments, and mentorship from seasoned professionals.
              </p>
              <p className={styles.aboutBody}>
                Our alumni have gone on to careers at the United Nations, Supreme Courts, and Fortune 500 boardrooms.
                The skills you build here echo for a lifetime.
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ display: 'inline-flex', marginTop: '16px' }}
              >
                <Link href="/login" className="btn btn-outline" id="btn-about-join">Become a Member</Link>
              </motion.div>
            </RevealSection>

            <div className={styles.pillarsGrid}>
              {[
                { id: 'think', icon: '🧠', style: 'gold', title: 'Critical Thinking', desc: 'Sharpen your reasoning through structured argumentation and Socratic dialogue.' },
                { id: 'speak', icon: '🎤', style: 'navy', title: 'Oratory Skills', desc: 'Develop commanding presence and persuasive delivery in front of any audience.' },
                { id: 'compete', icon: '🏆', style: 'gold', title: 'Competition', desc: 'Compete in national and international tournaments across multiple debate formats.' },
                { id: 'network', icon: '🌐', style: 'navy', title: 'Network', desc: 'Connect with 1,000+ alumni across law, politics, business, and beyond.' },
              ].map((p, i) => (
                <MotionCard
                  key={p.id}
                  id={`pillar-${p.id}`}
                  delay={i * 0.07}
                  className={styles.pillarCard}
                >
                  <div className={`${styles.pillarIcon} ${p.style === 'gold' ? styles.iconCyan : styles.iconNavy}`}>{p.icon}</div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </MotionCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EVENTS ═══════════════════════════════════════ */}
      <section className="section section-alt" id="events">
        <div className="container">
          <RevealSection className="section-header">
            <div className="section-label">Calendar</div>
            <h2 className="section-title">Upcoming Events</h2>
            <p className="section-subtitle">Don&apos;t miss your chance to compete, learn, and connect.</p>
          </RevealSection>

          <div className={styles.eventsGrid}>
            {events.map((evt, i) => {
              const { day, month } = formatDate(evt.date)
              const featured = evt.is_featured
              return (
                <MotionCard
                  key={evt.id}
                  delay={i * 0.08}
                  className={`${styles.eventCard} ${featured ? styles.eventFeatured : ''}`}
                  onClick={() => router.push(`/events/${evt.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && router.push(`/events/${evt.id}`)}
                >
                  <div className={styles.eventTop}>
                    <div className={`${styles.dateBadge} ${!featured ? styles.dateBadgeLight : ''}`}>
                      <span className={styles.day}>{day}</span>
                      <span className={styles.month}>{month}</span>
                    </div>
                    <span className={`${styles.eventTag} ${styles[`tag${evt.tag.replace(/\s/g,'')}`]}`}>{evt.tag}</span>
                  </div>
                  <div className={styles.eventBody}>
                    <h3 className={styles.eventTitle}>{evt.title}</h3>
                    <p className={styles.eventDesc}>{evt.description.slice(0, 120)}…</p>
                    <div className={styles.eventMeta}>
                      <span className={styles.metaItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        {evt.location}
                      </span>
                      <span className={styles.metaItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {formatTime(evt.time_start)} — {formatTime(evt.time_end)}
                      </span>
                    </div>
                    <span className={`btn ${featured ? 'btn-cyan' : 'btn-outline'} btn-sm ${styles.eventBtn}`}>View Details →</span>
                  </div>
                </MotionCard>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ ACHIEVEMENTS ══════════════════════════════════ */}
      <section className="section" id="achievements">
        <div className="container">
          <RevealSection className="section-header">
            <div className="section-label">Legacy</div>
            <h2 className="section-title">A Record of Excellence</h2>
          </RevealSection>
          <div className={styles.achGrid}>
            {ACHIEVEMENTS.map((a, i) => (
              <MotionCard key={i} delay={i * 0.08} className={styles.achCard}>
                <div className={styles.achIcon}>{a.icon}</div>
                <div className={styles.achText}>
                  <strong>{a.title}</strong>
                  <span>{a.sub}</span>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TEAM ══════════════════════════════════════════ */}
      <section className="section section-alt" id="team">
        <div className="container">
          <RevealSection className="section-header">
            <div className="section-label">Leadership</div>
            <h2 className="section-title">Meet the Team</h2>
            <p className="section-subtitle">The dedicated minds guiding BMSC Debate Club to new heights.</p>
          </RevealSection>

          <div className={styles.teamGrid}>
            {TEAM.map((member, i) => (
              <MotionCard
                key={member.id}
                delay={i * 0.1}
                id={`team-card-${member.id}`}
                className={styles.teamCard}
                onClick={() => setSelectedMember(member)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelectedMember(member)}
              >
                <div className={styles.teamImgWrap}>
                  {/* layoutId connects this image to the modal image for a shared element transition */}
                  <motion.div layoutId={`team-img-${member.id}`} style={{ height: '100%' }}>
                    <Image src={member.img} alt={member.name} fill className={styles.teamImg} />
                  </motion.div>
                  <div className={styles.teamSocials}>
                    <a
                      href={member.social}
                      className={styles.socialLink}
                      aria-label="Facebook"
                      onClick={e => e.stopPropagation()}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </a>
                    <a href={`mailto:${member.name.toLowerCase().replace(' ', '.')}@bmsc.edu`} className={styles.socialLink} aria-label="Email" onClick={e => e.stopPropagation()}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </a>
                  </div>
                </div>
                <div className={styles.teamBody}>
                  <h3 className={styles.teamName}>{member.name}</h3>
                  <span className={styles.teamRole}>{member.role}</span>
                  <p className={styles.teamBio}>{member.bio}</p>
                  <span className={styles.viewProfile}>View Profile →</span>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ JOIN CTA ══════════════════════════════════════ */}
      <section className={styles.joinCta} id="join">
        <div className="container">
          <RevealSection className={styles.joinInner}>
            <div className={styles.joinDeco1} /><div className={styles.joinDeco2} />
            <div className="section-label light">Ready to Begin?</div>
            <h2 className={styles.joinTitle}>Your Voice Deserves<br />to be Heard.</h2>
            <p className={styles.joinSub}>Applications are open for the 2025–26 academic year.<br className={styles.brDesktop} />No prior experience required — just curiosity and courage.</p>
            <div className={styles.joinActions}>
              <MotionBtn href="/signup" className="btn btn-cyan btn-lg" id="btn-join-apply">Apply Now</MotionBtn>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ display: 'inline-flex' }}
              >
                <a href="#contact" className="btn btn-ghost-white btn-lg" id="btn-join-contact">Contact Us</a>
              </motion.div>
            </div>
          </RevealSection>
        </div>
      </section>

      <Footer />
      </PageTransition>

      {/* ── Team Modal with AnimatePresence ── */}
      <AnimatePresence>
        {selectedMember && (
          <TeamModal member={selectedMember} onClose={() => setSelectedMember(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
