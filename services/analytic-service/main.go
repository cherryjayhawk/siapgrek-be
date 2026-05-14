package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"

	"github.com/siapgrek/analytic-service/internal/database"
	"github.com/siapgrek/analytic-service/internal/handlers"
)

func main() {
	// Load .env (silently ignore if not present, e.g. in Docker)
	_ = godotenv.Load()

	// Initialize database connection pool
	pool, err := database.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("✅ Connected to TimescaleDB")

	// Initialize Fiber
	app := fiber.New(fiber.Config{
		AppName:      "analytic-service",
		ServerHeader: "analytic-service",
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New())

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "analytic-service",
		})
	})

	// API v1 routes
	v1 := app.Group("/api/v1")
	telemetryHandler := handlers.NewTelemetryHandler(pool)
	v1.Get("/telemetry/latest", telemetryHandler.GetLatest)
	v1.Get("/telemetry/history", telemetryHandler.GetHistory)

	// Start server
	port := os.Getenv("ANALYTIC_PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("🚀 Analytic service listening on :%s", port)
	log.Fatal(app.Listen(":" + port))
}
