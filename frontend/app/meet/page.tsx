'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import styles from './meet.module.css'

type MediaState = { mic: boolean; camera: boolean; screen: boolean }
type Participant = { id: string; name: string; initials: string; isMuted: boolean; isVideoOff: boolean }
type ChatMsg = { id: string; sender: string; text: string; time: string }

const MOCK_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Aryan Mehta', initials: 'AM', isMuted: false, isVideoOff: false },
  { id: 'p2', name: 'Amara Osei', initials: 'AO', isMuted: true, isVideoOff: false },
]

function generateRoomCode() {
  const seg = () => Math.random().toString(36).substring(2, 5)
  return `${seg()}-${seg()}-${seg()}`
}

// ── Pre-Join Lobby ─────────────────────────────────────────
function Lobby({
  displayName, avatarUrl, onJoin
}: {
  displayName: string
  avatarUrl: string | null
  onJoin: (code: string) => void
}) {
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState<'choose' | 'join' | 'create'>('choose')
  const [cameraOn, setCameraOn] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (cameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      }).catch(() => setCameraOn(false))
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [cameraOn])

  const handleCreate = () => {
    const code = generateRoomCode()
    onJoin(code)
  }
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode.trim()) onJoin(joinCode.trim())
  }

  const initials = displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'

  return (
    <div className={styles.lobbyPage}>
      <header className={styles.lobbyHeader}>
        <Link href="/" className={styles.lobbyLogo}>
          <Image src="/logo.png" alt="BMSC" width={36} height={36} />
          <span>BMSC <strong>Meet</strong></span>
        </Link>
        <div className={styles.lobbyUser}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt="avatar" width={32} height={32} className={styles.lobbyAvatar} />
          ) : (
            <div className={styles.lobbyAvatarInitials}>{initials}</div>
          )}
          <span>{displayName}</span>
        </div>
      </header>

      <div className={styles.lobbyContent}>
        {/* Camera Preview */}
        <div className={styles.lobbyPreview}>
          <div className={styles.previewWrap}>
            {cameraOn ? (
              <video ref={videoRef} autoPlay muted playsInline className={styles.previewVideo} />
            ) : (
              <div className={styles.previewPlaceholder}>
                <div className={styles.previewInitials}>{initials}</div>
              </div>
            )}
            <div className={styles.previewControls}>
              <button
                className={`${styles.previewBtn} ${micOn ? styles.previewBtnActive : ''}`}
                onClick={() => setMicOn(p => !p)}
                title={micOn ? 'Mute' : 'Unmute'}
              >
                {micOn ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                )}
              </button>
              <button
                className={`${styles.previewBtn} ${cameraOn ? styles.previewBtnActive : ''}`}
                onClick={() => setCameraOn(p => !p)}
                title={cameraOn ? 'Stop camera' : 'Start camera'}
              >
                {cameraOn ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                )}
              </button>
            </div>
            <div className={styles.previewName}>{displayName}</div>
          </div>
        </div>

        {/* Action Panel */}
        <div className={styles.lobbyActions}>
          <h1 className={styles.lobbyTitle}>Virtual Meet Room</h1>
          <p className={styles.lobbySub}>Connect with fellow debaters in real-time</p>

          {mode === 'choose' && (
            <div className={styles.modeChoose}>
              <button className={styles.createBtn} onClick={() => setMode('create')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Meeting
              </button>
              <div className={styles.dividerOr}><span>or</span></div>
              <button className={styles.joinBtn} onClick={() => setMode('join')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Join with Code
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className={styles.modePanel}>
              <p className={styles.panelHint}>A new room will be created and you&apos;ll be the host.</p>
              <button className={styles.createBtn} onClick={handleCreate}>Start Meeting Now</button>
              <button className={styles.backBtn} onClick={() => setMode('choose')}>← Back</button>
            </div>
          )}

          {mode === 'join' && (
            <div className={styles.modePanel}>
              <form onSubmit={handleJoin} className={styles.joinForm}>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  placeholder="Enter room code (e.g. abc-def-ghi)"
                  className={styles.joinInput}
                  autoFocus
                />
                <button type="submit" className={styles.createBtn}>Join Room</button>
              </form>
              <button className={styles.backBtn} onClick={() => setMode('choose')}>← Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── In-Meeting Room ─────────────────────────────────────────
function MeetingRoom({
  roomCode, displayName, onLeave
}: {
  roomCode: string
  displayName: string
  onLeave: () => void
}) {
  const [media, setMedia] = useState<MediaState>({ mic: true, camera: false, screen: false })
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatLog, setChatLog] = useState<ChatMsg[]>([
    { id: '1', sender: 'Aryan Mehta', text: 'Hey everyone! Ready to practice?', time: '5:30 PM' },
    { id: '2', sender: 'Amara Osei', text: 'Yes! Let\'s do a BP round.', time: '5:31 PM' },
  ])
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const participants: Participant[] = [
    { id: 'me', name: displayName + ' (You)', initials: displayName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase(), isMuted: !media.mic, isVideoOff: !media.camera },
    ...MOCK_PARTICIPANTS,
  ]

  useEffect(() => {
    if (media.camera) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      }).catch(() => setMedia(p => ({ ...p, camera: false })))
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [media.camera])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatLog])

  const toggleMic = () => setMedia(p => ({ ...p, mic: !p.mic }))
  const toggleCamera = () => setMedia(p => ({ ...p, camera: !p.camera }))

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMsg.trim()) return
    const now = new Date()
    setChatLog(p => [...p, {
      id: Date.now().toString(),
      sender: displayName + ' (You)',
      text: chatMsg.trim(),
      time: now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    }])
    setChatMsg('')
  }

  return (
    <div className={styles.meetRoom}>
      {/* Top bar */}
      <div className={styles.meetTopBar}>
        <div className={styles.meetLogo}>
          <Image src="/logo.png" alt="BMSC" width={28} height={28} />
          <span>BMSC Meet</span>
        </div>
        <div className={styles.meetRoomCode}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          {roomCode}
        </div>
        <div className={styles.meetTime} suppressHydrationWarning>
          {new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Video Grid */}
      <div className={`${styles.videoArea} ${showChat || showParticipants ? styles.videoAreaShrunk : ''}`}>
        <div className={styles.videoGrid} style={{ gridTemplateColumns: `repeat(${Math.min(participants.length, 3)}, 1fr)` }}>
          {participants.map((p, i) => (
            <div key={p.id} className={`${styles.videoTile} ${i === 0 ? styles.videoTileSelf : ''}`}>
              {i === 0 && media.camera ? (
                <video ref={videoRef} autoPlay muted playsInline className={styles.videoEl} />
              ) : (
                <div className={styles.videoPlaceholder}>
                  <div className={styles.videoInitials} style={{
                    background: `hsl(${p.id.charCodeAt(1) * 40}, 60%, 40%)`
                  }}>{p.initials}</div>
                </div>
              )}
              <div className={styles.videoLabel}>
                {p.isMuted && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/></svg>}
                {p.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Panel */}
      {(showChat || showParticipants) && (
        <div className={styles.sidePanel}>
          <div className={styles.sidePanelHeader}>
            <h3>{showChat ? 'Chat' : 'Participants'}</h3>
            <button onClick={() => { setShowChat(false); setShowParticipants(false) }} className={styles.closePanelBtn}>✕</button>
          </div>

          {showParticipants && (
            <div className={styles.participantList}>
              {participants.map(p => (
                <div key={p.id} className={styles.participantItem}>
                  <div className={styles.participantAvatar} style={{ background: `hsl(${p.id.charCodeAt(1) * 40}, 60%, 40%)` }}>
                    {p.initials}
                  </div>
                  <span className={styles.participantName}>{p.name}</span>
                  <div className={styles.participantIcons}>
                    {p.isMuted && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/></svg>}
                    {p.isVideoOff && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/></svg>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showChat && (
            <>
              <div className={styles.chatMessages}>
                {chatLog.map(m => (
                  <div key={m.id} className={`${styles.chatBubble} ${m.sender.includes('(You)') ? styles.chatBubbleMe : ''}`}>
                    <div className={styles.chatSender}>{m.sender} · {m.time}</div>
                    <div className={styles.chatText}>{m.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendMessage} className={styles.chatForm}>
                <input
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  placeholder="Send a message…"
                  className={styles.chatInput}
                />
                <button type="submit" className={styles.chatSendBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Control Bar */}
      <div className={styles.controlBar}>
        <div className={styles.controlGroup}>
          <button
            className={`${styles.controlBtn} ${!media.mic ? styles.controlBtnOff : ''}`}
            onClick={toggleMic}
            title={media.mic ? 'Mute' : 'Unmute'}
          >
            {media.mic ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            )}
            <span>{media.mic ? 'Mute' : 'Unmute'}</span>
          </button>

          <button
            className={`${styles.controlBtn} ${!media.camera ? styles.controlBtnOff : ''}`}
            onClick={toggleCamera}
            title={media.camera ? 'Stop video' : 'Start video'}
          >
            {media.camera ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            )}
            <span>{media.camera ? 'Stop Video' : 'Start Video'}</span>
          </button>

          <button
            className={`${styles.controlBtn} ${showParticipants ? styles.controlBtnActive : ''}`}
            onClick={() => { setShowParticipants(p => !p); setShowChat(false) }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>People ({participants.length})</span>
          </button>

          <button
            className={`${styles.controlBtn} ${showChat ? styles.controlBtnActive : ''}`}
            onClick={() => { setShowChat(p => !p); setShowParticipants(false) }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Chat</span>
          </button>
        </div>

        <button className={styles.endCallBtn} onClick={onLeave}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
          Leave
        </button>
      </div>
    </div>
  )
}

// ── Page Root ───────────────────────────────────────────────
export default function MeetPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single().then(({ data }) => {
      setDisplayName(data?.full_name || user.email?.split('@')[0] || 'Guest')
      setAvatarUrl(data?.avatar_url || null)
    })
  }, [user])

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080f22' }}>
        <div className={styles.pageSpinner} />
      </div>
    )
  }

  if (roomCode) {
    return (
      <MeetingRoom
        roomCode={roomCode}
        displayName={displayName}
        onLeave={() => setRoomCode(null)}
      />
    )
  }

  return (
    <Lobby
      displayName={displayName}
      avatarUrl={avatarUrl}
      onJoin={setRoomCode}
    />
  )
}
