package handlers

import (
	"context"
	"finance-tracker/config"
	"finance-tracker/models"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetNotifications(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	rows, err := config.DB.Query(
		context.Background(),
		"SELECT id, user_id, type, message, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}
	defer rows.Close()

	notifications := []models.Notification{}
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Message, &n.IsRead, &n.CreatedAt); err != nil {
			fmt.Println("Error scanning notification:", err)
			continue
		}
		notifications = append(notifications, n)
	}

	c.JSON(http.StatusOK, notifications)
}

func MarkNotificationAsRead(c *gin.Context) {
	id := c.Param("id")
	userIDInterface, _ := c.Get("userID")
	userID := userIDInterface.(int)

	_, err := config.DB.Exec(
		context.Background(),
		"UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
		id, userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

func MarkAllNotificationsAsRead(c *gin.Context) {
	userIDInterface, _ := c.Get("userID")
	userID := userIDInterface.(int)

	_, err := config.DB.Exec(
		context.Background(),
		"UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

// Internal helper to create a notification
func CreateInternalNotification(userID int, notifType, message string) {
	_, err := config.DB.Exec(
		context.Background(),
		"INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)",
		userID, notifType, message,
	)
	if err != nil {
		fmt.Printf("Error creating internal notification for user %d: %v\n", userID, err)
	}
}
