package webhook

import (
	"context"
	"log"
	"net/http"

	"github.com/user/bmscdc/internal/db"
	"github.com/user/bmscdc/internal/livekit"
)

type WebhookHandler struct {
	lkService livekit.LiveKitService
	dbService db.DBService
}

func NewWebhookHandler(lkService livekit.LiveKitService, dbService db.DBService) *WebhookHandler {
	return &WebhookHandler{
		lkService: lkService,
		dbService: dbService,
	}
}

func (h *WebhookHandler) HandleLiveKitWebhook(w http.ResponseWriter, r *http.Request) {
	event, err := h.lkService.VerifyWebhookSignature(r)
	if err != nil {
		log.Printf("Webhook signature validation failed: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := context.Background()

	switch event.Event {
	case "participant_left":
		if event.Participant != nil && event.Room != nil {
			err = h.dbService.UpdateParticipantLeft(ctx, event.Room.Name, event.Participant.Identity)
			if err != nil {
				log.Printf("Failed to update participant left: %v", err)
			}
		}
	case "room_finished":
		if event.Room != nil {
			err = h.dbService.EndRoom(ctx, event.Room.Name)
			if err != nil {
				log.Printf("Failed to end room: %v", err)
			}
		}
	case "egress_ended":
		if event.EgressInfo != nil {
			err = h.dbService.UpdateRecordingStatus(
				ctx,
				event.EgressInfo.EgressId,
				"completed",
				0, // duration missing from simplistic mapping for now, but usually in EgressInfo
				0, // file size missing from simplistic mapping for now
			)
			if err != nil {
				log.Printf("Failed to update egress status: %v", err)
			}
		}
	}

	w.WriteHeader(http.StatusOK)
}
