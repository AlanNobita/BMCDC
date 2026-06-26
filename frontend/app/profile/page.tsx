'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import styles from './profile.module.css'

type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'x' | 'unknown'

function detectPlatform(url: string): SocialPlatform {
  if (!url) return 'unknown'
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('linkedin.com')) return 'linkedin'
  if (url.includes('x.com') || url.includes('twitter.com')) return 'x'
  return 'unknown'
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === 'facebook') return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
  if (platform === 'instagram') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
  if (platform === 'linkedin') return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
  if (platform === 'x') return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    hobbies: '',
    general_specialty: '',
    speaker_specialty: '',
    contact_email: '',
    social_url: '',
    avatar_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile(prev => ({ ...prev, ...data, contact_email: data.contact_email || user.email || '' }))
      else setProfile(prev => ({ ...prev, contact_email: user.email || '' }))
      setPageLoading(false)
    })
  }, [user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setProfile(p => ({ ...p, avatar_url: data.publicUrl + '?t=' + Date.now() }))
    }
    setUploadingAvatar(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const socialPlatform = detectPlatform(profile.social_url)

  if (pageLoading || loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner} />
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className={styles.profilePage}>
        <div className={styles.hero}>
          <div className="container">
            <div className={styles.heroInner}>
              <div className={styles.avatarWrap}>
                <div className={styles.avatarCircle}>
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Avatar" fill className={styles.avatarImg} />
                  ) : (
                    <span className={styles.avatarInitials}>
                      {(profile.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button className={styles.avatarUploadBtn} onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}>
                  {uploadingAvatar ? '…' : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className={styles.hidden} onChange={handleAvatarUpload} />
              </div>
              <div className={styles.heroText}>
                <h1 className={styles.heroName}>{profile.full_name || 'Your Name'}</h1>
                <p className={styles.heroEmail}>{user?.email}</p>
                {profile.social_url && (
                  <a href={profile.social_url} target="_blank" rel="noopener noreferrer" className={styles.heroSocial}>
                    <SocialIcon platform={socialPlatform} />
                    View Profile
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className={styles.content}>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Personal Information</h2>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Name</label>
                    <input className={styles.input} type="text" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Contact Email</label>
                    <input className={styles.input} type="email" value={profile.contact_email} onChange={e => setProfile(p => ({ ...p, contact_email: e.target.value }))} placeholder="contact@email.com" />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Bio</label>
                  <textarea className={`${styles.input} ${styles.textarea}`} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." rows={4} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Hobbies &amp; Interests</label>
                  <input className={styles.input} type="text" value={profile.hobbies} onChange={e => setProfile(p => ({ ...p, hobbies: e.target.value }))} placeholder="Reading, chess, writing..." />
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Debate Profile</h2>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>General Specialty</label>
                    <input className={styles.input} type="text" value={profile.general_specialty} onChange={e => setProfile(p => ({ ...p, general_specialty: e.target.value }))} placeholder="e.g. Policy, Ethics..." />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Speaker Specialty</label>
                    <input className={styles.input} type="text" value={profile.speaker_specialty} onChange={e => setProfile(p => ({ ...p, speaker_specialty: e.target.value }))} placeholder="e.g. Rebuttal, Whip..." />
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Social Link</h2>
                <div className={styles.field}>
                  <label className={styles.label}>Social Profile URL</label>
                  <div className={styles.socialInputWrap}>
                    <div className={`${styles.socialIcon} ${profile.social_url ? styles.socialIconActive : ''}`}>
                      <SocialIcon platform={socialPlatform} />
                    </div>
                    <input
                      className={`${styles.input} ${styles.socialInput}`}
                      type="url"
                      value={profile.social_url}
                      onChange={e => setProfile(p => ({ ...p, social_url: e.target.value }))}
                      placeholder="https://facebook.com/yourprofile"
                    />
                  </div>
                  {profile.social_url && (
                    <p className={styles.socialHint}>
                      Detected: <strong>{socialPlatform}</strong>
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? <span className={styles.spinner} /> : saved ? '✓ Saved!' : 'Save Changes'}
                </button>
                <Link href="/" className={styles.cancelLink}>← Back to site</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
