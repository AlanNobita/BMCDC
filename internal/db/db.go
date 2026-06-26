package db

import (
	"context"
	"github.com/user/bmscdc/internal/types"
)

// DBService defines the interface for database operations.
//
//go:generate go run go.uber.org/mock/mockgen -destination=../mocks/db_mock.go -package=mocks github.com/user/bmscdc/internal/db DBService
type DBService interface {
	CreateRoom(ctx context.Context, meetingCode string) (*types.Room, error)
	GetRoomByCode(ctx context.Context, meetingCode string) (*types.Room, error)
	EndRoom(ctx context.Context, meetingCode string) error
	CreateKnock(ctx context.Context, roomID, guestName string) (*types.KnockResponse, error)
	UpdateKnockStatus(ctx context.Context, knockID, status string) error
	GetKnockRoomCode(ctx context.Context, knockID string) (string, error)
	StartRecording(ctx context.Context, roomID, egressID, path string) error
	UpdateRecordingStatus(ctx context.Context, egressID, status string, durationSeconds int, fileSizeBytes int64) error
	UpdateParticipantLeft(ctx context.Context, roomCode string, identity string) error
	GetUserCount(ctx context.Context) (int, error)
}
