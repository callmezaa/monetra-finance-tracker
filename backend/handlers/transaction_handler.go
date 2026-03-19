package handlers

import (
	"context"
	"finance-tracker/config"
	"finance-tracker/models"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type TransactionInput struct {
	CategoryID      int     `json:"category_id"`
	Amount          float64 `json:"amount"`
	Type            string  `json:"type"` // income / expense
	Description     string  `json:"description"`
	TransactionDate string  `json:"transaction_date"` // YYYY-MM-DD
}

// CREATE TRANSACTION
func CreateTransaction(c *gin.Context) {

	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID := userIDInterface.(int)

	var input TransactionInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if input.Type != "income" && input.Type != "expense" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Type must be income or expense"})
		return
	}

	if input.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be greater than 0"})
		return
	}

	tDate, err := time.Parse("2006-01-02", input.TransactionDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format (YYYY-MM-DD)"})
		return
	}

	// cek category milik user
	var tmp int
	err = config.DB.QueryRow(
		context.Background(),
		`SELECT id FROM categories
		 WHERE id=$1 AND user_id=$2`,
		input.CategoryID,
		userID,
	).Scan(&tmp)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category does not exist"})
		return
	}

	query := `
	INSERT INTO transactions
	(user_id, category_id, amount, type, description, transaction_date)
	VALUES ($1,$2,$3,$4,$5,$6)
	RETURNING id
	`

	var txID int

	err = config.DB.QueryRow(
		context.Background(),
		query,
		userID,
		input.CategoryID,
		input.Amount,
		input.Type,
		input.Description,
		tDate,
	).Scan(&txID)

	// Trigger budget notification for expense
	if input.Type == "expense" {
		go func() {
			var budgetAmount float64
			var categoryName string
			err := config.DB.QueryRow(
				context.Background(),
				"SELECT amount, name FROM budgets JOIN categories ON budgets.category_id = categories.id WHERE budgets.category_id = $1 AND budgets.user_id = $2",
				input.CategoryID, userID,
			).Scan(&budgetAmount, &categoryName)

			if err == nil {
				// Calculate total expenses for this category this month
				var totalSpent float64
				now := time.Now()
				startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
				
				config.DB.QueryRow(
					context.Background(),
					"SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE category_id = $1 AND user_id = $2 AND transaction_date >= $3 AND type = 'expense'",
					input.CategoryID, userID, startOfMonth,
				).Scan(&totalSpent)

				if totalSpent > budgetAmount {
					msg := fmt.Sprintf("Waduh! Pengeluaran di kategori %s sudah melebihi anggaran (Rp %s > Rp %s)", 
						categoryName, 
						fmt.Sprintf("%.0f", totalSpent), 
						fmt.Sprintf("%.0f", budgetAmount),
					)
					CreateInternalNotification(userID, "budget_alert", msg)
				}
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction created",
		"id":      txID,
	})
}

// GET TRANSACTIONS
func GetTransactions(c *gin.Context) {

	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID := userIDInterface.(int)

	month := c.Query("month")
	year := c.Query("year")

	query := `
	SELECT id, category_id, amount, type, description,
	transaction_date, created_at
	FROM transactions
	WHERE user_id=$1
	`

	args := []interface{}{userID}

	if month != "" && year != "" {

		m, err1 := strconv.Atoi(month)
		y, err2 := strconv.Atoi(year)

		if err1 != nil || err2 != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Month and year must be numbers"})
			return
		}

		query += " AND EXTRACT(MONTH FROM transaction_date)=$2 AND EXTRACT(YEAR FROM transaction_date)=$3"

		args = append(args, m, y)
	}

	query += " ORDER BY transaction_date DESC"

	rows, err := config.DB.Query(context.Background(), query, args...)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}

	defer rows.Close()

	var transactions []models.Transaction

	for rows.Next() {

		var tx models.Transaction

		err := rows.Scan(
			&tx.ID,
			&tx.CategoryID,
			&tx.Amount,
			&tx.Type,
			&tx.Description,
			&tx.TransactionDate,
			&tx.CreatedAt,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading transaction data"})
			return
		}

		transactions = append(transactions, tx)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Row iteration error"})
		return
	}

	c.JSON(http.StatusOK, transactions)
}

// DELETE TRANSACTION
func DeleteTransaction(c *gin.Context) {

	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID := userIDInterface.(int)

	txID := c.Param("id")

	var tmp int

	err := config.DB.QueryRow(
		context.Background(),
		`SELECT id FROM transactions
		 WHERE id=$1 AND user_id=$2`,
		txID,
		userID,
	).Scan(&tmp)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	_, err = config.DB.Exec(
		context.Background(),
		`DELETE FROM transactions
		 WHERE id=$1 AND user_id=$2`,
		txID,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction deleted",
	})
}