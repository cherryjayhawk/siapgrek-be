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

type metricColumn struct {
	Column   string
	AvgExpr  string
	AvgAlias string
	IsSoil   bool
}

var allowedMetrics = map[string]metricColumn{
	"soil_temperature":  {Column: "soil_temperature", AvgExpr: "AVG(soil_temperature)", AvgAlias: "avg_soil_temperature", IsSoil: true},
	"soil_humidity":     {Column: "soil_humidity", AvgExpr: "AVG(soil_humidity)", AvgAlias: "avg_soil_humidity", IsSoil: true},
	"env_temperature":   {Column: "env_temperature", AvgExpr: "AVG(env_temperature)", AvgAlias: "avg_env_temperature", IsSoil: false},
	"env_humidity":      {Column: "env_humidity", AvgExpr: "AVG(env_humidity)", AvgAlias: "avg_env_humidity", IsSoil: false},
	"light_lux":         {Column: "light_lux", AvgExpr: "AVG(light_lux)", AvgAlias: "avg_light_lux", IsSoil: false},
	"soil_ph":           {Column: "soil_ph", AvgExpr: "AVG(soil_ph)", AvgAlias: "avg_soil_ph", IsSoil: true},
	"soil_conductivity": {Column: "soil_conductivity", AvgExpr: "AVG(soil_conductivity)", AvgAlias: "avg_soil_conductivity", IsSoil: true},
}

var allMetricKeys = []string{
	"soil_temperature", "soil_humidity",
	"env_temperature", "env_humidity",
	"light_lux",
	"soil_ph", "soil_conductivity",
}

func allowedMetricNames() []string { return allMetricKeys }

func validateMetrics(requested []string) ([]string, error) {
	if len(requested) == 0 {
		return allMetricKeys, nil
	}
	for _, m := range requested {
		if _, ok := allowedMetrics[m]; !ok {
			return nil, fmt.Errorf("invalid metric: %s", m)
		}
	}
	return requested, nil
}

func allowedBucketKeys() []string {
	keys := make([]string, 0, len(allowedBuckets))
	for k := range allowedBuckets {
		keys = append(keys, k)
	}
	return keys
}

func parseBucketDuration(bucket string) (time.Duration, error) {
	normalized := strings.TrimSpace(strings.ToLower(bucket))
	d, ok := allowedBuckets[normalized]
	if !ok {
		return 0, fmt.Errorf("invalid bucket: %s", bucket)
	}
	return d, nil
}

func resolvePresetDuration(p timePreset, now time.Time) time.Duration {
	if p.Relative && p.Calc != nil {
		start, end := p.Calc(now)
		return end.Sub(start)
	}
	return p.Duration
}

func allowedRanges() []string {
	keys := make([]string, 0, len(presets))
	for k := range presets {
		keys = append(keys, k)
	}
	return keys
}

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

	bucket = p.Bucket
	if customBucket != "" {
		normalized := strings.TrimSpace(strings.ToLower(customBucket))
		bucketDuration, parseErr := parseBucketDuration(normalized)
		if parseErr != nil {
			return time.Time{}, time.Time{}, "", fmt.Errorf("invalid bucket '%s'; allowed values: %v", customBucket, allowedBucketKeys())
		}
		presetDuration := resolvePresetDuration(p, now)
		if bucketDuration >= presetDuration {
			return time.Time{}, time.Time{}, "", fmt.Errorf("bucket '%s' must be smaller than the preset range '%s'", customBucket, preset)
		}
		bucket = normalized
	}
	return start, end, bucket, nil
}

// --- Telemetry data models ---

type SoilReading struct {
	SlaveID          string    `json:"slave_id"`
	Time             time.Time `json:"time"`
	SoilTemperature  *float64  `json:"soil_temperature,omitempty"`
	SoilHumidity     *float64  `json:"soil_humidity,omitempty"`
	SoilPh           *float64  `json:"soil_ph,omitempty"`
	SoilConductivity *float64  `json:"soil_conductivity,omitempty"`
}

type SensorReading struct {
	Time             time.Time     `json:"time"`
	DeviceID         string        `json:"device_id"`
	EnvTemperature   *float64      `json:"env_temperature,omitempty"`
	EnvHumidity      *float64      `json:"env_humidity,omitempty"`
	LightLux         *int          `json:"light_lux,omitempty"`
	SoilSensors      []SoilReading `json:"soil_sensors,omitempty"`
	
	// Fallbacks for UI backward compatibility
	SoilTemperature  *float64  `json:"soil_temperature,omitempty"`
	SoilHumidity     *float64  `json:"soil_humidity,omitempty"`
	SoilPh           *float64  `json:"soil_ph,omitempty"`
	SoilConductivity *float64  `json:"soil_conductivity,omitempty"`
}

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

