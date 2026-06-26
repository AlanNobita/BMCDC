package room

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

// GenerateRoomCode generates a random room code like "abc-defg-hij"
func GenerateRoomCode() (string, error) {
	b := 5 // 10 hex characters
	bytes := make([]byte, b)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	hexStr := hex.EncodeToString(bytes) // e.g., "abcdefghij"
	if len(hexStr) < 10 {
		return "", fmt.Errorf("failed to generate enough random bytes")
	}
	return fmt.Sprintf("%s-%s-%s", hexStr[0:3], hexStr[3:7], hexStr[7:10]), nil
}
