// Resets the admin password from ADMIN_* env vars. Does not wipe records.
package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"stringer-tracker/internal/config"
	"stringer-tracker/internal/database"
	"stringer-tracker/internal/model"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	_ = godotenv.Load()

	username := strings.ToLower(strings.TrimSpace(mustEnv("ADMIN_USERNAME")))
	password := mustEnv("ADMIN_PASSWORD")

	cfg := config.Load()
	db := database.Connect(cfg.DatabaseURL)
	if sqlDB, err := db.DB(); err == nil {
		defer sqlDB.Close()
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		log.Fatalf("reset-admin: hash failed: %v", err)
	}

	var user model.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		log.Fatalf("reset-admin: user %q not found: %v", username, err)
	}

	if err := db.Model(&user).Updates(map[string]any{
		"password":   string(hashed),
		"is_active":  true,
		"is_deleted": false,
	}).Error; err != nil {
		log.Fatalf("reset-admin: update failed: %v", err)
	}

	fmt.Printf("reset-admin: password restored for %s (id=%s)\n", user.Username, user.ID)
}

func mustEnv(key string) string {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		log.Fatalf("required environment variable %q is not set", key)
	}
	return v
}
