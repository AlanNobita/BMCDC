# Google Meet Backend Clone — Design Spec

**Date:** 2026-06-23
**Stack:** Go + LiveKit (self-hosted) + Supabase
**Scope:** Full-featured Google Meet backend for web

---

## 1. High-Level Architecture

```
[Browser/Client]
     ↕ WebSocket (app events) + HTTPS (REST)
[Go Server] ────→ [Supabase: Auth, Postgres, Storage, Realtime]
     ↕ gRPC/API
[LiveKit Server] (self-hosted SFU + Egress)
```

**Three services:**
- **Go server** — REST API + WebSocket signaling for app events in one binary
- **LiveKit** — SFU for video/audio routing, Egress for recording, participant metadata for hand-raise/controls
- **Supabase** — Auth (user management), Postgres (persistent data), Storage (recordings via S3 API), Realtime (chat/presence)

---

## 2. Data Model (Supabase Postgres)

```sql
-- Meeting rooms
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_code text UNIQUE NOT NULL,        -- e.g. "abc-defg-hij"
  title text NOT NULL DEFAULT '',
  host_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'waiting'     -- waiting | active | ended
    CHECK (status IN ('waiting', 'active', 'ended')),
  host_controls_chat boolean DEFAULT true,
  host_controls_screen_share boolean DEFAULT true,
  requires_host_admission boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Who's in the room (live + historical)
CREATE TABLE room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  is_muted boolean DEFAULT false,
  is_video_on boolean DEFAULT true,
  is_screen_sharing boolean DEFAULT false
);

-- In-meeting chat (persistent log)
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Recordings
CREATE TABLE recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  egress_id text,
  storage_path text,                       -- recordings/{code}/{ts}_{id}.mp4
  duration_seconds int,
  file_size_bytes bigint,
  status text NOT NULL DEFAULT 'recording'  -- recording | completed | failed
    CHECK (status IN ('recording', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Knock/waiting-room requests
CREATE TABLE room_knocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  guest_name text,
  status text NOT NULL DEFAULT 'pending'    -- pending | accepted | denied
    CHECK (status IN ('pending', 'accepted', 'denied')),
  created_at timestamptz DEFAULT now()
);

-- Attendance log
CREATE TABLE attendance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  event text NOT NULL                       -- joined | left
    CHECK (event IN ('joined', 'left')),
  timestamp timestamptz DEFAULT now()
);
```

---

## 3. Go Server Architecture

### Package Layout

```
cmd/server/main.go         — entry point
internal/
├── auth/                  — Supabase JWT verification middleware
├── config/                — Env var loading (cleanenv/viper)
├── db/                    — Postgres queries (pgx)
├── handler/               — REST handlers (rooms, auth, knocks, recordings)
├── livekit/               — LiveKit token generation, Egress admin client
├── room/                  — Room business logic (code generation, state)
├── types/                 — Shared request/response models
├── webhook/               — LiveKit webhook receiver (signature verification)
└── ws/                    — App-level WebSocket hub (knock events only)
```

### Responsibilities

| Layer | Role |
|-------|------|
| **REST Handlers** | Authenticate, query DB via `internal/db/`, call `internal/livekit/` for tokens, return JSON |
| **WebSocket Hub** | Routes `knock:accept` / `knock:deny` from host to lobby; broadcasts `room:ended`, `user:kicked` |
| **Webhook Receiver** | Validates LiveKit signature, handles `participant_left`, `room_finished`, `egress_ended` |

### What LiveKit Owns (NOT in Go)

- WebRTC signaling (SDP/ICE) — LiveKit SFU
- Hand raising — via LiveKit participant metadata
- Host controls (lock chat, screen share) — via LiveKit room metadata
- Chat — via LiveKit Data Channels (ephemeral; persisted via webhook if needed)

---

## 4. REST API Surface

### Room Management

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/rooms` | Create room (returns UUID + meeting_code) |
| GET | `/api/v1/rooms/:code` | Fetch room metadata |
| POST | `/api/v1/rooms/:code/join` | Request access. Returns LiveKit JWT + URL + room_id + role |
| POST | `/api/v1/rooms/:code/end` | Host only. Close room, kick all users |
| PATCH | `/api/v1/rooms/:code/controls` | Host only. Toggle room permissions |

### Knocking Queue (Lobby)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/rooms/:code/knock` | Guest requests entry (HTTP, no auth) |
| PUT | `/api/v1/knocks/:knockId/accept` | Host only. Approves guest |
| PUT | `/api/v1/knocks/:knockId/deny` | Host only. Rejects guest |

### Host Moderation

| Method | Route | Description |
|--------|-------|-------------|
| PUT | `/api/v1/rooms/:code/participants/:userId/mute` | Host only. Force mute via LiveKit admin API |
| DELETE | `/api/v1/rooms/:code/participants/:userId` | Host only. Disconnect/kick user |

