package handlers

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TelemetryHandler handles all telemetry read endpoints.
type TelemetryHandler struct {
	pool *pgxpool.Pool
}

// NewTelemetryHandler creates a new TelemetryHandler.
func NewTelemetryHandler(pool *pgxpool.Pool) *TelemetryHandler {
	return &TelemetryHandler{pool: pool}
}

// --- Preset time range definitions ---

type timePreset struct {
	Duration time.Duration                              // lookback duration (for "last_*" types)
	Bucket   string                                     // TimescaleDB time_bucket interval
	Relative bool                                       // true = calendar-relative (today, this_week, etc.)
	Calc     func(now time.Time) (start, end time.Time) // for relative presets
}

var presets = map[string]timePreset{
	// Lookback presets
	"last_5m":  {Duration: 5 * time.Minute, Bucket: "10 seconds"},
	"last_15m": {Duration: 15 * time.Minute, Bucket: "10 seconds"},
	"last_1h":  {Duration: 1 * time.Hour, Bucket: "1 minute"},
	"last_6h":  {Duration: 6 * time.Hour, Bucket: "5 minutes"},
	"last_24h": {Duration: 24 * time.Hour, Bucket: "15 minutes"},
	"last_7d":  {Duration: 7 * 24 * time.Hour, Bucket: "1 hour"},
	"last_30d": {Duration: 30 * 24 * time.Hour, Bucket: "6 hours"},

	// Calendar-relative presets
	"today": {Relative: true, Bucket: "1 hour", Calc: func(now time.Time) (time.Time, time.Time) {
		start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		return start, now
	}},
	"yesterday": {Relative: true, Bucket: "1 hour", Calc: func(now time.Time) (time.Time, time.Time) {
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		start := today.AddDate(0, 0, -1)
		return start, today
	}},
	"this_week": {Relative: true, Bucket: "1 day", Calc: func(now time.Time) (time.Time, time.Time) {
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday = 7
		}
		start := time.Date(now.Year(), now.Month(), now.Day()-weekday+1, 0, 0, 0, 0, now.Location())
		return start, now
	}},
	"this_month": {Relative: true, Bucket: "1 day", Calc: func(now time.Time) (time.Time, time.Time) {
		start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		return start, now
	}},
	"this_quarter": {Relative: true, Bucket: "1 week", Calc: func(now time.Time) (time.Time, time.Time) {
		quarterMonth := ((now.Month()-1)/3)*3 + 1
		start := time.Date(now.Year(), quarterMonth, 1, 0, 0, 0, 0, now.Location())
		return start, now
	}},
	"this_half": {Relative: true, Bucket: "1 week", Calc: func(now time.Time) (time.Time, time.Time) {
		var halfMonth time.Month = 1
		if now.Month() > 6 {
			halfMonth = 7
		}
		start := time.Date(now.Year(), halfMonth, 1, 0, 0, 0, 0, now.Location())
		return start, now
	}},
	"this_year": {Relative: true, Bucket: "1 month", Calc: func(now time.Time) (time.Time, time.Time) {
		start := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		return start, now
	}},
}

// allowedBuckets is a whitelist of valid TimescaleDB time_bucket interval strings.
// This prevents SQL injection by only allowing known-safe values.
var allowedBuckets = map[string]time.Duration{
	"10 seconds": 10 * time.Second,
	"30 seconds": 30 * time.Second,
	"1 minute":   1 * time.Minute,
	"5 minutes":  5 * time.Minute,
	"10 minutes": 10 * time.Minute,
	"15 minutes": 15 * time.Minute,
	"30 minutes": 30 * time.Minute,
	"1 hour":     1 * time.Hour,
	"6 hours":    6 * time.Hour,
	"12 hours":   12 * time.Hour,
	"1 day":      24 * time.Hour,
	"1 week":     7 * 24 * time.Hour,
	"1 month":    30 * 24 * time.Hour,
}

// --- Metric whitelist ---

// metricColumn defines the mapping from a user-facing metric name to the
// raw DB column name and its aggregated (AVG) alias.
type metricColumn struct {
	Column   string // raw column name for SELECT in GetLatest
	AvgExpr  string // e.g. "AVG(soil_temperature)"
	AvgAlias string // e.g. "avg_soil_temperature"
}

