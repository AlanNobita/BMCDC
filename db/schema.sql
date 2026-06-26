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
