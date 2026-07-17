package handlers_test

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"github.com/siapgrek/analytic-service/internal/database"
	"github.com/siapgrek/analytic-service/internal/handlers"
)

func TestAnalyticGetHistoryFunctional(t *testing.T) {
	// 1. Setup Environment
	_ = godotenv.Load("../../../.env") // Load env variables if run locally

	// Gunakan URL default ke container lokal jika tidak ada di env
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		dbUrl = "postgresql://postgres:postgrespassword@localhost:5433/orchid_db?sslmode=disable"
		os.Setenv("DATABASE_URL", dbUrl)
	}

	// 2. Setup Database Connection
	pool, err := database.Connect()
	if err != nil {
		t.Fatalf("Gagal terhubung ke database TimescaleDB: %v", err)
	}
	defer pool.Close()

	ctx := context.Background()
	deviceID := "test_api_functional"

	// Bersihkan data lama untuk device ini
	_, _ = pool.Exec(ctx, "DELETE FROM env_telemetry WHERE device_id = $1", deviceID)

	// Insert Dummy Data (Data 5 menit yang lalu)
	testTime := time.Now().Add(-5 * time.Minute)
	_, err = pool.Exec(ctx, `
		INSERT INTO env_telemetry (time, device_id, env_temperature, env_humidity, light_lux) 
		VALUES ($1, $2, $3, $4, $5)`,
		testTime, deviceID, 28.5, 65.0, 1200,
	)
	if err != nil {
		t.Fatalf("Gagal menyisipkan data dummy ke database: %v", err)
	}

	// 3. Setup Fiber & Handler
	app := fiber.New()
	handler := handlers.NewTelemetryHandler(pool)
	app.Get("/api/v1/telemetry/history", handler.GetHistory)

	// 4. Simulasi HTTP Request (Client)
	// Kita akan meminta rentang 'last_1h' (1 jam terakhir)
	url := fmt.Sprintf("/api/v1/telemetry/history?device_id=%s&range=last_1h", deviceID)
	req := httptest.NewRequest("GET", url, nil)

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Gagal melakukan simulasi HTTP request: %v", err)
	}

	// 5. Validasi Hasil (Sesuai Tabel Pengujian Metrik)
	
	// A. Memeriksa HTTP Status 200 OK
	if resp.StatusCode != 200 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		t.Fatalf("Diharapkan status 200, mendapatkan %d. Body: %s", resp.StatusCode, string(bodyBytes))
	}

	// B. Memeriksa Response JSON
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Gagal membaca body response: %v", err)
	}

	var result map[string]interface{}
	err = json.Unmarshal(bodyBytes, &result)
	if err != nil {
		t.Fatalf("Gagal decode JSON response: %v", err)
	}

	// C. Verifikasi field dalam response
	if result["device_id"] != deviceID {
		t.Errorf("Diharapkan device_id '%s', mendapatkan '%v'", deviceID, result["device_id"])
	}

	if result["range"] != "last_1h" {
		t.Errorf("Diharapkan range 'last_1h', mendapatkan '%v'", result["range"])
	}

	dataArr, ok := result["data"].([]interface{})
	if !ok {
		t.Fatalf("Field 'data' tidak valid atau hilang")
	}

	// Karena kita baru saja insert 1 data ke dalam time frame 1 jam, minimal ada 1 data teragregasi
	if len(dataArr) == 0 {
		t.Errorf("Diharapkan array data tidak kosong, mendapatkan 0 elemen")
	} else {
		// Validasi isi elemen pertama
		firstItem, ok := dataArr[0].(map[string]interface{})
		if !ok {
			t.Fatalf("Elemen 'data' bukan object JSON yang valid")
		}
		
		// TimescaleDB akan mengembalikan nilai rata-rata pada bucket waktu tersebut
		if firstItem["avg_env_temperature"] == nil {
			t.Errorf("Field agregasi 'avg_env_temperature' tidak boleh kosong")
		} else {
			temp := firstItem["avg_env_temperature"].(float64)
			if temp != 28.5 {
				t.Errorf("Diharapkan rata-rata temperatur 28.5, mendapatkan %v", temp)
			}
		}
	}
}
