package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
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
		// Schema is managed by migrations/*.sql — don't let GORM create constraints
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

	if _, err := ApplySQLFiles(db); err != nil {
		log.Fatalf("database: sql migrations failed: %v", err)
	}

	if err := applyStartupFixes(db); err != nil {
		log.Fatalf("database: migration failed: %v", err)
	}

	log.Println("database: connected (GORM + postgres driver)")
	return db
}

// ApplySQLFiles runs backend/migrations/*.sql in name order (idempotent CREATE/ALTER).
func ApplySQLFiles(db *gorm.DB) ([]string, error) {
	dir, err := findMigrationsDir()
	if err != nil {
		return nil, err
	}

	files, err := filepath.Glob(filepath.Join(dir, "*.sql"))
	if err != nil {
		return nil, fmt.Errorf("list migrations: %w", err)
	}
	if len(files) == 0 {
		return nil, fmt.Errorf("no migration files found in %s", dir)
	}
	sort.Strings(files)

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	applied := make([]string, 0, len(files))
	for _, f := range files {
		sql, err := os.ReadFile(f)
		if err != nil {
			return applied, fmt.Errorf("read %s: %w", f, err)
		}
		if _, err := sqlDB.Exec(string(sql)); err != nil {
			return applied, fmt.Errorf("%s: %w", filepath.Base(f), err)
		}
		applied = append(applied, f)
		log.Printf("database: applied %s", filepath.Base(f))
	}
	return applied, nil
}

func findMigrationsDir() (string, error) {
	candidates := []string{"migrations"}
	if exe, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Join(filepath.Dir(exe), "migrations"))
	}
	if wd, err := os.Getwd(); err == nil {
		candidates = append(candidates, filepath.Join(wd, "migrations"))
	}

	seen := map[string]struct{}{}
	for _, dir := range candidates {
		if dir == "" {
			continue
		}
		if _, ok := seen[dir]; ok {
			continue
		}
		seen[dir] = struct{}{}
		matches, _ := filepath.Glob(filepath.Join(dir, "*.sql"))
		if len(matches) > 0 {
			return dir, nil
		}
	}
	return "", fmt.Errorf("no migration files found (looked in migrations/ next to the process)")
}

func recordsTableExists(db *gorm.DB) (bool, error) {
	var exists bool
	err := db.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.tables
			WHERE table_schema = 'public' AND table_name = 'records'
		)
	`).Scan(&exists).Error
	return exists, err
}

// applyStartupFixes updates an existing records table. Skipped on empty databases
// so a missing table no longer crashes the process.
func applyStartupFixes(db *gorm.DB) error {
	exists, err := recordsTableExists(db)
	if err != nil {
		return err
	}
	if !exists {
		log.Println("database: records table missing after sql migrations; skipping startup alters")
		return nil
	}

	migrations := []string{
		`ALTER TABLE records DROP CONSTRAINT IF EXISTS records_price_check`,
		`ALTER TABLE records DROP CONSTRAINT IF EXISTS records_type_check`,
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
			return err
		}
	}
	return nil
}
