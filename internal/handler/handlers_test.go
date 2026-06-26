package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/user/bmscdc/internal/auth"
	"github.com/user/bmscdc/internal/mocks"
	"github.com/user/bmscdc/internal/types"
	"github.com/user/bmscdc/internal/webhook"
	"go.uber.org/mock/gomock"
)

func TestGetRoom(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockDB := mocks.NewMockDBService(ctrl)
	mockAuth := mocks.NewMockAuthService(ctrl)
	mockLK := mocks.NewMockLiveKitService(ctrl)
	mockWS := mocks.NewMockWSService(ctrl)
	wh := webhook.NewWebhookHandler(mockLK, mockDB)

	h := NewHandler(mockDB, mockAuth, mockLK, mockWS, wh)
	r := chi.NewRouter()

	// Setup fake auth middleware that injects user ID
	mockAuth.EXPECT().Middleware(gomock.Any()).DoAndReturn(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), auth.UserIDKey, "test-user-id")
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}).AnyTimes()

	h.RegisterRoutes(r)

	t.Run("Room Found", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v1/rooms/abc-defg-hij", nil)
		req.Header.Set("Authorization", "Bearer fake-token")

		rr := httptest.NewRecorder()

		room := &types.Room{
			ID:          "room-uuid",
			MeetingCode: "abc-defg-hij",
			Title:       "Test Room",
			Status:      "waiting",
		}
		mockDB.EXPECT().GetRoomByCode(gomock.Any(), "abc-defg-hij").Return(room, nil)

		r.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusOK {
			t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
		}

		var resp types.Room
		json.NewDecoder(rr.Body).Decode(&resp)
		if resp.MeetingCode != "abc-defg-hij" {
			t.Errorf("expected meeting code abc-defg-hij, got %v", resp.MeetingCode)
		}
	})

	t.Run("Room Not Found", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v1/rooms/not-found", nil)
		req.Header.Set("Authorization", "Bearer fake-token")

		rr := httptest.NewRecorder()

		mockDB.EXPECT().GetRoomByCode(gomock.Any(), "not-found").Return(nil, nil)

		r.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusNotFound {
			t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
		}
	})
}

func TestJoinRoom(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockDB := mocks.NewMockDBService(ctrl)
	mockAuth := mocks.NewMockAuthService(ctrl)
	mockLK := mocks.NewMockLiveKitService(ctrl)
	mockWS := mocks.NewMockWSService(ctrl)
	wh := webhook.NewWebhookHandler(mockLK, mockDB)

	h := NewHandler(mockDB, mockAuth, mockLK, mockWS, wh)
	r := chi.NewRouter()

	mockAuth.EXPECT().Middleware(gomock.Any()).DoAndReturn(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), auth.UserIDKey, "test-user-id")
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}).AnyTimes()

	h.RegisterRoutes(r)

	t.Run("Successful Join", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/v1/rooms/abc-defg-hij/join", nil)
		req.Header.Set("Authorization", "Bearer fake-token")

		rr := httptest.NewRecorder()

		room := &types.Room{
			ID:          "room-uuid",
			MeetingCode: "abc-defg-hij",
			Status:      "waiting",
		}
		mockDB.EXPECT().GetRoomByCode(gomock.Any(), "abc-defg-hij").Return(room, nil)
		mockLK.EXPECT().GenerateJoinToken("abc-defg-hij", "test-user-id", true).Return("fake-lk-jwt", nil)

		r.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusOK {
			t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
		}

		var resp types.JoinResponse
		json.NewDecoder(rr.Body).Decode(&resp)
		if resp.LiveKitToken != "fake-lk-jwt" {
			t.Errorf("expected token fake-lk-jwt, got %v", resp.LiveKitToken)
		}
	})
}

func TestKnockRoom(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockDB := mocks.NewMockDBService(ctrl)
	mockAuth := mocks.NewMockAuthService(ctrl)
	mockLK := mocks.NewMockLiveKitService(ctrl)
	mockWS := mocks.NewMockWSService(ctrl)
	wh := webhook.NewWebhookHandler(mockLK, mockDB)

	h := NewHandler(mockDB, mockAuth, mockLK, mockWS, wh)
	r := chi.NewRouter()
	mockAuth.EXPECT().Middleware(gomock.Any()).DoAndReturn(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), auth.UserIDKey, "test-user-id")
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}).AnyTimes()

	h.RegisterRoutes(r)

	t.Run("Knock Room", func(t *testing.T) {
		knockReq := types.KnockRequest{GuestName: "Alice"}
		body, _ := json.Marshal(knockReq)
		req, _ := http.NewRequest("POST", "/api/v1/rooms/abc-defg-hij/knock", bytes.NewBuffer(body))

		rr := httptest.NewRecorder()

		room := &types.Room{
			ID:          "room-uuid",
			MeetingCode: "abc-defg-hij",
			Status:      "waiting",
		}
		mockDB.EXPECT().GetRoomByCode(gomock.Any(), "abc-defg-hij").Return(room, nil)
		
		knockResp := &types.KnockResponse{
			KnockID: "knock-uuid",
			Status:  "pending",
		}
		mockDB.EXPECT().CreateKnock(gomock.Any(), "room-uuid", "Alice").Return(knockResp, nil)

		// Expect WS broadcast to the room
		mockWS.EXPECT().BroadcastToRoom("abc-defg-hij", gomock.Any())

		r.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusCreated {
			t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
		}
	})
}
