package handlers

import (
	"context"
	"finance-tracker/config"
	"finance-tracker/models"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// GET PROFILE
func GetProfile(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userID := userIDInterface.(int)

	var user models.User
	query := `SELECT id, name, email, profile_picture, email_notifications, monthly_reports FROM users WHERE id = $1`

	err := config.DB.QueryRow(context.Background(), query, userID).Scan(
		&user.ID, &user.Name, &user.Email, &user.ProfilePicture, &user.EmailNotifications, &user.MonthlyReports,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UPDATE PROFILE
type UpdateProfileInput struct {
	Name               string `json:"name"`
	Email              string `json:"email"`
	ProfilePicture     string `json:"profile_picture"`
	EmailNotifications *bool  `json:"email_notifications"`
	MonthlyReports     *bool  `json:"monthly_reports"`
}

func UpdateProfile(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userID := userIDInterface.(int)

	var input UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if input.Name == "" || input.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and Email are required"})
		return
	}

	// Basic check to see if email is used by another user
	var existingID int
	err := config.DB.QueryRow(
		context.Background(),
		`SELECT id FROM users WHERE email = $1 AND id != $2`,
		input.Email, userID,
	).Scan(&existingID)

	if err == nil && existingID > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Email is already in use by another account"})
		return
	}

	query := `UPDATE users SET name = $1, email = $2, profile_picture = $3, email_notifications = $4, monthly_reports = $5 WHERE id = $6`

	// Handle pointers being nil by using current values if not provided
	var currentEmailNotif, currentMonthlyReports bool
	var currentProfilePic string
	config.DB.QueryRow(context.Background(), "SELECT profile_picture, email_notifications, monthly_reports FROM users WHERE id = $1", userID).Scan(&currentProfilePic, &currentEmailNotif, &currentMonthlyReports)

	emailNotif := currentEmailNotif
	if input.EmailNotifications != nil {
		emailNotif = *input.EmailNotifications
	}
	monthlyRep := currentMonthlyReports
	if input.MonthlyReports != nil {
		monthlyRep = *input.MonthlyReports
	}
	profilePic := currentProfilePic
	if input.ProfilePicture != "" {
		profilePic = input.ProfilePicture
	}

	_, err = config.DB.Exec(context.Background(), query, input.Name, input.Email, profilePic, emailNotif, monthlyRep, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// UPLOAD PROFILE PICTURE
func UploadProfilePicture(c *gin.Context) {
	userIDInterface, _ := c.Get("userID")
	userID := userIDInterface.(int)

	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Validate file extension
	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only JPG, PNG, and WEBP are allowed."})
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	// Unique filename
	filename := fmt.Sprintf("user_%d_%d%s", userID, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, filename)

	// Save file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Update DB - get old pic to delete it
	var oldPic string
	config.DB.QueryRow(context.Background(), "SELECT profile_picture FROM users WHERE id = $1", userID).Scan(&oldPic)

	// URL for frontend
	fileURL := fmt.Sprintf("/uploads/%s", filename)

	_, err = config.DB.Exec(context.Background(), "UPDATE users SET profile_picture = $1 WHERE id = $2", fileURL, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update database"})
		return
	}

	// Delete old pic if it exists and is local
	if oldPic != "" && oldPic != fileURL {
		oldFilePath := filepath.Join(".", oldPic)
		os.Remove(oldFilePath)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Avatar uploaded successfully",
		"url":     fileURL,
	})
}

// CHANGE PASSWORD
type ChangePasswordInput struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

func ChangePassword(c *gin.Context) {
	userIDInterface, _ := c.Get("userID")
	userID := userIDInterface.(int)

	var input ChangePasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input. New password must be at least 6 characters."})
		return
	}

	// 1. Get current password hash
	var hashedPassword string
	err := config.DB.QueryRow(context.Background(), "SELECT password_hash FROM users WHERE id = $1", userID).Scan(&hashedPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify user"})
		return
	}

	// 2. Compare with current password provided
	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(input.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password saat ini salah"})
		return
	}

	// 3. Hash new password
	newHash, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)

	// 4. Update in DB
	_, err = config.DB.Exec(context.Background(), "UPDATE users SET password_hash = $1 WHERE id = $2", string(newHash), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil diubah!"})
}
