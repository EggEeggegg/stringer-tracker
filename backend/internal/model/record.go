package model

import (
	"strings"
	"time"

	"gorm.io/gorm"
)

// Record maps to the `records` table.
//
// The DB stores `date` as PostgreSQL DATE (scans into time.Time).
// We expose it as a YYYY-MM-DD string in JSON via the DateStr virtual field,
// which is populated automatically by the AfterFind GORM hook.
type Record struct {
	ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID     string    `gorm:"column:user_id;type:uuid;not null"              json:"user_id"`
	Date       time.Time `gorm:"column:date;type:date;not null"                 json:"-"`
	DateStr    string    `gorm:"-"                                              json:"date"` // set by AfterFind / handlers
	Seq        int       `gorm:"not null"                                       json:"seq"`
	RecordType string    `gorm:"column:record_type;not null;default:string"     json:"record_type"` // string | sale | demo | grip | other
	Racket     string    `gorm:"not null;size:200;default:''"                   json:"racket"`
	String1    string    `gorm:"column:string1;size:200;default:''"             json:"string1"`
	String2    string    `gorm:"column:string2;size:200;default:''"             json:"string2"`
	Price      int       `gorm:"not null"                                       json:"price"`
	Note       string    `gorm:"default:''"                                     json:"note"`
	CreatedAt  time.Time `                                                       json:"created_at"`
	UpdatedAt  time.Time `                                                       json:"updated_at"`
}

// TableName tells GORM to use "records" explicitly.
func (Record) TableName() string { return "records" }

// AfterFind is a GORM hook that runs after every Find / First / Scan into Record.
// It converts the time.Time Date field into a YYYY-MM-DD string for JSON output.
func (r *Record) AfterFind(_ *gorm.DB) error {
	r.DateStr = r.Date.Format("2006-01-02")
	return nil
}

// RecordTypeLabel returns the Thai display label for a record_type value.
func RecordTypeLabel(recordType string) string {
	switch recordType {
	case "sale":
		return "ค่าคอมขายไม้"
	case "demo":
		return "ค่าบริการ Demo ไม้เทนนิส"
	case "grip":
		return "พัน Grip"
	case "other":
		return "อื่นๆ"
	default:
		return "ขึ้นเอ็น"
	}
}

// IsOtherIncome reports whether the type rolls into the other-income summary bucket.
func IsOtherIncome(recordType string) bool {
	return recordType == "demo" || recordType == "grip" || recordType == "other"
}

// NormalizeGripKind returns the canonical grip label, or empty if invalid.
func NormalizeGripKind(value string) string {
	switch strings.TrimSpace(value) {
	case "Overgrip", "Replacement", "Leather":
		return strings.TrimSpace(value)
	default:
		return ""
	}
}

// ─── Input types ──────────────────────────────────────────────────────────────

// CreateRecordInput is the request body for POST /api/records.
type CreateRecordInput struct {
	Date       string `json:"date"          binding:"required"`
	RecordType string `json:"record_type"`
	Racket     string `json:"racket"`
	String1    string `json:"string1"`
	String2    string `json:"string2"`
	Price      int    `json:"price"         binding:"required,min=1"`
	Note       string `json:"note"`
}

// UpdateRecordInput is the request body for PUT /api/records/:id.
type UpdateRecordInput struct {
	RecordType string `json:"record_type"`
	Racket     string `json:"racket"`
	String1    string `json:"string1"`
	String2    string `json:"string2"`
	Price      int    `json:"price"         binding:"required,min=1"`
	Note       string `json:"note"`
}

// ─── Summary types ────────────────────────────────────────────────────────────

// DaySummary is returned by GET /api/records/summary/daily.
type DaySummary struct {
	Date       string `json:"date"`
	Count      int    `json:"count"`
	Total      int    `json:"total"`       // รายได้รวมทุกประเภท
	SaleCount  int    `json:"sale_count"`  // จำนวนรายการค่าคอมขายไม้
	SaleTotal  int    `json:"sale_total"`  // ยอดค่าคอมขายไม้
	OtherCount int    `json:"other_count"` // จำนวนรายได้อื่นๆ (demo/grip/other)
	OtherTotal int    `json:"other_total"` // ยอดรายได้อื่นๆ
}

// MonthSummary is returned by GET /api/records/summary/monthly.
type MonthSummary struct {
	Month      string `json:"month"`
	Count      int    `json:"count"`
	Total      int    `json:"total"`
	SaleCount  int    `json:"sale_count"`
	SaleTotal  int    `json:"sale_total"`
	OtherCount int    `json:"other_count"`
	OtherTotal int    `json:"other_total"`
}