// allowedMetrics is the whitelist of metrics that clients can request.
// Keys are the user-facing query param values; values carry safe SQL fragments.
var allowedMetrics = map[string]metricColumn{
	"soil_temperature":  {Column: "soil_temperature", AvgExpr: "AVG(soil_temperature)", AvgAlias: "avg_soil_temperature"},
	"soil_humidity":     {Column: "soil_humidity", AvgExpr: "AVG(soil_humidity)", AvgAlias: "avg_soil_humidity"},
	"env_temperature":   {Column: "env_temperature", AvgExpr: "AVG(env_temperature)", AvgAlias: "avg_env_temperature"},
	"env_humidity":      {Column: "env_humidity", AvgExpr: "AVG(env_humidity)", AvgAlias: "avg_env_humidity"},
	"light_lux":         {Column: "light_lux", AvgExpr: "AVG(light_lux)", AvgAlias: "avg_light_lux"},
	"soil_ph":           {Column: "soil_ph", AvgExpr: "AVG(soil_ph)", AvgAlias: "avg_soil_ph"},
	"soil_conductivity": {Column: "soil_conductivity", AvgExpr: "AVG(soil_conductivity)", AvgAlias: "avg_soil_conductivity"},
}

// allMetricKeys returns the full ordered list of metric names (for default/fallback).
var allMetricKeys = []string{
	"soil_temperature", "soil_humidity",
	"env_temperature", "env_humidity",
	"light_lux",
	"soil_ph", "soil_conductivity",
}

// allowedMetricNames returns metric names for error messages.
func allowedMetricNames() []string {
	return allMetricKeys
}

// validateMetrics checks that every requested metric exists in the whitelist.
// Returns the validated list, or an error naming the first invalid metric.
func validateMetrics(requested []string) ([]string, error) {
	if len(requested) == 0 {
		return allMetricKeys, nil // fallback: all metrics
	}
	for _, m := range requested {
		if _, ok := allowedMetrics[m]; !ok {
			return nil, fmt.Errorf("invalid metric: %s", m)
		}
	}
	return requested, nil
}

// allowedBucketKeys returns the list of valid bucket strings for error messages.
func allowedBucketKeys() []string {
	keys := make([]string, 0, len(allowedBuckets))
	for k := range allowedBuckets {
		keys = append(keys, k)
	}
	return keys
}

// parseBucketDuration converts a TimescaleDB interval string to a Go time.Duration.
// Returns an error if the bucket string is not in the allowed whitelist.
func parseBucketDuration(bucket string) (time.Duration, error) {
	normalized := strings.TrimSpace(strings.ToLower(bucket))
	d, ok := allowedBuckets[normalized]
	if !ok {
		return 0, fmt.Errorf("invalid bucket: %s", bucket)
	}
	return d, nil
}

// resolvePresetDuration returns the effective total duration for a preset.
// For lookback presets, it returns the Duration directly.
// For calendar-relative presets, it calculates the span from the Calc function.
func resolvePresetDuration(p timePreset, now time.Time) time.Duration {
	if p.Relative && p.Calc != nil {
		start, end := p.Calc(now)
		return end.Sub(start)
	}
	return p.Duration
}

// allowedRanges returns the list of valid preset keys for error messages.
func allowedRanges() []string {
	keys := make([]string, 0, len(presets))
	for k := range presets {
		keys = append(keys, k)
	}
	return keys
}

