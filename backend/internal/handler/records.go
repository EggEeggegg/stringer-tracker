package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"stringer-tracker/internal/model"
)

const otherIncomeFilter = "record_type IN ('demo', 'grip', 'other')"

func validateRecordInput(recordType string, price int) string {
	switch recordType {
	case "string":
		if price != 200 && price != 300 {
			return "price must be 200 or 300 for string type"
		}
	case "sale":
		if price != 200 && price != 500 {
			return "price must be 200 or 500 for sale type"
		}
	case "demo", "grip", "other":
		if price <= 0 {
			return "price must be greater than 0"
		}
	default:
		return "record_type must be 'string', 'sale', 'demo', 'grip', or 'other'"
	}
	return ""
}

// GET /api/records?date=YYYY-MM-DD  OR  ?start=&end=
func (h *Handler) ListRecords(c *gin.Context) {
	userID := c.GetString("userID")
	date := c.Query("date")
	start := c.Query("start")
	end := c.Query("end")

	q := h.db.Where("user_id = ?", userID).Order("date DESC, seq ASC")

	switch {
	case date != "":
		q = q.Where("date = ?", date)
	case start != "" && end != "":
		q = q.Where("date BETWEEN ? AND ?", start, end)
	}

	var records []model.Record
	if err := q.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query records"})
		return
	}

	c.JSON(http.StatusOK, records)
}

// POST /api/records
func (h *Handler) CreateRecord(c *gin.Context) {
	userID := c.GetString("userID")

	var input model.CreateRecordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.RecordType == "" {
		input.RecordType = "string"
	}

	if msg := validateRecordInput(input.RecordType, input.Price); msg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}

	if input.RecordType == "grip" {
		kind := model.NormalizeGripKind(input.Racket)
		if kind == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "grip type must be Overgrip, Replacement, or Leather"})
			return
		}
		input.Racket = kind
	}

	parsedDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, expected YYYY-MM-DD"})
		return
	}

	var maxSeq int
	h.db.Model(&model.Record{}).
		Where("user_id = ? AND date = ?", userID, input.Date).
		Select("COALESCE(MAX(seq), 0)").
		Scan(&maxSeq)

	record := model.Record{
		UserID:     userID,
		Date:       parsedDate,
		Seq:        maxSeq + 1,
		RecordType: input.RecordType,
		Racket:     input.Racket,
		String1:    strings.ToUpper(strings.TrimSpace(input.String1)),
		String2:    strings.ToUpper(strings.TrimSpace(input.String2)),
		Price:      input.Price,
		Note:       input.Note,
	}

	if err := h.db.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create record"})
		return
	}

	record.DateStr = record.Date.Format("2006-01-02")
	c.JSON(http.StatusCreated, record)
}

// PUT /api/records/:id
func (h *Handler) UpdateRecord(c *gin.Context) {
	userID := c.GetString("userID")
	id := c.Param("id")

	var input model.UpdateRecordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var record model.Record
	if err := h.db.Where("id = ? AND user_id = ?", id, userID).First(&record).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}

	// Use existing record_type if not provided
	if input.RecordType == "" {
		input.RecordType = record.RecordType
	}

	if msg := validateRecordInput(input.RecordType, input.Price); msg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}

	if input.RecordType == "grip" {
		kind := model.NormalizeGripKind(input.Racket)
		if kind == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "grip type must be Overgrip, Replacement, or Leather"})
			return
		}
		input.Racket = kind
	}

	record.RecordType = input.RecordType
	record.Racket = input.Racket
	record.String1 = strings.ToUpper(strings.TrimSpace(input.String1))
	record.String2 = strings.ToUpper(strings.TrimSpace(input.String2))
	record.Price = input.Price
	record.Note = input.Note

	if err := h.db.Save(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update record"})
		return
	}

	record.DateStr = record.Date.Format("2006-01-02")
	c.JSON(http.StatusOK, record)
}

