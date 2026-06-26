# BMSCDC — BMSC Debate Club Platform

A full-stack debate club platform with a Google Meet-inspired video conferencing backend. Built for **BMSC School & College Debate Club** to manage events, members, and live meetings.

## Architecture

```
┌─────────────────┐     ┌─────────────────────────────────┐
│   Next.js App   │────▶│         Go Backend              │
│   (Frontend)    │     │   REST API + WebSocket Hub       │
└─────────────────┘     └──────┬──────────┬───────────────┘
                               │          │
                    ┌──────────▼──┐  ┌────▼──────────┐
                    │  Supabase   │  │   LiveKit      │
                    │  Auth/DB/   │  │   SFU + Egress │
                    │  Storage    │  │   (WebRTC)     │
                    └─────────────┘  └────────────────┘
```

**Three services:**
- **Go server** — REST API + WebSocket signaling in a single binary
- **LiveKit** — Self-hosted SFU for video/audio routing, Egress for recording
- **Supabase** — Auth, Postgres, Storage (recordings via S3), Realtime

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Motion (Framer Motion) |
| Backend | Go 1.26, Chi Router, pgx (Postgres), Gorilla WebSocket |
| Video | LiveKit Server SDK (WebRTC SFU + Egress) |
| Auth | Supabase Auth (JWT), golang-jwt |
| Database | Supabase Postgres |
| Storage | Supabase Storage (S3-compatible) |

## Features

### Video Conferencing
- Create rooms with shareable meeting codes (e.g. `abc-defg-hij`)
- Knock/lobby system — guests request entry, host approves via WebSocket
- Host moderation — force mute, kick participants
- Room recording via LiveKit Egress → Supabase Storage
- Hand raise, chat, screen sharing (via LiveKit data channels & metadata)

### Club Website
- Hero landing page with animated sections
- Event calendar with detail pages
- Team profiles with modal bios
- Member signup and authentication
- User profile page
- Responsive design with dark theme support

## Project Structure

```
BMCDC/
├── cmd/server/main.go              # Go server entry point
├── internal/
│   ├── auth/auth.go                # Supabase JWT verification
│   ├── config/config.go            # Environment variable loading
│   ├── db/                         # Postgres queries (pgx)
│   │   ├── db.go                   # DBService interface
│   │   └── pgx_impl.go            # pgx implementation
│   ├── handler/handlers.go         # REST + WebSocket handlers
│   ├── livekit/livekit.go          # LiveKit token gen, Egress, webhooks
│   ├── room/room.go                # Room code generation
│   ├── types/types.go              # Shared request/response models
│   ├── webhook/webhook.go          # LiveKit webhook receiver
│   ├── ws/ws.go                    # WebSocket hub (knock events)
│   └── mocks/                      # Generated mocks (uber/mock)
├── db/schema.sql                   # Database migrations
├── frontend/                       # Next.js app
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── login/page.tsx          # Login
│   │   ├── signup/page.tsx         # Signup
│   │   ├── profile/page.tsx        # User profile
│   │   ├── meet/page.tsx           # Video meeting room
│   │   └── events/[id]/page.tsx    # Event detail
│   ├── components/                 # Reusable UI components
│   └── lib/supabase/               # Supabase client setup
├── index.html                      # Static landing page
├── go.mod / go.sum
└── .env                            # Environment variables (not committed)
```

## Getting Started

### Prerequisites

- Go 1.26+
- Node.js 18+
- Supabase project (auth + database + storage)
- LiveKit server (self-hosted or cloud)

### 1. Database Setup

Run the schema against your Supabase Postgres database:

```sql
-- Execute db/schema.sql in your Supabase SQL editor
```

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Server
PORT=8080

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_S3_ACCESS_KEY=your-s3-access-key
SUPABASE_S3_SECRET_KEY=your-s3-secret-key
SUPABASE_S3_ENDPOINT=https://your-project.supabase.co/storage/v1/s3

# LiveKit
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_WEBHOOK_SECRET=your-webhook-secret

# Database (direct connection)
DATABASE_URL=postgres://postgres:password@db.your-project.supabase.co:5432/postgres
```

### 3. Run the Backend

```bash
go run cmd/server/main.go
```

Server starts on `http://localhost:8080`.

### 4. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:3000`.

## API Reference

### Room Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/rooms` | Yes | Create a new room |
| `GET` | `/api/v1/rooms/:code` | Yes | Get room metadata |
| `POST` | `/api/v1/rooms/:code/join` | Yes | Join room → returns LiveKit token |
| `POST` | `/api/v1/rooms/:code/end` | Yes | End room (host only) |
| `PATCH` | `/api/v1/rooms/:code/controls` | Yes | Update room permissions (host only) |

### Lobby (Knocking)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/rooms/:code/knock` | No | Request entry to room |
| `PUT` | `/api/v1/knocks/:knockId/accept` | Yes | Accept guest (host only) |
| `PUT` | `/api/v1/knocks/:knockId/deny` | Yes | Deny guest (host only) |

### Recordings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/rooms/:code/recordings` | Yes | List room recordings |
| `POST` | `/api/v1/rooms/:code/recordings/start` | Yes | Start recording (host only) |
| `POST` | `/api/v1/rooms/:code/recordings/stop` | Yes | Stop recording (host only) |

### WebSocket

Connect after joining a room:

```
ws://localhost:8080/api/v1/ws?room_id=:uuid&token=:jwt
```

**Messages (Server → Client):**
```json
{"type": "knock:incoming",  "payload": {"knock_id": "uuid", "guest_name": "Alice"}}
{"type": "knock:accepted",  "payload": {"knock_id": "uuid", "retry_token": "..."}}
{"type": "knock:denied",    "payload": {"knock_id": "uuid"}}
{"type": "room:ended",      "payload": {}}
{"type": "user:kicked",     "payload": {"user_id": "uuid"}}
```

## Database Schema

Six tables manage room state, participants, chat, recordings, knock requests, and attendance:

- `rooms` — Meeting rooms with status, host controls, meeting codes
- `room_participants` — Live + historical participant tracking
- `chat_messages` — Persistent in-meeting chat log
- `recordings` — Recording metadata (egress ID, storage path, status)
- `room_knocks` — Lobby/knock requests (pending → accepted/denied)
- `attendance_events` — Join/leave audit log

See [`db/schema.sql`](db/schema.sql) for full definitions.

## Development

### Generate Mocks

```bash
go generate ./...
```

### Run Tests

```bash
go test ./...
```

### Lint Frontend

```bash
cd frontend
npm run lint
```

## License

MIT
