package handlers

import (
	"context"
	"finance-tracker/config"
	"finance-tracker/models"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// CreateGoal
func CreateGoal(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	var input models.GoalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input schema"})
		return
	}

	query := `
		INSERT INTO goals (user_id, name, target_amount, current_amount, deadline)
		VALUES ($1, $2, $3, 0, $4) RETURNING id, created_at
	`

	var deadlinePtr *time.Time
	if input.Deadline != nil && *input.Deadline != "" {
		parsedTime, parseErr := time.Parse("2006-01-02", *input.Deadline)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
			return
		}
		deadlinePtr = &parsedTime
	}

	var goal models.Goal
	err := config.DB.QueryRow(
		context.Background(),
		query,
		userID, input.Name, input.TargetAmount, deadlinePtr,
	).Scan(&goal.ID, &goal.CreatedAt)

	if err != nil {
		fmt.Println("DB Insert Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create goal"})
		return
	}

	goal.UserID = userID
	goal.Name = input.Name
	goal.TargetAmount = input.TargetAmount
	goal.CurrentAmount = 0
	goal.Deadline = deadlinePtr

	c.JSON(http.StatusCreated, goal)
}

// GetGoals
func GetGoals(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	query := `
		SELECT id, user_id, name, target_amount, current_amount, deadline, created_at
		FROM goals
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := config.DB.Query(context.Background(), query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch goals"})
		return
	}
	defer rows.Close()

	var goals []models.Goal

	for rows.Next() {
		var g models.Goal
		if err := rows.Scan(&g.ID, &g.UserID, &g.Name, &g.TargetAmount, &g.CurrentAmount, &g.Deadline, &g.CreatedAt); err != nil {
			fmt.Println("Error scanning goal:", err)
			continue
		}
		goals = append(goals, g)
	}

	c.JSON(http.StatusOK, goals)
}

// AddSavingToGoal
func AddSavingToGoal(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)
	goalID := c.Param("id")

	var input models.GoalAddSavingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// First verify the goal exists and belongs to the user
	checkQuery := `SELECT current_amount, target_amount FROM goals WHERE id = $1 AND user_id = $2`
	var currentAmount, targetAmount float64
	err := config.DB.QueryRow(context.Background(), checkQuery, goalID, userID).Scan(&currentAmount, &targetAmount)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
		return
	}

	// Optional: Check if the new amount exceeds the target
	// if currentAmount + input.Amount > targetAmount {
	//    Here you might allow it, or clamp it, or throw an error.
	//    We will just add it blindly for now, meaning it can exceed 100%.
	// }

	updateQuery := `
		UPDATE goals
		SET current_amount = current_amount + $1
		WHERE id = $2 AND user_id = $3
		RETURNING id, current_amount
	`

	var updatedAmount float64
	var id int
	err = config.DB.QueryRow(context.Background(), updateQuery, input.Amount, goalID, userID).Scan(&id, &updatedAmount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update savings"})
		return
	}

	// Trigger goal reached notification
	go func() {
		var goalName string
		err := config.DB.QueryRow(context.Background(), "SELECT name FROM goals WHERE id = $1", goalID).Scan(&goalName)
		if err == nil && currentAmount < targetAmount && updatedAmount >= targetAmount {
			msg := fmt.Sprintf("Selamat! Target tabungan lo untuk %s sudah tercapai (Rp %s / Rp %s). Kerjaan bagus! 🎉", 
				goalName, 
				fmt.Sprintf("%.0f", updatedAmount), 
				fmt.Sprintf("%.0f", targetAmount),
			)
			CreateInternalNotification(userID, "goal_reached", msg)
		}
	}()

	// You could optionally create a transaction for this saving, 
	// but currently the requirements assume it's just a separate tracker.

	c.JSON(http.StatusOK, gin.H{
		"message": "Savings added successfully",
		"id": id,
		"current_amount": updatedAmount,
	})
}

// DeleteGoal
func DeleteGoal(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	goalID := c.Param("id")

	query := `DELETE FROM goals WHERE id = $1 AND user_id = $2`
	result, err := config.DB.Exec(context.Background(), query, goalID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete goal"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Goal deleted"})
}
