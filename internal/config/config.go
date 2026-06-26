package config

import (
	"github.com/ilyakaznacheev/cleanenv"
)

// Config represents the application configuration loaded from environment variables.
type Config struct {
	Port int `env:"PORT" env-default:"8080"`

	// Supabase configuration
	SupabaseURL          string `env:"SUPABASE_URL" env-required:"true"`
	SupabaseServiceKey   string `env:"SUPABASE_SERVICE_KEY" env-required:"true"`
	SupabaseS3AccessKey  string `env:"SUPABASE_S3_ACCESS_KEY"`
	SupabaseS3SecretKey  string `env:"SUPABASE_S3_SECRET_KEY"`
	SupabaseS3Endpoint   string `env:"SUPABASE_S3_ENDPOINT"`

	// LiveKit configuration
	LiveKitAPIKey        string `env:"LIVEKIT_API_KEY" env-required:"true"`
	LiveKitAPISecret     string `env:"LIVEKIT_API_SECRET" env-required:"true"`
	LiveKitURL           string `env:"LIVEKIT_URL" env-required:"true"`
	LiveKitWebhookSecret string `env:"LIVEKIT_WEBHOOK_SECRET"`

	// DB configuration
	DatabaseURL          string `env:"DATABASE_URL" env-required:"true"`
}

// Load reads the environment variables and returns a Config struct.
func Load() (*Config, error) {
	var cfg Config
	if err := cleanenv.ReadEnv(&cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