// DELETE /api/records/:id
func (h *Handler) DeleteRecord(c *gin.Context) {
	userID := c.GetString("userID")
	id := c.Param("id")

	var record model.Record
	if err := h.db.Where("id = ? AND user_id = ?", id, userID).First(&record).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}

	date := record.Date

	if err := h.db.Delete(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete record"})
		return
	}

	h.db.Exec(`
		WITH ranked AS (
			SELECT id, ROW_NUMBER() OVER (ORDER BY seq) AS new_seq
			  FROM records WHERE user_id = ? AND date = ?
		)
		UPDATE records SET seq = ranked.new_seq
		  FROM ranked WHERE records.id = ranked.id
	`, userID, date)

	c.Status(http.StatusNoContent)
}

// GET /api/records/summary/daily?start=&end=
func (h *Handler) DailySummary(c *gin.Context) {
	userID := c.GetString("userID")
	start := c.Query("start")
	end := c.Query("end")

	if start == "" && end == "" {
		today := time.Now().UTC()
		start = today.AddDate(0, 0, -6).Format("2006-01-02")
		end = today.Format("2006-01-02")
	}

	sql := `SELECT date,
	               COUNT(*)::int                                             AS count,
	               SUM(price)::int                                           AS total,
	               COUNT(*) FILTER (WHERE record_type = 'sale')::int         AS sale_count,
	               COALESCE(SUM(price) FILTER (WHERE record_type = 'sale'), 0)::int AS sale_total,
	               COUNT(*) FILTER (WHERE ` + otherIncomeFilter + `)::int        AS other_count,
	               COALESCE(SUM(price) FILTER (WHERE ` + otherIncomeFilter + `), 0)::int AS other_total
	          FROM records WHERE user_id = ?`
	args := []any{userID}

	if start != "" {
		sql += " AND date >= ?"
		args = append(args, start)
	}
	if end != "" {
		sql += " AND date <= ?"
		args = append(args, end)
	}
	sql += " GROUP BY date ORDER BY date DESC"

	var rows []struct {
		Date       time.Time
		Count      int
		Total      int
		SaleCount  int
		SaleTotal  int
		OtherCount int
		OtherTotal int
	}
	if err := h.db.Raw(sql, args...).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query daily summary"})
		return
	}

	result := make([]model.DaySummary, len(rows))
	for i, r := range rows {
		result[i] = model.DaySummary{
			Date:       r.Date.Format("2006-01-02"),
			Count:      r.Count,
			Total:      r.Total,
			SaleCount:  r.SaleCount,
			SaleTotal:  r.SaleTotal,
			OtherCount: r.OtherCount,
			OtherTotal: r.OtherTotal,
		}
	}

	c.JSON(http.StatusOK, result)
}

