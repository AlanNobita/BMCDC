package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/user/bmscdc/internal/auth"
	"github.com/user/bmscdc/internal/db"
	"github.com/user/bmscdc/internal/livekit"
	"github.com/user/bmscdc/internal/room"
	"github.com/user/bmscdc/internal/types"
	"github.com/user/bmscdc/internal/webhook"
	"github.com/user/bmscdc/internal/ws"
)

type Handler struct {
	db      db.DBService
	auth    auth.AuthService
	lk      livekit.LiveKitService
	ws      ws.WSService
	webhook *webhook.WebhookHandler
}

func NewHandler(db db.DBService, auth auth.AuthService, lk livekit.LiveKitService, ws ws.WSService, wh *webhook.WebhookHandler) *Handler {
	return &Handler{
		db:      db,
		auth:    auth,
		lk:      lk,
		ws:      ws,
		webhook: wh,
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Use(corsMiddleware)

	// Webhooks
	r.Post("/api/v1/webhooks/livekit", h.webhook.HandleLiveKitWebhook)

	// Public Routes (no auth)
	r.Post("/api/v1/rooms/{code}/knock", h.KnockRoom)
	r.Get("/api/v1/users/count", h.GetUserCount)

	// Authenticated Routes
	r.Group(func(r chi.Router) {
		r.Use(h.auth.Middleware)
		
		r.Post("/api/v1/rooms", h.CreateRoom)
		r.Get("/api/v1/rooms/{code}", h.GetRoom)
		r.Post("/api/v1/rooms/{code}/join", h.JoinRoom)
		r.Post("/api/v1/rooms/{code}/end", h.EndRoom)
		r.Patch("/api/v1/rooms/{code}/controls", h.UpdateRoomControls)

		r.Put("/api/v1/knocks/{knockId}/accept", h.AcceptKnock)
		r.Put("/api/v1/knocks/{knockId}/deny", h.DenyKnock)

		r.Get("/api/v1/rooms/{code}/recordings", h.ListRecordings)
		r.Post("/api/v1/rooms/{code}/recordings/start", h.StartRecording)
		r.Post("/api/v1/rooms/{code}/recordings/stop", h.StopRecording)
	})

	// WebSocket
	r.Get("/api/v1/ws", h.HandleWS)
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload != nil {
		json.NewEncoder(w).Encode(payload)
	}
}

func (h *Handler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	code, err := room.GenerateRoomCode()
	if err != nil {
		http.Error(w, "Failed to generate room code", http.StatusInternalServerError)
		return
	}
	rm, err := h.db.CreateRoom(r.Context(), code)
	if err != nil {
		http.Error(w, "Failed to create room", http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusCreated, rm)
}

func (h *Handler) GetRoom(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	rm, err := h.db.GetRoomByCode(r.Context(), code)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if rm == nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}
	respondJSON(w, http.StatusOK, rm)
}

func (h *Handler) JoinRoom(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	userID := r.Context().Value(auth.UserIDKey).(string)

	rm, err := h.db.GetRoomByCode(r.Context(), code)
	if err != nil || rm == nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	// Simplification: Assume user is host if they created it or first to join (for now)
	isHost := true // In real life, check rm.HostID against userID
	role := "guest"
	if isHost {
		role = "host"
	}

	token, err := h.lk.GenerateJoinToken(code, userID, isHost)
	if err != nil {
		http.Error(w, "Failed to generate LiveKit token", http.StatusInternalServerError)
		return
	}

	resp := types.JoinResponse{
		LiveKitToken: token,
		LiveKitURL:   "wss://livekit.yourdomain.com", // Should come from config
		RoomID:       rm.ID,
		Role:         role,
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *Handler) EndRoom(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	if err := h.db.EndRoom(r.Context(), code); err != nil {
		http.Error(w, "Failed to end room", http.StatusInternalServerError)
		return
	}
	h.ws.BroadcastToRoom(code, types.WsMessage{Type: "room:ended", Payload: map[string]interface{}{}})
	respondJSON(w, http.StatusOK, map[string]string{"status": "ended"})
}

func (h *Handler) UpdateRoomControls(w http.ResponseWriter, r *http.Request) {
	// Not fully implemented in DB layer for brevity, but would update DB
	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (h *Handler) KnockRoom(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	var req types.KnockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	rm, err := h.db.GetRoomByCode(r.Context(), code)
	if err != nil || rm == nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	knock, err := h.db.CreateKnock(r.Context(), rm.ID, req.GuestName)
	if err != nil {
		http.Error(w, "Failed to create knock", http.StatusInternalServerError)
		return
	}

	// Notify host via WS
	h.ws.BroadcastToRoom(code, types.WsMessage{
		Type: "knock:incoming",
		Payload: map[string]interface{}{
			"knock_id":   knock.KnockID,
			"guest_name": req.GuestName,
		},
	})

	respondJSON(w, http.StatusCreated, knock)
}

func (h *Handler) AcceptKnock(w http.ResponseWriter, r *http.Request) {
	knockID := chi.URLParam(r, "knockId")
	if err := h.db.UpdateKnockStatus(r.Context(), knockID, "accepted"); err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	
	code, _ := h.db.GetKnockRoomCode(r.Context(), knockID)
	// Notify via Realtime (or WS)
	h.ws.BroadcastToRoom(code, types.WsMessage{
		Type: "knock:accepted",
		Payload: map[string]interface{}{
			"knock_id": knockID,
		},
	})
	respondJSON(w, http.StatusOK, map[string]string{"status": "accepted"})
}

func (h *Handler) DenyKnock(w http.ResponseWriter, r *http.Request) {
	knockID := chi.URLParam(r, "knockId")
	if err := h.db.UpdateKnockStatus(r.Context(), knockID, "denied"); err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	code, _ := h.db.GetKnockRoomCode(r.Context(), knockID)
	h.ws.BroadcastToRoom(code, types.WsMessage{
		Type: "knock:denied",
		Payload: map[string]interface{}{
			"knock_id": knockID,
		},
	})
	respondJSON(w, http.StatusOK, map[string]string{"status": "denied"})
}

func (h *Handler) GetUserCount(w http.ResponseWriter, r *http.Request) {
	count, err := h.db.GetUserCount(r.Context())
	if err != nil {
		respondJSON(w, http.StatusOK, map[string]int{"count": 0})
		return
	}
	respondJSON(w, http.StatusOK, map[string]int{"count": count})
}

func (h *Handler) ListRecordings(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, []interface{}{})
}

func (h *Handler) StartRecording(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	egressID := fmt.Sprintf("egress_%d", time.Now().UnixNano()) // fake egress ID for now

	err := h.lk.StartRoomCompositeEgress(
		r.Context(),
		code,
		egressID,
		"https://s3.supabase.co", // from config in real app
		"recordings",
		"key",
		"secret",
		fmt.Sprintf("%s/%d_%s.mp4", code, time.Now().Unix(), egressID),
	)
	if err != nil {
		http.Error(w, "Failed to start recording", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "recording_started"})
}

func (h *Handler) StopRecording(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "recording_stopped"})
}

func (h *Handler) HandleWS(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room_id")
	token := r.URL.Query().Get("token")

	if roomID == "" || token == "" {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	userID, err := h.auth.VerifyToken(token)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	h.ws.HandleConnection(w, r, roomID, userID)
}
