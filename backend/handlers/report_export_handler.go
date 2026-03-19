package handlers

import (
	"context"
	"encoding/csv"
	"finance-tracker/config"
	"finance-tracker/utils"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
)

// ExportCSV exports all transactions for a year to CSV
func ExportCSV(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	yearStr := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))
	year, _ := strconv.Atoi(yearStr)

	query := `
		SELECT t.transaction_date, t.description, c.name, t.type, t.amount 
		FROM transactions t
		JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1 AND EXTRACT(YEAR FROM t.transaction_date) = $2
		ORDER BY t.transaction_date DESC
	`

	rows, err := config.DB.Query(context.Background(), query, userID, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}
	defer rows.Close()

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment;filename=finance_report_%d.csv", year))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"Date", "Description", "Category", "Type", "Amount"})

	for rows.Next() {
		var date time.Time
		var desc, cat, ttype string
		var amount float64
		if err := rows.Scan(&date, &desc, &cat, &ttype, &amount); err != nil {
			continue
		}
		writer.Write([]string{
			date.Format("2006-01-02"),
			desc,
			cat,
			ttype,
			fmt.Sprintf("%.2f", amount),
		})
	}
}

// ExportPDF generates a styled PDF report for a year
func ExportPDF(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	yearStr := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))
	year, _ := strconv.Atoi(yearStr)

	// Fetch User Info
	var userName string
	config.DB.QueryRow(context.Background(), "SELECT name FROM users WHERE id = $1", userID).Scan(&userName)

	// Fetch Summary
	var totalIncome, totalExpense float64
	summaryQuery := `
		SELECT 
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0),
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0)
		FROM transactions
		WHERE user_id = $1 AND EXTRACT(YEAR FROM transaction_date) = $2
	`
	config.DB.QueryRow(context.Background(), summaryQuery, userID, year).Scan(&totalIncome, &totalExpense)

	// Fetch Month Data
	rows, _ := config.DB.Query(context.Background(), `
		SELECT 
			EXTRACT(MONTH FROM transaction_date)::int AS month,
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0),
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0)
		FROM transactions
		WHERE user_id = $1 AND EXTRACT(YEAR FROM transaction_date) = $2
		GROUP BY month ORDER BY month
	`, userID, year)
	defer rows.Close()

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Colors & Styles
	pdf.SetFillColor(240, 240, 240)
	pdf.SetTextColor(30, 41, 59)

	// Title
	pdf.SetFont("Arial", "B", 24)
	pdf.CellFormat(0, 20, "Financial Report", "", 1, "C", false, 0, "")

	// Subtitle
	pdf.SetFont("Arial", "", 12)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(0, 10, fmt.Sprintf("User: %s | Year: %d", userName, year), "", 1, "C", false, 0, "")
	pdf.Ln(10)

	// Summary Box
	pdf.SetFillColor(16, 185, 129) // Emerald 500
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 14)
	pdf.CellFormat(0, 12, "  Annual Summary", "1", 1, "L", true, 0, "")

	pdf.SetTextColor(30, 41, 59)
	pdf.SetFont("Arial", "", 11)
	pdf.SetFillColor(255, 255, 255)
	pdf.CellFormat(95, 10, "  Total Income:", "1", 0, "L", true, 0, "")
	pdf.SetTextColor(16, 185, 129)
	pdf.CellFormat(95, 10, fmt.Sprintf("  Rp %s", utils.FormatMoney(totalIncome)), "1", 1, "R", true, 0, "")

	pdf.SetTextColor(30, 41, 59)
	pdf.CellFormat(95, 10, "  Total Expense:", "1", 0, "L", true, 0, "")
	pdf.SetTextColor(239, 68, 68)
	pdf.CellFormat(95, 10, fmt.Sprintf("  Rp %s", utils.FormatMoney(totalExpense)), "1", 1, "R", true, 0, "")

	pdf.SetTextColor(30, 41, 59)
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(95, 10, "  Net Balance:", "1", 0, "L", true, 0, "")
	balance := totalIncome - totalExpense
	if balance >= 0 {
		pdf.SetTextColor(16, 185, 129)
	} else {
		pdf.SetTextColor(239, 68, 68)
	}
	pdf.CellFormat(95, 10, fmt.Sprintf("  Rp %s", utils.FormatMoney(balance)), "1", 1, "R", true, 0, "")
	pdf.Ln(15)

	// Monthly Breakdown Table Header
	pdf.SetTextColor(30, 41, 59)
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(0, 10, "Monthly Breakdown", "", 1, "L", false, 0, "")
	pdf.SetFillColor(226, 232, 240)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(60, 10, "Month", "1", 0, "C", true, 0, "")
	pdf.CellFormat(65, 10, "Income", "1", 0, "C", true, 0, "")
	pdf.CellFormat(65, 10, "Expense", "1", 1, "C", true, 0, "")

	pdf.SetFont("Arial", "", 10)
	months := [13]string{"", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"}
	
	monthData := make(map[int][2]float64)
	for rows.Next() {
		var m int
		var inc, exp float64
		rows.Scan(&m, &inc, &exp)
		monthData[m] = [2]float64{inc, exp}
	}

	for i := 1; i <= 12; i++ {
		inc := monthData[i][0]
		exp := monthData[i][1]
		pdf.CellFormat(60, 8, months[i], "1", 0, "L", false, 0, "")
		pdf.CellFormat(65, 8, fmt.Sprintf("Rp %s", utils.FormatMoney(inc)), "1", 0, "R", false, 0, "")
		pdf.CellFormat(65, 8, fmt.Sprintf("Rp %s", utils.FormatMoney(exp)), "1", 1, "R", false, 0, "")
	}

	pdf.Ln(20)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(148, 163, 184)
	pdf.CellFormat(0, 10, fmt.Sprintf("Generated by Finance Tracker on %s", time.Now().Format("2006-01-02 15:04")), "", 1, "C", false, 0, "")

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("attachment;filename=finance_report_%d.pdf", year))
	pdf.Output(c.Writer)
}
