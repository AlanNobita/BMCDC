package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/user/bmscdc/internal/types"
)

// PgxService is the concrete Postgres implementation of DBService.
type PgxService struct {
	pool *pgxpool.Pool
}

// NewPgxService creates a new PgxService with a connection pool.
func NewPgxService(ctx context.Context, databaseURL string) (*PgxService, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}
	return &PgxService{pool: pool}, nil
}

// Close closes the connection pool.
func (s *PgxService) Close() {
	s.pool.Close()
}

func (s *PgxService) CreateRoom(ctx context.Context, meetingCode string) (*types.Room, error) {
	row := s.pool.QueryRow(ctx,
		`INSERT INTO rooms (meeting_code) VALUES ($1) RETURNING id, meeting_code, title, status, host_controls_chat, host_controls_screen_share, requires_host_admission, created_at`,
		meetingCode,
	)
	var r types.Room
	if err := row.Scan(&r.ID, &r.MeetingCode, &r.Title, &r.Status, &r.HostControlsChat, &r.HostControlsScreenShare, &r.RequiresHostAdmission, &r.CreatedAt); err != nil {
		return nil, err
	}
	return &r, nil
}

func (s *PgxService) GetRoomByCode(ctx context.Context, meetingCode string) (*types.Room, error) {
	row := s.pool.QueryRow(ctx,
		`SELECT id, meeting_code, title, status, host_controls_chat, host_controls_screen_share, requires_host_admission, created_at FROM rooms WHERE meeting_code = $1`,
		meetingCode,
	)
	var r types.Room
	if err := row.Scan(&r.ID, &r.MeetingCode, &r.Title, &r.Status, &r.HostControlsChat, &r.HostControlsScreenShare, &r.RequiresHostAdmission, &r.CreatedAt); err != nil {
		return nil, nil // Not found
	}
	return &r, nil
}

func (s *PgxService) EndRoom(ctx context.Context, meetingCode string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE rooms SET status = 'ended', ended_at = NOW() WHERE meeting_code = $1`,
		meetingCode,
	)
	return err
}

func (s *PgxService) CreateKnock(ctx context.Context, roomID, guestName string) (*types.KnockResponse, error) {
	row := s.pool.QueryRow(ctx,
		`INSERT INTO room_knocks (room_id, guest_name, status) VALUES ($1, $2, 'pending') RETURNING id, status`,
		roomID, guestName,
	)
	var k types.KnockResponse
	if err := row.Scan(&k.KnockID, &k.Status); err != nil {
		return nil, err
	}
	return &k, nil
}

func (s *PgxService) UpdateKnockStatus(ctx context.Context, knockID, status string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE room_knocks SET status = $1 WHERE id = $2`,
		status, knockID,
	)
	return err
}

func (s *PgxService) GetKnockRoomCode(ctx context.Context, knockID string) (string, error) {
	var code string
	err := s.pool.QueryRow(ctx,
		`SELECT r.meeting_code FROM room_knocks k JOIN rooms r ON k.room_id = r.id WHERE k.id = $1`,
		knockID,
	).Scan(&code)
	return code, err
}

func (s *PgxService) StartRecording(ctx context.Context, roomID, egressID, path string) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO recordings (room_id, egress_id, storage_path, status) VALUES ($1, $2, $3, 'recording')`,
		roomID, egressID, path,
	)
	return err
}

func (s *PgxService) UpdateRecordingStatus(ctx context.Context, egressID, status string, durationSeconds int, fileSizeBytes int64) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE recordings SET status = $1, duration_seconds = $2, file_size_bytes = $3 WHERE egress_id = $4`,
		status, durationSeconds, fileSizeBytes, egressID,
	)
	return err
}

func (s *PgxService) UpdateParticipantLeft(ctx context.Context, roomCode string, identity string) error {
	now := time.Now()
	_, err := s.pool.Exec(ctx,
		`UPDATE room_participants rp
		 SET left_at = $1
		 FROM rooms r
		 WHERE rp.room_id = r.id AND r.meeting_code = $2 AND rp.user_id::text = $3 AND rp.left_at IS NULL`,
		now, roomCode, identity,
	)
	return err
}

func (s *PgxService) GetUserCount(ctx context.Context) (int, error) {
	var count int
	err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM public.profiles`).Scan(&count)
	return count, err
}
