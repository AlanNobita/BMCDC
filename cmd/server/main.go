package main

import (
	"context"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/user/bmscdc/internal/auth"
	"github.com/user/bmscdc/internal/config"
	"github.com/user/bmscdc/internal/db"
	"github.com/user/bmscdc/internal/handler"
	"github.com/user/bmscdc/internal/livekit"
	"github.com/user/bmscdc/internal/webhook"
	"github.com/user/bmscdc/internal/ws"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()
	dbService, err := db.NewPgxService(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbService.Close()

	authService := auth.NewSupabaseAuth(cfg.SupabaseServiceKey) // Using service key as secret for simplistic validation in this example
	
	lkService := livekit.NewLiveKitClient(
		cfg.LiveKitAPIKey,
		cfg.LiveKitAPISecret,
		cfg.LiveKitURL,
		cfg.LiveKitWebhookSecret,
	)

	wsHub := ws.NewHub()
	go wsHub.Run()

	webhookHandler := webhook.NewWebhookHandler(lkService, dbService)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	apiHandler := handler.NewHandler(dbService, authService, lkService, wsHub, webhookHandler)
	apiHandler.RegisterRoutes(r)

	log.Printf("Server listening on port %d", cfg.Port)
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