// resolveTimeRange converts a preset string to a start/end time pair and bucket.
// If customBucket is non-empty, it overrides the preset's default bucket after validation.
func resolveTimeRange(preset string, customBucket string, now time.Time) (start, end time.Time, bucket string, err error) {
	p, ok := presets[preset]
	if !ok {
		return time.Time{}, time.Time{}, "", fmt.Errorf("invalid range preset: %s", preset)
	}

	if p.Relative && p.Calc != nil {
		start, end = p.Calc(now)
	} else {
		start = now.Add(-p.Duration)
		end = now
	}

	// Determine which bucket to use
	bucket = p.Bucket
	if customBucket != "" {
		normalized := strings.TrimSpace(strings.ToLower(customBucket))

		// Validate the custom bucket is in the allowed list
		bucketDuration, parseErr := parseBucketDuration(normalized)
		if parseErr != nil {
			return time.Time{}, time.Time{}, "", fmt.Errorf(
				"invalid bucket '%s'; allowed values: %v",
				customBucket, allowedBucketKeys(),
			)
		}

		// Validate bucket duration < preset duration
		presetDuration := resolvePresetDuration(p, now)
		if bucketDuration >= presetDuration {
			return time.Time{}, time.Time{}, "", fmt.Errorf(
				"bucket '%s' (%v) must be smaller than the preset range '%s' (%v)",
				customBucket, bucketDuration, preset, presetDuration,
			)
		}

		bucket = normalized
	}

	return start, end, bucket, nil
}

// --- Telemetry data models ---

// SensorReading represents a single telemetry row.
type SensorReading struct {
	Time             time.Time `json:"time"`
	DeviceID         string    `json:"device_id"`
	SoilTemperature  *float64  `json:"soil_temperature,omitempty"`
	SoilHumidity     *float64  `json:"soil_humidity,omitempty"`
	EnvTemperature   *float64  `json:"env_temperature,omitempty"`
	EnvHumidity      *float64  `json:"env_humidity,omitempty"`
	LightLux         *int      `json:"light_lux,omitempty"`
	SoilPh           *float64  `json:"soil_ph,omitempty"`
	SoilConductivity *float64  `json:"soil_conductivity,omitempty"`
}

// AggregatedReading represents a time-bucketed aggregated row.
type AggregatedReading struct {
	Bucket              time.Time `json:"bucket"`
	AvgSoilTemperature  *float64  `json:"avg_soil_temperature,omitempty"`
	AvgSoilHumidity     *float64  `json:"avg_soil_humidity,omitempty"`
	AvgEnvTemperature   *float64  `json:"avg_env_temperature,omitempty"`
	AvgEnvHumidity      *float64  `json:"avg_env_humidity,omitempty"`
	AvgLightLux         *float64  `json:"avg_light_lux,omitempty"`
	AvgSoilPh           *float64  `json:"avg_soil_ph,omitempty"`
	AvgSoilConductivity *float64  `json:"avg_soil_conductivity,omitempty"`
}

// --- Handler methods ---

// scanFieldForMetric returns a pointer to the correct SensorReading field for scanning.
func scanFieldForMetric(r *SensorReading, metric string) interface{} {
	switch metric {
	case "soil_temperature":
		return &r.SoilTemperature
	case "soil_humidity":
		return &r.SoilHumidity
	case "env_temperature":
		return &r.EnvTemperature
	case "env_humidity":
		return &r.EnvHumidity
	case "light_lux":
		return &r.LightLux
	case "soil_ph":
		return &r.SoilPh
	case "soil_conductivity":
		return &r.SoilConductivity
	default:
		return nil
	}
}

// GetLatest returns the most recent telemetry reading for a given device.
// GET /api/v1/telemetry/latest?device_id=node1&metric=soil_temperature&metric=lux
func (h *TelemetryHandler) GetLatest(c *fiber.Ctx) error {
	deviceID := c.Query("device_id")
	if deviceID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "device_id query parameter is required",
		})
	}

	// Parse & validate metric query params
	requested := c.Context().QueryArgs().PeekMulti("metric")
	metricNames := make([]string, 0, len(requested))
	for _, b := range requested {
		metricNames = append(metricNames, string(b))
	}
	metrics, err := validateMetrics(metricNames)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":           err.Error(),
			"allowed_metrics": allowedMetricNames(),
		})
	}

	// Build dynamic SELECT clause
	var sb strings.Builder
	sb.WriteString("SELECT time, device_id")
	for _, m := range metrics {
		sb.WriteString(", ")
		sb.WriteString(allowedMetrics[m].Column)
	}
	sb.WriteString(" FROM telemetry WHERE device_id = $1 ORDER BY time DESC LIMIT 1")

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	// Build scan destinations dynamically
	var reading SensorReading
	scanDests := make([]interface{}, 0, 2+len(metrics))
	scanDests = append(scanDests, &reading.Time, &reading.DeviceID)
	for _, m := range metrics {
		scanDests = append(scanDests, scanFieldForMetric(&reading, m))
	}

	err = h.pool.QueryRow(ctx, sb.String(), deviceID).Scan(scanDests...)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":     "no telemetry data found for device",
				"device_id": deviceID,
			})
		}
		log.Printf("error querying telemetry data: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to query telemetry data",
		})
	}

	return c.JSON(reading)
}