// GET /api/records/summary/monthly?year=2025
func (h *Handler) MonthlySummary(c *gin.Context) {
	userID := c.GetString("userID")
	year := c.Query("year")

	sql := `SELECT TO_CHAR(date, 'YYYY-MM')                                        AS month,
	               COUNT(*)::int                                                    AS count,
	               SUM(price)::int                                                  AS total,
	               COUNT(*) FILTER (WHERE record_type = 'sale')::int                AS sale_count,
	               COALESCE(SUM(price) FILTER (WHERE record_type = 'sale'), 0)::int AS sale_total,
	               COUNT(*) FILTER (WHERE ` + otherIncomeFilter + `)::int               AS other_count,
	               COALESCE(SUM(price) FILTER (WHERE ` + otherIncomeFilter + `), 0)::int AS other_total
	          FROM records WHERE user_id = ?`
	args := []any{userID}

	if year != "" {
		sql += " AND EXTRACT(YEAR FROM date) = ?"
		args = append(args, year)
	}
	sql += " GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month DESC"

	result := []model.MonthSummary{}
	if err := h.db.Raw(sql, args...).Scan(&result).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query monthly summary"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GET /api/records/export?start=&end=
func (h *Handler) ExportRecordsExcel(c *gin.Context) {
	userID := c.GetString("userID")
	start := c.Query("start")
	end := c.Query("end")

	if start == "" || end == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start and end date are required"})
		return
	}

	q := h.db.Where("user_id = ? AND date BETWEEN ? AND ?", userID, start, end).
		Order("date DESC, seq ASC")

	var records []model.Record
	if err := q.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query records"})
		return
	}

	// Create Excel file
	f := excelize.NewFile()

	// ═══════════════════════════════════════════════════════════════════════════
	// Sheet 1: Summary
	// ═══════════════════════════════════════════════════════════════════════════
	summarySheet := "Summary"
	f.SetSheetName("Sheet1", summarySheet)

	// Header info
	f.SetCellValue(summarySheet, "A1", "บันทึกการขึ้นเอ็น")
	f.SetCellValue(summarySheet, "A2", fmt.Sprintf("ช่วงเวลา: %s ถึง %s", start, end))
	f.SetCellValue(summarySheet, "A3", fmt.Sprintf("สร้างเมื่อ: %s", time.Now().Format("2006-01-02 15:04:05")))

	row := 5

	// Summary stats
	var stringCount int
	var stringTotal int
	var saleCount int
	var saleTotal int
	var otherCount int
	var otherTotal int

	for _, rec := range records {
		if rec.RecordType == "string" || rec.RecordType == "" {
			stringCount++
			stringTotal += rec.Price
		} else if rec.RecordType == "sale" {
			saleCount++
			saleTotal += rec.Price
		} else if model.IsOtherIncome(rec.RecordType) {
			otherCount++
			otherTotal += rec.Price
		}
	}

	f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), "=== สรุป ===")
	row++

	f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), "รวมไม้")
	f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), "รายรับเอ็น")
	f.SetCellValue(summarySheet, fmt.Sprintf("C%d", row), "ขายไม้")
	f.SetCellValue(summarySheet, fmt.Sprintf("D%d", row), "ค่าคอม")
	f.SetCellValue(summarySheet, fmt.Sprintf("E%d", row), "รายได้อื่นๆ")
	f.SetCellValue(summarySheet, fmt.Sprintf("F%d", row), "รายรับรวม")
	row++

	f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), "ไม้")
	f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), "บาท")
	f.SetCellValue(summarySheet, fmt.Sprintf("C%d", row), "ไม้")
	f.SetCellValue(summarySheet, fmt.Sprintf("D%d", row), "บาท")
	f.SetCellValue(summarySheet, fmt.Sprintf("E%d", row), "บาท")
	f.SetCellValue(summarySheet, fmt.Sprintf("F%d", row), "บาท")
	row++

	totalRevenue := stringTotal + saleTotal + otherTotal
	f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), stringCount)
	f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), stringTotal)
	f.SetCellValue(summarySheet, fmt.Sprintf("C%d", row), saleCount)
	f.SetCellValue(summarySheet, fmt.Sprintf("D%d", row), saleTotal)
	f.SetCellValue(summarySheet, fmt.Sprintf("E%d", row), otherTotal)
	f.SetCellValue(summarySheet, fmt.Sprintf("F%d", row), totalRevenue)

	// ═══════════════════════════════════════════════════════════════════════════
	// Sheet 2: Records
	// ═══════════════════════════════════════════════════════════════════════════
	recordsSheet := "Records"
	f.NewSheet(recordsSheet)

	// Header
	row = 1
	f.SetCellValue(recordsSheet, fmt.Sprintf("A%d", row), "วันที่")
	f.SetCellValue(recordsSheet, fmt.Sprintf("B%d", row), "ประเภท")
	f.SetCellValue(recordsSheet, fmt.Sprintf("C%d", row), "ไม้/กิจกรรม")
	f.SetCellValue(recordsSheet, fmt.Sprintf("D%d", row), "String 1")
	f.SetCellValue(recordsSheet, fmt.Sprintf("E%d", row), "String 2")
	f.SetCellValue(recordsSheet, fmt.Sprintf("F%d", row), "ราคา (บาท)")
	f.SetCellValue(recordsSheet, fmt.Sprintf("G%d", row), "-")
	f.SetCellValue(recordsSheet, fmt.Sprintf("H%d", row), "หมายเหตุ")
	row++

	// Data
	for _, rec := range records {
		// วันที่
		f.SetCellValue(recordsSheet, fmt.Sprintf("A%d", row), rec.DateStr)

		// ประเภท
		recordType := rec.RecordType
		if recordType == "" {
			recordType = "string"
		}
		f.SetCellValue(recordsSheet, fmt.Sprintf("B%d", row), model.RecordTypeLabel(recordType))

		// ไม้/กิจกรรม
		name := rec.Racket
		if recordType != "string" {
			name = model.RecordTypeLabel(recordType)
		}
		f.SetCellValue(recordsSheet, fmt.Sprintf("C%d", row), name)

		// String 1
		f.SetCellValue(recordsSheet, fmt.Sprintf("D%d", row), rec.String1)

		// String 2
		f.SetCellValue(recordsSheet, fmt.Sprintf("E%d", row), rec.String2)

		// ราคา
		f.SetCellValue(recordsSheet, fmt.Sprintf("F%d", row), rec.Price)

		// reserved column (legacy)
		f.SetCellValue(recordsSheet, fmt.Sprintf("G%d", row), "")

		// หมายเหตุ
		f.SetCellValue(recordsSheet, fmt.Sprintf("H%d", row), rec.Note)

		row++
	}

	// Generate file bytes
	buf, err := f.WriteToBuffer()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate Excel"})
		return
	}

	// Send Excel file
	filename := fmt.Sprintf("stringer-records-%s-%s.xlsx", start, end)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// GET /api/records/copy-list?start=&end=
