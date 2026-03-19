package handlers

import (
	"context"
	"finance-tracker/config"
	"finance-tracker/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// CREATE BUDGET
func CreateBudget(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userID := userIDInterface.(int)

	var input models.BudgetInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if input.CategoryID == 0 || input.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid budget data. CategoryID and Amount are required."})
		return
	}

	// Default to current month/year if not provided
	if input.Month == 0 || input.Year == 0 {
		now := time.Now()
		input.Month = int(now.Month())
		input.Year = now.Year()
	}

	var budgetID int
	// Use ON CONFLICT to update amount if a budget already exists for the same user, category, month, and year
	// Note: This requires a unique constraint on (user_id, category_id, month, year) in the postgres database
	// Assuming no constraint for now, so just insert. If the user wants unique budgets per month/category, we should handle it.
	
	// Lets first check if a budget already exists for this category/month/year
	var existingID int
	err := config.DB.QueryRow(
		context.Background(),
		`SELECT id FROM budgets 
		 WHERE user_id=$1 AND category_id=$2 AND month=$3 AND year=$4`,
		userID, input.CategoryID, input.Month, input.Year,
	).Scan(&existingID)

	if err == nil && existingID > 0 {
		// Update existing budget
		_, err = config.DB.Exec(
			context.Background(),
			`UPDATE budgets SET amount=$1 WHERE id=$2`,
			input.Amount, existingID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update existing budget"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Budget updated", "id": existingID})
		return
	}

	// Insert new budget
	err = config.DB.QueryRow(
		context.Background(),
		`INSERT INTO budgets (user_id, category_id, amount, month, year)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id`,
		userID,
		input.CategoryID,
		input.Amount,
		input.Month,
		input.Year,
	).Scan(&budgetID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Budget creation failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Budget created",
		"id":      budgetID,
	})
}

// GET BUDGETS
func GetBudgets(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userID := userIDInterface.(int)

	// Get month/year from query, default to current
	now := time.Now()
	monthStr := c.DefaultQuery("month", strconv.Itoa(int(now.Month())))
	yearStr := c.DefaultQuery("year", strconv.Itoa(now.Year()))

	month, err := strconv.Atoi(monthStr)
	if err != nil {
		month = int(now.Month())
	}
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		year = now.Year()
	}

	query := `
		SELECT 
			b.id, b.category_id, c.name as category_name, b.amount as limit_amount,
			COALESCE(SUM(t.amount), 0) as spent, b.month, b.year
		FROM budgets b
		JOIN categories c ON b.category_id = c.id
		LEFT JOIN transactions t ON t.category_id = b.category_id 
								 AND t.user_id = b.user_id
								 AND EXTRACT(MONTH FROM t.transaction_date) = b.month
								 AND EXTRACT(YEAR FROM t.transaction_date) = b.year
								 AND t.type = 'expense'
		WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
		GROUP BY b.id, c.name
		ORDER BY b.id DESC
	`

	rows, err := config.DB.Query(context.Background(), query, userID, month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch budgets"})
		return
	}
	defer rows.Close()

	var budgets []models.Budget

	for rows.Next() {
		var b models.Budget
		err := rows.Scan(
			&b.ID,
			&b.CategoryID,
			&b.CategoryName,
			&b.Amount,
			&b.Spent,
			&b.Month,
			&b.Year,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan budget row"})
			return
		}
		budgets = append(budgets, b)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Row iteration error"})
		return
	}

	c.JSON(http.StatusOK, budgets)
}

// DELETE BUDGET
func DeleteBudget(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userID := userIDInterface.(int)
	budgetID := c.Param("id")

	result, err := config.DB.Exec(
		context.Background(),
		`DELETE FROM budgets WHERE id=$1 AND user_id=$2`,
		budgetID, userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete budget"})
		return
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Budget not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Budget deleted successfully"})
}
