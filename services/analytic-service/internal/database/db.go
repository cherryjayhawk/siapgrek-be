package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect creates a pgxpool connection pool to TimescaleDB
// with bounded connection limits for read-only operations.
func Connect() (*pgxpool.Pool, error) {
	dsn := os.Getenv("DATABASE_URL")
	log.Println("DATABASE_URL:", dsn)
	// dsn := ""
	if dsn == "" {
		// Build DSN from individual env vars
		// host := getEnvOrDefault("DB_HOST", "ep-aged-sky-a16bdxx0-pooler.ap-southeast-1.aws.neon.tech")
		// port := getEnvOrDefault("DB_PORT", "5432")
		// user := getEnvOrDefault("DB_USER", "neondb_owner")
		// password := getEnvOrDefault("DB_PASSWORD", "npg_qo6KVURudD5P")
		// dbname := getEnvOrDefault("DB_NAME", "neondb")
		host := getEnvOrDefault("DB_HOST", "timescaledb")
		port := getEnvOrDefault("DB_PORT", "5432")
		user := getEnvOrDefault("DB_USER", "orchid_admin")
		password := getEnvOrDefault("DB_PASSWORD", "Orchid2026")
		dbname := getEnvOrDefault("DB_NAME", "orchid_db")
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, password, host, port, dbname)
	}

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	// Bounded connection pool for read-only operations
	maxConns := getEnvAsInt("DB_MAX_CONNS", 20)
	config.MaxConns = int32(maxConns)
	config.MinConns = 2
	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute
	config.HealthCheckPeriod = 1 * time.Minute

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}