func (h *Handler) CopyJobsList(c *gin.Context) {
	userID := c.GetString("userID")
	start := c.Query("start")
	end := c.Query("end")

	if start == "" || end == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start and end date are required"})
		return
	}

	q := h.db.Where("user_id = ? AND date BETWEEN ? AND ?", userID, start, end).
		Order("date ASC, seq ASC")

	var records []model.Record
	if err := q.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query records"})
		return
	}

	type group struct {
		dateKey string
		items   []string
	}
	var groups []group

	for _, rec := range records {
		day := rec.Date.Day()
		month := int(rec.Date.Month())
		dateKey := fmt.Sprintf("%02d/%02d", day, month)

		var existingIdx = -1
		for idx, g := range groups {
			if g.dateKey == dateKey {
				existingIdx = idx
				break
			}
		}

		if existingIdx == -1 {
			groups = append(groups, group{dateKey: dateKey, items: []string{}})
			existingIdx = len(groups) - 1
		}

		name := ""
		if rec.RecordType == "string" || rec.RecordType == "" {
			s1 := strings.TrimSpace(rec.String1)
			s2 := strings.TrimSpace(rec.String2)
			if s1 != "" && s2 != "" {
				name = fmt.Sprintf("%s / %s", s1, s2)
			} else if s1 != "" {
				name = s1
			} else {
				name = s2
			}
		} else if rec.RecordType == "sale" {
			name = "NEW RACKET"
		} else if rec.RecordType == "grip" {
			name = strings.TrimSpace(rec.Racket)
			if name == "" {
				name = "Grip"
			}
		} else {
			name = model.RecordTypeLabel(rec.RecordType)
		}

		if rec.Note != "" {
			name = fmt.Sprintf("%s(%s)", name, rec.Note)
		}

		groups[existingIdx].items = append(groups[existingIdx].items, name)
	}

	var textParts []string
	for _, g := range groups {
		groupText := g.dateKey + "\n" + strings.Join(g.items, "\n")
		textParts = append(textParts, groupText)
	}
	finalText := strings.Join(textParts, "\n")

	c.JSON(http.StatusOK, gin.H{"text": finalText})
}
