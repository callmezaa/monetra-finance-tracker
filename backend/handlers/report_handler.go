package handlers

import (
	"context"
	"finance-tracker/config"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// MonthlyData represents income/expense per month
type MonthlyData struct {
	Month       int     `json:"month"`
	MonthName   string  `json:"month_name"`
	Income      float64 `json:"income"`
	Expense     float64 `json:"expense"`
	Balance     float64 `json:"balance"`
	IncomeCount int     `json:"income_count"`
	ExpenseCount int    `json:"expense_count"`
}

// CategoryData represents spending/income by category
type CategoryData struct {
	CategoryID   int     `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Type         string  `json:"type"`
	Total        float64 `json:"total"`
	Count        int     `json:"count"`
	Percentage   float64 `json:"percentage"`
}

// YearSummary represents overall year stats
type YearSummary struct {
	Year         int     `json:"year"`
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	Balance      float64 `json:"balance"`
	AvgIncome    float64 `json:"avg_income"`
	AvgExpense   float64 `json:"avg_expense"`
}

var monthNames = []string{"", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"}

// GetMonthlyReport returns income/expense per month for a given year
func GetMonthlyReport(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	yearStr := c.DefaultQuery("year", "2025")
	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 2000 || year > 2100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year"})
		return
	}

	query := `
		SELECT 
			EXTRACT(MONTH FROM transaction_date)::int AS month,
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense,
			COUNT(CASE WHEN type = 'income' THEN 1 END) AS income_count,
			COUNT(CASE WHEN type = 'expense' THEN 1 END) AS expense_count
		FROM transactions
		WHERE user_id = $1 AND EXTRACT(YEAR FROM transaction_date) = $2
		GROUP BY EXTRACT(MONTH FROM transaction_date)
		ORDER BY month
	`

	rows, err := config.DB.Query(context.Background(), query, userID, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch report"})
		return
	}
	defer rows.Close()

	var result []MonthlyData
	for rows.Next() {
		var m MonthlyData
		err := rows.Scan(&m.Month, &m.Income, &m.Expense, &m.IncomeCount, &m.ExpenseCount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read report data"})
			return
		}
		m.MonthName = monthNames[m.Month]
		m.Balance = m.Income - m.Expense
		result = append(result, m)
	}

	// Ensure all 12 months exist (fill zeros for empty months)
	monthMap := make(map[int]MonthlyData)
	for _, m := range result {
		monthMap[m.Month] = m
	}
	final := make([]MonthlyData, 0, 12)
	for i := 1; i <= 12; i++ {
		if m, ok := monthMap[i]; ok {
			final = append(final, m)
		} else {
			final = append(final, MonthlyData{Month: i, MonthName: monthNames[i], Income: 0, Expense: 0, Balance: 0})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"year":   year,
		"months": final,
	})
}

// GetByCategory returns spending/income breakdown by category
func GetByCategory(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	yearStr := c.DefaultQuery("year", "2025")
	typeFilter := c.DefaultQuery("type", "expense") // income or expense

	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 2000 || year > 2100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year"})
		return
	}

	if typeFilter != "income" && typeFilter != "expense" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Type must be income or expense"})
		return
	}

	query := `
		SELECT 
			c.id AS category_id,
			c.name AS category_name,
			c.type,
			COALESCE(SUM(t.amount), 0) AS total,
			COUNT(t.id)::int AS count
		FROM categories c
		LEFT JOIN transactions t ON t.category_id = c.id 
			AND t.user_id = c.user_id 
			AND t.type = c.type
			AND EXTRACT(YEAR FROM t.transaction_date) = $2
		WHERE c.user_id = $1 AND c.type = $3
		GROUP BY c.id, c.name, c.type
		HAVING COALESCE(SUM(t.amount), 0) > 0
		ORDER BY total DESC
	`

	rows, err := config.DB.Query(context.Background(), query, userID, year, typeFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch report"})
		return
	}
	defer rows.Close()

	var result []CategoryData
	var totalSum float64

	for rows.Next() {
		var cat CategoryData
		err := rows.Scan(&cat.CategoryID, &cat.CategoryName, &cat.Type, &cat.Total, &cat.Count)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read report data"})
			return
		}
		totalSum += cat.Total
		result = append(result, cat)
	}

	// Calculate percentage
	for i := range result {
		if totalSum > 0 {
			result[i].Percentage = (result[i].Total / totalSum) * 100
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"year":      year,
		"type":      typeFilter,
		"total":     totalSum,
		"categories": result,
	})
}

// GetYearSummary returns overall summary for a year
func GetYearSummary(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	yearStr := c.DefaultQuery("year", "2025")
	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 2000 || year > 2100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year"})
		return
	}

	query := `
		SELECT 
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS total_income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expense
		FROM transactions
		WHERE user_id = $1 AND EXTRACT(YEAR FROM transaction_date) = $2
	`

	var totalIncome, totalExpense float64
	err = config.DB.QueryRow(context.Background(), query, userID, year).
		Scan(&totalIncome, &totalExpense)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch summary"})
		return
	}

	var monthCount int
	config.DB.QueryRow(context.Background(),
		`SELECT COALESCE(COUNT(DISTINCT EXTRACT(MONTH FROM transaction_date))::int, 1) 
		 FROM transactions WHERE user_id = $1 AND EXTRACT(YEAR FROM transaction_date) = $2`,
		userID, year,
	).Scan(&monthCount)
	if monthCount == 0 {
		monthCount = 1
	}

	c.JSON(http.StatusOK, YearSummary{
		Year:         year,
		TotalIncome:  totalIncome,
		TotalExpense: totalExpense,
		Balance:      totalIncome - totalExpense,
		AvgIncome:    totalIncome / float64(monthCount),
		AvgExpense:   totalExpense / float64(monthCount),
	})
}

func getUserID(c *gin.Context) (int, error) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return 0, http.ErrNoCookie
	}
	return userIDInterface.(int), nil
}
