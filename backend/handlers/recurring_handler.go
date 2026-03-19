package handlers

import (
	"context"
	"finance-tracker/config"
	"finance-tracker/models"
	"finance-tracker/utils"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// GetRecurringTransactions returns all recurring transactions for the user
func GetRecurringTransactions(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	query := `
		SELECT r.id, r.user_id, r.description, r.amount, r.category_id, c.name, r.type, 
		       r.frequency, r.day_of_month, r.next_occurrence, r.is_active, r.auto_add, r.created_at
		FROM recurring_transactions r
		JOIN categories c ON r.category_id = c.id
		WHERE r.user_id = $1
		ORDER BY r.created_at DESC
	`

	rows, err := config.DB.Query(context.Background(), query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recurring transactions"})
		return
	}
	defer rows.Close()

	var result []models.RecurringTransaction
	for rows.Next() {
		var r models.RecurringTransaction
		err := rows.Scan(&r.ID, &r.UserID, &r.Description, &r.Amount, &r.CategoryID, &r.CategoryName,
			&r.Type, &r.Frequency, &r.DayOfMonth, &r.NextOccurrence, &r.IsActive, &r.AutoAdd, &r.CreatedAt)
		if err != nil {
			continue
		}
		result = append(result, r)
	}

	c.JSON(http.StatusOK, result)
}

// CreateRecurringTransaction adds a new recurring transaction
func CreateRecurringTransaction(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	var input models.RecurringInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate next occurrence
	now := time.Now()
	nextDate := time.Date(now.Year(), now.Month(), input.DayOfMonth, 0, 0, 0, 0, time.Local)
	if nextDate.Before(now) {
		nextDate = nextDate.AddDate(0, 1, 0)
	}

	var id int
	query := `
		INSERT INTO recurring_transactions (user_id, description, amount, category_id, type, frequency, day_of_month, next_occurrence, auto_add)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`
	err = config.DB.QueryRow(context.Background(), query,
		userID, input.Description, input.Amount, input.CategoryID, input.Type, input.Frequency, input.DayOfMonth, nextDate, input.AutoAdd).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create recurring transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "message": "Recurring transaction created successfully"})
}

// ToggleRecurringTransaction activates/deactivates a recurring item
func ToggleRecurringTransaction(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	id := c.Param("id")
	var isActive bool
	err = config.DB.QueryRow(context.Background(),
		"UPDATE recurring_transactions SET is_active = NOT is_active WHERE id = $1 AND user_id = $2 RETURNING is_active",
		id, userID).Scan(&isActive)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"is_active": isActive})
}

// DeleteRecurringTransaction removes a recurring item
func DeleteRecurringTransaction(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	id := c.Param("id")
	_, err = config.DB.Exec(context.Background(), "DELETE FROM recurring_transactions WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

// ProcessRecurringCheck checks and processes due recurring transactions for a user
func ProcessRecurringCheck(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	count, err := RunRecurringAutomation(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to run automation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"processed_count": count})
}

// RunRecurringAutomation internal logic
func RunRecurringAutomation(userID int) (int, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)

	query := `
		SELECT id, description, amount, category_id, type, next_occurrence, auto_add
		FROM recurring_transactions
		WHERE user_id = $1 AND is_active = TRUE AND next_occurrence <= $2
	`

	rows, err := config.DB.Query(context.Background(), query, userID, today)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	processedCount := 0
	for rows.Next() {
		var r models.RecurringTransaction
		err := rows.Scan(&r.ID, &r.Description, &r.Amount, &r.CategoryID, &r.Type, &r.NextOccurrence, &r.AutoAdd)
		if err != nil {
			continue
		}

		if r.AutoAdd {
			// 1. Add to transactions
			_, err = config.DB.Exec(context.Background(),
				"INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date) VALUES ($1, $2, $3, $4, $5, $6)",
				userID, r.CategoryID, r.Amount, r.Type, r.Description + " (Recurring)", r.NextOccurrence)
			
			// 2. Create notification
			CreateInternalNotification(userID, "recurring_processed", 
				fmt.Sprintf("Transaksi otomatis ditambahkan: %s sebesar Rp %s", r.Description, utils.FormatMoney(r.Amount)))
		} else {
			// Reminder only
			CreateInternalNotification(userID, "recurring_reminder", 
				fmt.Sprintf("Pengingat: Tagihan %s sebesar Rp %s jatuh tempo hari ini.", r.Description, utils.FormatMoney(r.Amount)))
		}

		// Update next occurrence
		newNext := r.NextOccurrence.AddDate(0, 1, 0)
		config.DB.Exec(context.Background(), "UPDATE recurring_transactions SET next_occurrence = $1 WHERE id = $2", newNext, r.ID)
		
		processedCount++
	}

	return processedCount, nil
}
