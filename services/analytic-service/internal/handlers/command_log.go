package handlers

import (
	"context"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// CommandLogHandler handles command log read endpoints.
type CommandLogHandler struct {
	pool *pgxpool.Pool
}

// NewCommandLogHandler creates a new CommandLogHandler.
func NewCommandLogHandler(pool *pgxpool.Pool) *CommandLogHandler {
	return &CommandLogHandler{pool: pool}
}

// CommandLogEntry represents a single command log record.
type CommandLogEntry struct {
	ID           string    `json:"id"`
	Timestamp    time.Time `json:"timestamp"`
	DeviceID     string    `json:"device_id"`
	Actuator     string    `json:"actuator"`
	CommandValue int       `json:"command_value"`
	Source       string    `json:"source"`
}

// GetLogs returns command log entries filtered by device_id.
// GET /api/v1/command-log?device_id=node1&limit=100
func (h *CommandLogHandler) GetLogs(c *fiber.Ctx) error {
	deviceID := c.Query("device_id")
	if deviceID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "device_id query parameter is required",
		})
	}

	limit := c.QueryInt("limit", 100)
	if limit < 1 || limit > 500 {
		limit = 100
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.pool.Query(ctx,
		`SELECT id, "timestamp", device_id, actuator, command_value, source
		 FROM command_log
		 WHERE device_id = $1
		 ORDER BY "timestamp" DESC
		 LIMIT $2`,
		deviceID, limit,
	)
	if err != nil {
		log.Printf("error querying command_log: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to query command log",
		})
	}
	defer rows.Close()

	results := make([]CommandLogEntry, 0)
	for rows.Next() {
		var entry CommandLogEntry
		if err := rows.Scan(
			&entry.ID,
			&entry.Timestamp,
			&entry.DeviceID,
			&entry.Actuator,
			&entry.CommandValue,
			&entry.Source,
		); err != nil {
			log.Printf("error scanning command_log row: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to scan command log row",
			})
		}
		results = append(results, entry)
	}

	return c.JSON(fiber.Map{
		"device_id": deviceID,
		"count":     len(results),
		"data":      results,
	})
}
