package database

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect opens a GORM connection to PostgreSQL and verifies connectivity.
func Connect(dsn string) *gorm.DB {
	// Show SQL logs in non-release mode (useful while learning GORM)
	logLevel := logger.Silent
	if os.Getenv("GIN_MODE") != "release" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:  logger.Default.LogMode(logLevel),
		NowFunc: func() time.Time { return time.Now().UTC() },
		// Schema is managed by migrations/001_init.sql — don't let GORM create constraints
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		log.Fatalf("database: failed to open: %v", err)
	}

	// Tune the underlying sql.DB connection pool
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("database: failed to get sql.DB: %v", err)
	}
	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(2)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("database: ping failed: %v", err)
	}

	// Auto-apply schema additions on every startup (idempotent)
	migrations := []string{
		// Drop old checks before remapping types that they disallow
		`ALTER TABLE records DROP CONSTRAINT IF EXISTS records_price_check`,
		`ALTER TABLE records DROP CONSTRAINT IF EXISTS records_type_check`,
		// Map known activity_name values before dropping the column
		`DO $$
		BEGIN
		  IF EXISTS (
		    SELECT 1 FROM information_schema.columns
		    WHERE table_schema = 'public' AND table_name = 'records' AND column_name = 'activity_name'
		  ) THEN
		    UPDATE records SET record_type = 'demo'
		    WHERE record_type = 'other' AND activity_name = 'ค่าบริการ Demo ไม้เทนนิส';
		    UPDATE records SET record_type = 'grip'
		    WHERE record_type = 'other' AND activity_name = 'พัน Grip';
		    UPDATE records SET note = CASE
		      WHEN note IS NULL OR note = '' THEN activity_name
		      ELSE activity_name || ' — ' || note
		    END
		    WHERE record_type = 'other'
		      AND activity_name IS NOT NULL
		      AND activity_name <> ''
		      AND activity_name NOT IN ('ค่าบริการ Demo ไม้เทนนิส', 'พัน Grip', 'อื่นๆ');
		  END IF;
		END $$`,
		`ALTER TABLE records ADD CONSTRAINT records_price_check
			CHECK (
				(record_type = 'string' AND price IN (200, 300)) OR
				(record_type = 'sale'   AND price IN (200, 500)) OR
				(record_type IN ('demo', 'grip', 'other') AND price > 0)
			)`,
		`ALTER TABLE records ADD CONSTRAINT records_type_check
			CHECK (record_type IN ('string', 'sale', 'demo', 'grip', 'other'))`,
		`ALTER TABLE records DROP COLUMN IF EXISTS is_new_racket`,
		`ALTER TABLE records DROP COLUMN IF EXISTS type`,
		`ALTER TABLE records DROP COLUMN IF EXISTS activity_name`,
	}
	for _, m := range migrations {
		if err := db.Exec(m).Error; err != nil {
			log.Fatalf("database: migration failed: %v", err)
		}
	}

	log.Println("database: connected (GORM + postgres driver)")
	return db
}
