// cmd/migrate/main.go — runs all SQL migration files in order.
// Run: go run ./cmd/migrate  OR  task migrate
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"stringer-tracker/internal/database"
)

func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("migrate: failed to connect: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("migrate: failed to get sql.DB: %v", err)
	}
	defer sqlDB.Close()

	files, err := database.ApplySQLFiles(db)
	if err != nil {
		log.Fatalf("migrate: %v", err)
	}
	for _, f := range files {
		fmt.Printf("Running %s... OK\n", f)
	}
	fmt.Println("All migrations applied successfully.")
}
