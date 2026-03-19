package handlers

import (
	"context"
	"finance-tracker/config"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Dashboard(c *gin.Context) {

	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userID := userIDInterface.(int)

	var totalIncome float64
	var totalExpense float64

	query := `
	SELECT 
		COALESCE(SUM(CASE WHEN type='income' THEN amount END),0),
		COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0)
	FROM transactions
	WHERE user_id=$1
	`

	err := config.DB.QueryRow(context.Background(), query, userID).
		Scan(&totalIncome, &totalExpense)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dashboard data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_income":  totalIncome,
		"total_expense": totalExpense,
		"balance":       totalIncome - totalExpense,
	})
}