// scanAggFieldForMetric returns a pointer to the correct AggregatedReading field for scanning.
func scanAggFieldForMetric(r *AggregatedReading, metric string) interface{} {
	switch metric {
	case "soil_temperature":
		return &r.AvgSoilTemperature
	case "soil_humidity":
		return &r.AvgSoilHumidity
	case "env_temperature":
		return &r.AvgEnvTemperature
	case "env_humidity":
		return &r.AvgEnvHumidity
	case "light_lux":
		return &r.AvgLightLux
	case "soil_ph":
		return &r.AvgSoilPh
	case "soil_conductivity":
		return &r.AvgSoilConductivity
	default:
		return nil
	}
}

// GetHistory returns time-bucketed aggregated telemetry for a given device and preset range.
// GET /api/v1/telemetry/history?device_id=node1&range=last_7d&metric=soil_temperature&metric=lux
func (h *TelemetryHandler) GetHistory(c *fiber.Ctx) error {
	log.Printf("GetHistory called")
	deviceID := c.Query("device_id")
	if deviceID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "device_id query parameter is required",
		})
	}

	rangePreset := c.Query("range")
	if rangePreset == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":          "range query parameter is required",
			"allowed_values": allowedRanges(),
		})
	}

	// Parse & validate metric query params
	requested := c.Context().QueryArgs().PeekMulti("metric")
	metricNames := make([]string, 0, len(requested))
	for _, b := range requested {
		metricNames = append(metricNames, string(b))
	}
	metrics, err := validateMetrics(metricNames)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":           err.Error(),
			"allowed_metrics": allowedMetricNames(),
		})
	}

	customBucket := c.Query("bucket") // optional: override the default bucket
	log.Printf("customBucket: %s\n", customBucket)

	now := time.Now()
	start, end, bucket, err := resolveTimeRange(rangePreset, customBucket, now)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":           err.Error(),
			"allowed_values":  allowedRanges(),
			"allowed_buckets": allowedBucketKeys(),
		})
	}

	// Build dynamic SELECT clause
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("SELECT time_bucket('%s', time) AS bucket", bucket))
	for _, m := range metrics {
		mc := allowedMetrics[m]
		sb.WriteString(fmt.Sprintf(", %s AS %s", mc.AvgExpr, mc.AvgAlias))
	}
	sb.WriteString(" FROM telemetry WHERE device_id = $1 AND time >= $2 AND time < $3 GROUP BY bucket ORDER BY bucket ASC")

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.pool.Query(ctx, sb.String(), deviceID, start, end)
	if err != nil {
		log.Printf("error querying historical telemetry data: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to query historical telemetry data",
		})
	}
	defer rows.Close()

	results := make([]AggregatedReading, 0)
	for rows.Next() {
		var r AggregatedReading
		scanDests := make([]interface{}, 0, 1+len(metrics))
		scanDests = append(scanDests, &r.Bucket)
		for _, m := range metrics {
			scanDests = append(scanDests, scanAggFieldForMetric(&r, m))
		}
		if err := rows.Scan(scanDests...); err != nil {
			log.Printf("error scanning telemetry row: %v\n", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to scan telemetry row",
			})
		}
		results = append(results, r)
	}

	return c.JSON(fiber.Map{
		"device_id": deviceID,
		"range":     rangePreset,
		"bucket":    bucket,
		"start":     start,
		"end":       end,
		"count":     len(results),
		"data":      results,
	})
}
