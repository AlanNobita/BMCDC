package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// AuthService defines the interface for JWT authentication.
//
//go:generate go run go.uber.org/mock/mockgen -destination=../mocks/auth_mock.go -package=mocks github.com/user/bmscdc/internal/auth AuthService
type AuthService interface {
	VerifyToken(tokenString string) (string, error)
	Middleware(next http.Handler) http.Handler
}

type SupabaseAuth struct {
	jwtSecret string
}

func NewSupabaseAuth(jwtSecret string) *SupabaseAuth {
	return &SupabaseAuth{
		jwtSecret: jwtSecret,
	}
}

// UserContextKey is the key used to store the user ID in the context.
type contextKey string
const UserIDKey contextKey = "user_id"

func (a *SupabaseAuth) VerifyToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(a.jwtSecret), nil
	})

	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		sub, ok := claims["sub"].(string)
		if !ok {
			return "", errors.New("sub claim missing or invalid")
		}
		return sub, nil
	}

	return "", errors.New("invalid token")
}

func (a *SupabaseAuth) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "authorization header required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "invalid authorization header format", http.StatusUnauthorized)
			return
		}

		userID, err := a.VerifyToken(parts[1])
		if err != nil {
			http.Error(w, "invalid or expired token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