// GetLatest returns the most recent telemetry reading for a given device.
func (h *TelemetryHandler) GetLatest(c *fiber.Ctx) error {
	deviceID := c.Query("device_id")
	if deviceID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "device_id query parameter is required"})
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	var reading SensorReading
	reading.DeviceID = deviceID

	// 1. Fetch Environment Telemetry
	err := h.pool.QueryRow(ctx, "SELECT time, env_temperature, env_humidity, light_lux FROM env_telemetry WHERE device_id = $1 ORDER BY time DESC LIMIT 1", deviceID).Scan(&reading.Time, &reading.EnvTemperature, &reading.EnvHumidity, &reading.LightLux)
	if err != nil && err.Error() != "no rows in result set" {
		log.Printf("error querying env telemetry: %v", err)
	}

	// 2. Fetch latest Soil Telemetry for each slave
	rows, err := h.pool.Query(ctx, "SELECT DISTINCT ON (slave_id) slave_id, time, soil_temperature, soil_humidity, soil_ph, soil_conductivity FROM soil_telemetry WHERE device_id = $1 ORDER BY slave_id, time DESC", deviceID)
	if err == nil {
		defer rows.Close()
		var count float64
		
		// Setup fallback averages
		var sumTemp, sumHum, sumPh, sumEc float64
		var countTemp, countHum, countPh, countEc float64

		for rows.Next() {
			var s SoilReading
			if err := rows.Scan(&s.SlaveID, &s.Time, &s.SoilTemperature, &s.SoilHumidity, &s.SoilPh, &s.SoilConductivity); err == nil {
				reading.SoilSensors = append(reading.SoilSensors, s)
				count++
				
				if s.SoilTemperature != nil { sumTemp += *s.SoilTemperature; countTemp++ }
				if s.SoilHumidity != nil { sumHum += *s.SoilHumidity; countHum++ }
				if s.SoilPh != nil { sumPh += *s.SoilPh; countPh++ }
				if s.SoilConductivity != nil { sumEc += *s.SoilConductivity; countEc++ }
			}
		}

		if count > 0 {
			if reading.Time.IsZero() {
				reading.Time = reading.SoilSensors[0].Time
			}
			
			if countTemp > 0 { v := sumTemp / countTemp; reading.SoilTemperature = &v }
			if countHum > 0 { v := sumHum / countHum; reading.SoilHumidity = &v }
			if countPh > 0 { v := sumPh / countPh; reading.SoilPh = &v }
			if countEc > 0 { v := sumEc / countEc; reading.SoilConductivity = &v }
		}
	} else {
		log.Printf("error querying soil telemetry: %v", err)
	}

	if reading.Time.IsZero() {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "no telemetry data found for device", "device_id": deviceID})
	}

	return c.JSON(reading)
}

func scanAggFieldForMetric(r *AggregatedReading, metric string) interface{} {
	switch metric {
	case "soil_temperature": return &r.AvgSoilTemperature
	case "soil_humidity": return &r.AvgSoilHumidity
	case "env_temperature": return &r.AvgEnvTemperature
	case "env_humidity": return &r.AvgEnvHumidity
	case "light_lux": return &r.AvgLightLux
	case "soil_ph": return &r.AvgSoilPh
	case "soil_conductivity": return &r.AvgSoilConductivity
	}
	return nil
}

// GetHistory returns time-bucketed aggregated telemetry for a given device and preset range.
func (h *TelemetryHandler) GetHistory(c *fiber.Ctx) error {
	deviceID := c.Query("device_id")
	if deviceID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "device_id is required"})
	}

	rangePreset := c.Query("range")
	if rangePreset == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "range is required", "allowed_values": allowedRanges()})
	}

	requested := c.Context().QueryArgs().PeekMulti("metric")
	metricNames := make([]string, 0, len(requested))
	for _, b := range requested {
		metricNames = append(metricNames, string(b))
	}
	metrics, err := validateMetrics(metricNames)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error(), "allowed_metrics": allowedMetricNames()})
	}

	customBucket := c.Query("bucket")
	now := time.Now()
	start, end, bucket, err := resolveTimeRange(rangePreset, customBucket, now)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Build FULL OUTER JOIN query over env and soil telemetry
	var envCols, soilCols []string
	for _, m := range metrics {
		mc := allowedMetrics[m]
		if mc.IsSoil {
			soilCols = append(soilCols, fmt.Sprintf("%s AS %s", mc.AvgExpr, mc.AvgAlias))
		} else {
			envCols = append(envCols, fmt.Sprintf("%s AS %s", mc.AvgExpr, mc.AvgAlias))
		}
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf(`WITH env AS (
		SELECT time_bucket('%s', time) AS bucket`, bucket))
	if len(envCols) > 0 {
		sb.WriteString(", ")
		sb.WriteString(strings.Join(envCols, ", "))
	} else {
		sb.WriteString(", 1 as dummy_env") // Prevent trailing comma syntax errors
	}
	sb.WriteString(fmt.Sprintf(` FROM env_telemetry WHERE device_id = $1 AND time >= $2 AND time < $3 GROUP BY bucket
	), soil AS (
		SELECT time_bucket('%s', time) AS bucket`, bucket))
	if len(soilCols) > 0 {
		sb.WriteString(", ")
		sb.WriteString(strings.Join(soilCols, ", "))
	} else {
		sb.WriteString(", 1 as dummy_soil")
	}
	sb.WriteString(` FROM soil_telemetry WHERE device_id = $1 AND time >= $2 AND time < $3 GROUP BY bucket
	)
	SELECT COALESCE(e.bucket, s.bucket) AS bucket`)
	for _, m := range metrics {
		mc := allowedMetrics[m]
		if mc.IsSoil {
			sb.WriteString(fmt.Sprintf(", s.%s", mc.AvgAlias))
		} else {
			sb.WriteString(fmt.Sprintf(", e.%s", mc.AvgAlias))
		}
	}
	sb.WriteString(` FROM env e FULL OUTER JOIN soil s ON e.bucket = s.bucket ORDER BY bucket ASC`)

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.pool.Query(ctx, sb.String(), deviceID, start, end)
	if err != nil {
		log.Printf("error querying historical telemetry data: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to query historical telemetry data"})
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
			log.Printf("error scanning telemetry row: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to scan telemetry row"})
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