### Recordings

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/rooms/:code/recordings` | List recordings for this room |
| POST | `/api/v1/rooms/:code/recordings/start` | Host only. Start LiveKit Egress (Room Composite) |
| POST | `/api/v1/rooms/:code/recordings/stop` | Host only. Stop active Egress |

### Webhook

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/webhooks/livekit` | LiveKit event pipeline (unauthenticated, signature-verified) |

### Standard Join Response

```json
{
  "livekit_token": "eyJhbGciOi...",
  "livekit_url": "wss://livekit.yourdomain.com",
  "room_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "role": "host"
}
```

---

## 5. WebSocket Protocol

### Connection

```
WS /api/v1/ws?room_id=:uuid&token=:jwt
```

Client connects after a successful `/join` with the room UUID and the Supabase JWT. Server verifies the Supabase JWT, then checks the participant is in the room.

### Client → Server (Host Only)

```json
{"type": "knock:accept", "payload": {"knock_id": "uuid"}}
{"type": "knock:deny",   "payload": {"knock_id": "uuid"}}
```

### Server → Client

```json
{"type": "knock:incoming",  "payload": {"knock_id": "uuid", "guest_name": "Alice"}}
{"type": "knock:accepted",  "payload": {"knock_id": "uuid", "retry_token": "..."}}
{"type": "knock:denied",    "payload": {"knock_id": "uuid"}}
{"type": "room:ended",      "payload": {}}
{"type": "user:kicked",     "payload": {"user_id": "uuid"}}
```

### Knock Flow (Lobby)

```
Guest                          Go Server                         Host
  │                               │                                │
  ├── POST /knock ───────────────►│                                │
  │   (no auth required)          │                                │
  │                               ├── WS: knock:incoming ─────────►│
  │                               │                                │
  │                               │◄── WS: knock:accept ──────────┤
  │                               │                                │
  │◄── Supabase Realtime: ───────┤                                │
  │    knock status → accepted    │                                │
  │                               │                                │
  ├── POST /join ────────────────►│                                │
  │◄── livekit_token ────────────┤                                │
```

### Hand Raising & Host Controls

Handled entirely via LiveKit metadata (NOT in Go WebSocket):
- **Hand raise** → `participant.setMetadata({"hand_raised": true})`
- **Lock chat** → `room.setMetadata({"chat_locked": true})`
- LiveKit broadcasts metadata changes to all peers via WebRTC

---

## 6. Recording Flow (Room Composite + S3 Direct Upload)

```
[Host clicks Record]
    ↓
POST /api/v1/rooms/:code/recordings/start
    ↓
Go calls LiveKit StartRoomCompositeEgress gRPC with S3 config:
  - Endpoint: https://{project}.supabase.co/storage/v1/s3
  - Bucket: recordings
  - Key: {room_code}/{timestamp}_{egress_id}.mp4
    ↓
LiveKit spins up headless Chrome, composites room → MP4
    ↓
Uploads directly to Supabase Storage via S3 API
    ↓
POST /api/v1/webhooks/livekit (type: egress_ended)
    ↓
Go verifies signature, extracts duration + file_size
    ↓
UPDATE recordings SET status='completed', duration=$1, file_size=$2 WHERE egress_id=$3;
```

**Storage layout:** `recordings/{room_code}/{timestamp}_{egress_id}.mp4`

**Key optimization:** Go server never downloads or uploads video files — LiveKit writes directly to Supabase Storage via S3.

---

## 7. LiveKit Webhook Events Handled

| Event | Go Server Action |
|-------|-----------------|
| `participant_left` | Update `room_participants.left_at`, insert `attendance_events` |
| `room_finished` | Set `rooms.status = ended`, `rooms.ended_at = now()` |
| `egress_ended` | Update `recordings.status = completed`, store duration + size |
| `track_muted` / `track_unmuted` | Optionally persist mute state to `room_participants` |

**Security:** All webhooks validated against `LIVEKIT_API_SECRET` signature.

---

## 8. Configuration (Env Vars)

```
# Server
PORT=8080

# Supabase
SUPABASE_URL=https://{project}.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  (service_role key for admin DB access)
SUPABASE_S3_ACCESS_KEY=...
SUPABASE_S3_SECRET_KEY=...
SUPABASE_S3_ENDPOINT=https://{project}.supabase.co/storage/v1/s3

# LiveKit
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_WEBHOOK_SECRET=...

# DB (direct Postgres connection for pgx)
DATABASE_URL=postgres://...
```

---

## 9. Key Design Decisions

1. **`:code` over `:id`** on public routes — matches Google Meet UX (abc-defg-hij)
2. **LiveKit Data Channels for chat** — sub-10ms latency; persisted via webhook if needed
3. **LiveKit metadata for hand-raise & controls** — offloads broadcast from Go server
4. **Room Composite recording** — single ready-to-play MP4, exactly what participants saw
5. **S3 direct upload** — Go server never handles video file bytes
6. **Knock via HTTP first** — avoids unauthenticated WebSocket connection catch-22
7. **Single Go binary** — REST + WS in one deployable unit; simple ops
