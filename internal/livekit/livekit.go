package livekit

import (
	"context"
	"net/http"
	"time"

	"github.com/livekit/protocol/auth"
	"github.com/livekit/protocol/livekit"
	"github.com/livekit/protocol/webhook"
	lksdk "github.com/livekit/server-sdk-go/v2"
)

// LiveKitService defines the interface for interacting with LiveKit.
//
//go:generate go run go.uber.org/mock/mockgen -destination=../mocks/livekit_mock.go -package=mocks github.com/user/bmscdc/internal/livekit LiveKitService
type LiveKitService interface {
	GenerateJoinToken(roomCode string, identity string, isHost bool) (string, error)
	StartRoomCompositeEgress(ctx context.Context, roomCode string, egressID string, s3URL, s3Bucket, s3AccessKey, s3SecretKey, s3Key string) error
	StopEgress(ctx context.Context, egressID string) error
	VerifyWebhookSignature(r *http.Request) (*livekit.WebhookEvent, error)
}

type LiveKitClient struct {
	apiKey        string
	apiSecret     string
	serverURL     string
	webhookSecret string
	egressClient  *lksdk.EgressClient
}

func NewLiveKitClient(apiKey, apiSecret, serverURL, webhookSecret string) *LiveKitClient {
	return &LiveKitClient{
		apiKey:        apiKey,
		apiSecret:     apiSecret,
		serverURL:     serverURL,
		webhookSecret: webhookSecret,
		egressClient:  lksdk.NewEgressClient(serverURL, apiKey, apiSecret),
	}
}

func (c *LiveKitClient) GenerateJoinToken(roomCode string, identity string, isHost bool) (string, error) {
	at := auth.NewAccessToken(c.apiKey, c.apiSecret)
	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     roomCode,
	}
	if isHost {
		grant.RoomAdmin = true
		grant.RoomRecord = true
	}
	at.AddGrant(grant).
		SetIdentity(identity).
		SetValidFor(time.Hour * 2)

	return at.ToJWT()
}

func (c *LiveKitClient) StartRoomCompositeEgress(ctx context.Context, roomCode string, egressID string, s3URL, s3Bucket, s3AccessKey, s3SecretKey, s3Key string) error {
	req := &livekit.RoomCompositeEgressRequest{
		RoomName: roomCode,
		FileOutputs: []*livekit.EncodedFileOutput{
			{
				FileType: livekit.EncodedFileType_MP4,
				Filepath: s3Key,
				Output: &livekit.EncodedFileOutput_S3{
					S3: &livekit.S3Upload{
						AccessKey: s3AccessKey,
						Secret:    s3SecretKey,
						Endpoint:  s3URL,
						Bucket:    s3Bucket,
					},
				},
			},
		},
	}
	_, err := c.egressClient.StartRoomCompositeEgress(ctx, req)
	return err
}

func (c *LiveKitClient) StopEgress(ctx context.Context, egressID string) error {
	_, err := c.egressClient.StopEgress(ctx, &livekit.StopEgressRequest{EgressId: egressID})
	return err
}

func (c *LiveKitClient) VerifyWebhookSignature(r *http.Request) (*livekit.WebhookEvent, error) {
	authProvider := auth.NewSimpleKeyProvider(
		c.apiKey, c.webhookSecret,
	)
	return webhook.ReceiveWebhookEvent(r, authProvider)
}
