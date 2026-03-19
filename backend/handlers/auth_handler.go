package handlers

import (
	"context"
	"finance-tracker/config"
	"finance-tracker/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RegisterInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Register(c *gin.Context) {

	var input RegisterInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	hash, err := utils.HashPassword(input.Password)

	if err != nil {
		c.JSON(500, gin.H{"error": "Password hashing failed"})
		return
	}

	query := `
	INSERT INTO users (name, email, password_hash)
	VALUES ($1,$2,$3)
	RETURNING id
	`

	var userID int

	err = config.DB.QueryRow(
		context.Background(),
		query,
		input.Name,
		input.Email,
		hash,
	).Scan(&userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "User creation failed"})
		return
	}

	// AUTO CREATE DEFAULT CATEGORIES
	defaultCategories := []struct {
		Name string
		Type string
	}{
		{"Food", "expense"},
		{"Transport", "expense"},
		{"Entertainment", "expense"},
		{"Salary", "income"},
	}

	for _, cat := range defaultCategories {

		_, err := config.DB.Exec(
			context.Background(),
			`INSERT INTO categories (user_id,name,type)
			 VALUES ($1,$2,$3)`,
			userID,
			cat.Name,
			cat.Type,
		)

		if err != nil {
			c.JSON(500, gin.H{"error": "Failed creating default categories"})
			return
		}
	}

	token, _ := utils.GenerateToken(userID)

	c.JSON(200, gin.H{
		"message": "User registered",
		"token":   token,
	})
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Login(c *gin.Context) {

	var input LoginInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	query := `
	SELECT id, password_hash
	FROM users
	WHERE email=$1
	`

	var userID int
	var hash string

	err := config.DB.QueryRow(
		context.Background(),
		query,
		input.Email,
	).Scan(&userID, &hash)

	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid email"})
		return
	}

	valid := utils.CheckPassword(input.Password, hash)

	if !valid {
		c.JSON(401, gin.H{"error": "Invalid password"})
		return
	}

	token, _ := utils.GenerateToken(userID)

	c.JSON(200, gin.H{
		"message": "Login success",
		"token":   token,
	})
}

// GOOGLE LOGIN (MOCK)
// WARNING: This implementation is for demonstration purposes only.
// It DOES NOT verify the integrity of the Google ID Token.
// DO NOT USE THIS IN PRODUCTION without implementing proper token verification.
type GoogleLoginInput struct {
	Email string `json:"email" binding:"required"`
	Name  string `json:"name" binding:"required"`
}

func GoogleLogin(c *gin.Context) {
	var input GoogleLoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Check if user exists
	var userID int
	err := config.DB.QueryRow(context.Background(), "SELECT id FROM users WHERE email = $1", input.Email).Scan(&userID)

	if err != nil {
		// User doesn't exist, create one
		query := `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`
		err = config.DB.QueryRow(context.Background(), query, input.Name, input.Email, "social-auth-password-placeholder").Scan(&userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user from Google account"})
			return
		}

		// Create default categories for new user
		defaultCategories := []struct {
			Name string
			Type string
		}{
			{"Food", "expense"},
			{"Transport", "expense"},
			{"Entertainment", "expense"},
			{"Salary", "income"},
		}

		for _, cat := range defaultCategories {
			config.DB.Exec(context.Background(), `INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3)`, userID, cat.Name, cat.Type)
		}
	}

	token, _ := utils.GenerateToken(userID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Google login successful",
		"token":   token,
	})
}