package types

import "time"

// Room represents a meeting room in the database.
type Room struct {
	ID                     string     `json:"id"`
	MeetingCode            string     `json:"meeting_code"`
	Title                  string     `json:"title"`
	HostID                 *string    `json:"host_id,omitempty"`
	Status                 string     `json:"status"`
	HostControlsChat       bool       `json:"host_controls_chat"`
	HostControlsScreenShare bool      `json:"host_controls_screen_share"`
	RequiresHostAdmission  bool       `json:"requires_host_admission"`
	CreatedAt              time.Time  `json:"created_at"`
	EndedAt                *time.Time `json:"ended_at,omitempty"`
}

// JoinRequest is the request body for joining a room.
type JoinRequest struct {
	// Usually would contain display name, etc.
}

// JoinResponse is the response given when a user successfully joins.
type JoinResponse struct {
	LiveKitToken string `json:"livekit_token"`
	LiveKitURL   string `json:"livekit_url"`
	RoomID       string `json:"room_id"`
	Role         string `json:"role"`
}

// KnockRequest represents a guest requesting entry to the lobby.
type KnockRequest struct {
	GuestName string `json:"guest_name"`
}

// KnockResponse represents the created knock record.
type KnockResponse struct {
	KnockID string `json:"knock_id"`
	Status  string `json:"status"`
}

// WsMessage represents a WebSocket message.
type WsMessage struct {
	Type    string                 `json:"type"`
	Payload map[string]interface{} `json:"payload"`
}
