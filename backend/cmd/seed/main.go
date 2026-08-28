// cmd/seed/main.go — wipes all data, then creates admin + user1 and sample records.
// Run: task seed  OR  go run ./cmd/seed
package main

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"stringer-tracker/internal/config"
	"stringer-tracker/internal/database"
	"stringer-tracker/internal/model"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	seedDays        = 10
	recordsPerDay   = 5
	bangkokTimeZone = "Asia/Bangkok"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	db := database.Connect(cfg.DatabaseURL)
	if sqlDB, err := db.DB(); err == nil {
		defer sqlDB.Close()
	}

	if err := resetAllData(db); err != nil {
		log.Fatalf("seed: failed to reset data: %v", err)
	}

	admin := createUser(db, mustEnv("ADMIN_USERNAME"), mustEnv("ADMIN_PASSWORD"), mustEnv("ADMIN_NAME"), model.UserRoleAdmin)
	user1 := createUser(db, "user1", "testtest", "User 1", model.UserRoleUser)

	fmt.Printf("seed: admin ready (id=%s  username=%s)\n", admin.ID, admin.Username)
	fmt.Printf("seed: staff ready (id=%s  username=%s  password=testtest)\n", user1.ID, user1.Username)

	if err := seedSampleRecords(db, user1.ID); err != nil {
		log.Fatalf("seed: failed to insert sample records: %v", err)
	}
}

func resetAllData(db *gorm.DB) error {
	if err := db.Exec("TRUNCATE TABLE records, users RESTART IDENTITY CASCADE").Error; err != nil {
		return err
	}
	fmt.Println("seed: cleared all records and users")
	return nil
}

func createUser(db *gorm.DB, username, password, name string, role model.UserRole) model.User {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		log.Fatalf("seed: failed to hash password for %s: %v", username, err)
	}

	user := model.User{
		Username: username,
		Password: string(hashed),
		Name:     name,
		Role:     role,
		IsActive: true,
	}
	if err := db.Create(&user).Error; err != nil {
		log.Fatalf("seed: failed to create user %s: %v", username, err)
	}
	return user
}

func seedSampleRecords(db *gorm.DB, userID string) error {
	loc, err := time.LoadLocation(bangkokTimeZone)
	if err != nil {
		loc = time.Local
	}

	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	start := today.AddDate(0, 0, -(seedDays - 1))

	rng := rand.New(rand.NewSource(now.UnixNano()))
	records := make([]model.Record, 0, seedDays*recordsPerDay)

	for dayOffset := seedDays - 1; dayOffset >= 0; dayOffset-- {
		date := today.AddDate(0, 0, -dayOffset)
		for seq := 1; seq <= recordsPerDay; seq++ {
			records = append(records, randomRecord(rng, userID, date, seq))
		}
	}

	if err := db.Create(&records).Error; err != nil {
		return err
	}

	fmt.Printf("seed: inserted %d sample records (%d days × %d/day, %s → %s)\n",
		len(records),
		seedDays,
		recordsPerDay,
		start.Format("2006-01-02"),
		today.Format("2006-01-02"),
	)
	return nil
}

func randomRecord(rng *rand.Rand, userID string, date time.Time, seq int) model.Record {
	rec := model.Record{
		UserID: userID,
		Date:   date,
		Seq:    seq,
	}

	switch pickWeightedType(rng) {
	case "sale":
		rec.RecordType = "sale"
		rec.Price = pick(rng, []int{200, 500})
		rec.Note = pick(rng, []string{"", "", "ไม้ใหม่", "ลูกค้าประจำ", "โปรโมชั่น"})
	case "demo":
		rec.RecordType = "demo"
		rec.Price = pick(rng, []int{100, 150, 200})
		rec.Note = pick(rng, []string{"", "ทดลองไม้", "ลูกค้า walk-in"})
	case "grip":
		rec.RecordType = "grip"
		rec.Price = pick(rng, []int{50, 80, 100, 120})
		rec.Note = pick(rng, []string{"", "overgrip", "replacement grip", "พัน 2 ชั้น"})
	case "other":
		rec.RecordType = "other"
		rec.Price = pick(rng, []int{50, 100, 150, 200, 250})
		rec.Note = pick(rng, []string{"ซ่อมไม้", "เปลี่ยนกันสะเทือน", "ค่าบริการอื่นๆ", "ปรับน้ำหนัก"})
	default:
		rec.RecordType = "string"
		rec.Price = pick(rng, []int{200, 300, 300})
		rec.String1 = pick(rng, stringMains)
		if rng.Intn(2) == 0 {
			rec.String2 = pick(rng, stringCrosses)
		}
		if rng.Intn(3) != 0 {
			rec.Racket = pick(rng, rackets)
		}
		rec.Note = pick(rng, []string{"", "", "", "ด่วน", "ลูกค้าประจำ", "hybrid", "ขึ้นใหม่", "52 lbs"})
	}

	return rec
}

// Mostly stringing jobs, with a mix of commission / demo / grip / other.
func pickWeightedType(rng *rand.Rand) string {
	n := rng.Intn(100)
	switch {
	case n < 70:
		return "string"
	case n < 82:
		return "sale"
	case n < 90:
		return "grip"
	case n < 95:
		return "demo"
	default:
		return "other"
	}
}

func pick[T any](rng *rand.Rand, items []T) T {
	return items[rng.Intn(len(items))]
}

var stringMains = []string{
	"Luxilon ALU Power 125",
	"Babolat RPM Blast 125",
	"Solinco Hyper-G 125",
	"Yonex Poly Tour Pro 125",
	"Wilson NXT 16",
	"Tecnifibre Razor Code 125",
	"Head Hawk 17",
	"Kirschbaum Pro Line II 125",
	"Luxilon 4G 125",
	"Solinco Confidential 125",
	"Yonex Polytour Strike 125",
	"Babolat RPM Rough 125",
	"Prince Synthetic Gut 16",
	"Wilson Sensation 16",
}

var stringCrosses = []string{
	"Wilson NXT 16",
	"Babolat Xcel 130",
	"Head Velocity MLT 16",
	"Yonex Rexis 130",
	"Tecnifibre X-One Biphase 16",
	"Prince Synthetic Gut 16",
	"Luxilon ALU Power 125",
	"Solinco Hyper-G Soft 125",
}

var rackets = []string{
	"Babolat Pure Drive",
	"Wilson Pro Staff 97",
	"Yonex EZONE 98",
	"Head Speed MP",
	"Wilson Clash 100",
	"Yonex VCORE 100",
	"Tecnifibre TFight 300",
	"Prince Phantom 100",
	"Head Radical MP",
	"Babolat Pure Aero",
}

func mustEnv(key string) string {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		log.Fatalf("required environment variable %q is not set", key)
	}
	return v
}
